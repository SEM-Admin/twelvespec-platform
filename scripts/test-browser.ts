import { spawn } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { createConnection } from "node:net";
import { Client } from "pg";
import { loadEnv } from "./env";

const root = loadEnv();
function portInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: "127.0.0.1", port });
    const finish = (used: boolean) => {
      socket.destroy();
      resolve(used);
    };
    socket.setTimeout(1000, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function main() {
  const url = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1"].includes(url.hostname))
    throw new Error("Browser tests require isolated local PostgreSQL.");
  if ((await Promise.all([portInUse(3000), portInUse(3001)])).some(Boolean))
    throw new Error(
      "Stop the local storefront and Commerce OS before running the isolated browser suite. Focused npx playwright tests may use a running synthetic preview.",
    );
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  const database =
    "twelvespec_browser_test_" + randomUUID().replaceAll("-", "");
  let created = false;
  try {
    await admin.query(`create database ${database}`);
    created = true;
    url.pathname = "/" + database;
    const env = {
      ...process.env,
      DATABASE_URL: url.toString(),
      TWELVESPEC_ROOT: root,
      TWELVESPEC_ENV: "test",
      TWELVESPEC_DEMO_PASSWORD: "TwelveSpec-Demo-2026!",
      BETTER_AUTH_SECRET: randomBytes(48).toString("base64url"),
      ASSET_SIGNING_KEY: randomBytes(32).toString("hex"),
      WEBHOOK_SIGNING_KEY: randomBytes(32).toString("hex"),
    };
    console.log(
      "Browser suite uses a fresh disposable local database; saved preview data is unchanged.",
    );
    process.exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          root + "/node_modules/@playwright/test/cli.js",
          "test",
          ...process.argv.slice(2),
        ],
        { cwd: root, env, stdio: "inherit" },
      );
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
  } finally {
    // The identifier is generated above, never supplied by a URL or user input.
    if (created) await admin.query(`drop database ${database} with(force)`);
    await admin.end();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Isolated browser verification failed.",
  );
  process.exitCode = 1;
});
