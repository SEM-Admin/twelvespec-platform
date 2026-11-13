/** Synthetic LOCAL restore drill. Production backup/storage activation remains independently gated. */
import { Client, types as pgTypes, type CustomTypesConfig } from "pg";
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  rmSync,
} from "node:fs";
import { resolve } from "node:path";
import { fail, hash } from "./index";
const bootstrap = [
  "tenants",
  "workspaces",
  "user",
  "session",
  "account",
  "verification",
  "memberships",
  "rateLimit",
] as const;
const quote = (v: string) => '"' + v.replaceAll('"', '""') + '"';
// A backup must preserve PostgreSQL microseconds instead of coercing timestamps
// through JavaScript Date. This parser is confined to the two drill clients.
const snapshotTypes: CustomTypesConfig = {
  getTypeParser(id, format) {
    return format !== "binary" && [1082, 1114, 1184].includes(id)
      ? (value: string) => value
      : pgTypes.getTypeParser(id, format);
  },
};
export async function localRestoreDrill(root: string, urlString: string) {
  const url = new URL(urlString);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    fail("LOCAL_RESTORE_ONLY", 403);
  const source = new Client({
    connectionString: url.toString(),
    types: snapshotTypes,
  });
  await source.connect();
  const db = "twelvespec_restore_" + Date.now();
  const dir = resolve(root, ".local/backups");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const file = resolve(dir, db + ".json");
  let restore: Client | undefined;
  let created = false;
  try {
    await source.query("set timezone='UTC'");
    await source.query("begin isolation level repeatable read read only");
    // TABLES is the generic operational-row API inventory, not a backup catalog.
    // Evidence ledgers have different row contracts but must still be recovered.
    const appTables = (
      await source.query(
        "select tablename from pg_tables where schemaname='app' order by tablename",
      )
    ).rows.map((row) => String(row.tablename));
    const data: Record<string, Record<string, unknown>[]> = {};
    for (const table of bootstrap)
      data["public." + table] = (
        await source.query(`select * from public.${quote(table)}`)
      ).rows;
    for (const table of appTables)
      data["app." + table] = (
        await source.query(`select * from app.${quote(table)}`)
      ).rows;
    const contentHashes: Record<string, string> = {};
    for (const qualified of Object.keys(data)) {
      const [schema, table] = qualified.split(".");
      contentHashes[qualified] = await canonicalTableHash(
        source,
        schema,
        table,
      );
    }
    const byteaColumns: Record<string, string[]> = {};
    for (const row of (
      await source.query(
        "select n.nspname,c.relname,a.attname from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','app') and c.relkind='r' and a.attnum>0 and not a.attisdropped and a.atttypid='bytea'::regtype",
      )
    ).rows) {
      const key = row.nspname + "." + row.relname;
      if (data[key]) {
        byteaColumns[key] ??= [];
        byteaColumns[key].push(row.attname);
      }
    }
    writeFileSync(
      file,
      JSON.stringify({
        format: 2,
        syntheticOnly: true,
        tables: data,
        byteaColumns,
        contentHashes,
      }),
      { mode: 0o600 },
    );
    await source.query("commit");
    await source.query(`create database ${quote(db)}`);
    created = true;
    url.pathname = "/" + db;
    restore = new Client({
      connectionString: url.toString(),
      types: snapshotTypes,
    });
    await restore.connect();
    await restore.query("set timezone='UTC'");
    for (const fileName of readdirSync(resolve(root, "database/migrations"))
      .filter((f) => f.endsWith(".sql"))
      .sort())
      await restore.query(
        readFileSync(resolve(root, "database/migrations", fileName), "utf8"),
      );
    // Deferral is confined to this brand-new restore target; all constraints validate on commit.
    const fks = (
      await restore.query(
        "select n.nspname,c.relname,con.conname from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where con.contype='f' and n.nspname in ('public','app')",
      )
    ).rows;
    for (const fk of fks)
      await restore.query(
        `alter table ${quote(fk.nspname)}.${quote(fk.relname)} alter constraint ${quote(fk.conname)} deferrable initially deferred`,
      );
    await restore.query("begin");
    await restore.query("set constraints all deferred");
    const saved = JSON.parse(readFileSync(file, "utf8")) as {
      tables: typeof data;
      byteaColumns: typeof byteaColumns;
      contentHashes: typeof contentHashes;
    };
    for (const [table, rows] of Object.entries(saved.tables))
      for (const row of rows) {
        const columns = Object.keys(row);
        const [schema, name] = table.split(".");
        await restore.query(
          `insert into ${quote(schema)}.${quote(name)} (${columns.map(quote).join(",")}) values (${columns.map((_, i) => "$" + (i + 1)).join(",")})`,
          columns.map((c) => {
            const value = row[c];
            if (value === null || !saved.byteaColumns[table]?.includes(c))
              return value;
            const bytes = value as { type?: string; data?: number[] };
            if (bytes.type !== "Buffer" || !Array.isArray(bytes.data))
              fail("RESTORE_BINARY_FORMAT_INVALID");
            return Buffer.from(bytes.data);
          }),
        );
      }
    await restore.query("commit");
    const counts: Record<string, { source: number; restored: number }> = {};
    // Compare contents as well as counts: source precision, immutable references,
    // JSON and typed bytea must survive. Do not coerce Buffer-shaped JSONB values.
    for (const [qualified, original] of Object.entries(saved.tables)) {
      const [schema, table] = qualified.split("."),
        rows = (
          await restore.query(`select * from ${quote(schema)}.${quote(table)}`)
        ).rows;
      if (rows.length !== original.length) fail("RESTORE_COUNT_MISMATCH");
      if (
        (await canonicalTableHash(restore, schema, table)) !==
        saved.contentHashes[qualified]
      )
        fail("RESTORE_CONTENT_MISMATCH: " + qualified);
      if (schema === "app") {
        if (
          JSON.stringify(groupCounts(original)) !==
          JSON.stringify(groupCounts(rows))
        )
          fail("RESTORE_SCOPE_MISMATCH");
        counts[table] = { source: original.length, restored: rows.length };
      }
    }
    return {
      verification: "LOCAL_SYNTHETIC_RESTORE_VERIFIED",
      tables: Object.keys(counts).length,
      identityTablesVerified: bootstrap.length,
      contentVerified: true,
      counts,
      foreignKeysValidated: fks.length,
      productionBackupVerified: false,
    };
  } finally {
    await restore?.end();
    if (created)
      await source.query(`drop database if exists ${quote(db)} with(force)`);
    await source.end();
    rmSync(file, { force: true });
  }
}
function groupCounts(rows: Record<string, unknown>[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const k = String(row.tenant_id) + "/" + String(row.workspace_id);
    counts[k] = (counts[k] ?? 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort());
}
async function canonicalTableHash(
  client: Client,
  schema: string,
  table: string,
) {
  // PostgreSQL serializes its exact typed values before JavaScript can round a
  // numeric or timestamp. Row order does not determine backup content identity.
  const rows = (
    await client.query(
      `select to_jsonb(r)::text encoded from ${quote(schema)}.${quote(table)} r`,
    )
  ).rows;
  return hash(rows.map((row) => String(row.encoded)).sort());
}
