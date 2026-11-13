import { afterAll, it, expect } from "vitest";
import { loadEnv } from "../../scripts/env";
import { localRestoreDrill } from "../../packages/kernel/src/backup";
import { actors } from "../helpers";
import {
  create,
  get,
  hash,
  pool,
  transaction,
  type Row,
} from "../../packages/kernel/src";
import {
  handleNativeSupplier,
  meteredCall,
} from "../../packages/supplier/src/native";
import type { ApiPolicy } from "../../packages/supplier/src/api-budget";
import {
  recordPriceObservation,
  registerEvidenceSource,
} from "../../packages/intelligence/src";
import { websiteWorkspace } from "../../packages/marketing/src/website";
import { saveWebsiteDocument } from "../../packages/marketing/src/website/documents";
import { newWebsiteSection } from "../../packages/contracts/src/website";

afterAll(async () => {
  await pool().end();
});
it("A39 restores complete scoped data, CIA citations and typed binary fields into a fresh local PostgreSQL database", async () => {
  const root = loadEnv(),
    { owner } = await actors();
  await transaction(owner, async (tx) => {
    const site = (await websiteWorkspace(tx, owner)).site!,
      source = await registerEvidenceSource(tx, owner, {
        sourceKey: crypto.randomUUID(),
        title: "SYNTHETIC restore source",
        publisher: "Synthetic restore fixture",
        edition: "test/1",
        contentHash: hash("synthetic restore evidence"),
        origin: "SYNTHETIC",
        rightsReference: "Synthetic test only",
        allowedUses: ["INTERNAL_RESEARCH", "QUOTE_COST", "PUBLIC_CLAIM"],
        rightsValidFrom: new Date(Date.now() - 60000).toISOString(),
        rightsValidUntil: new Date(Date.now() + 86400000).toISOString(),
        retentionUntil: new Date(Date.now() + 172800000).toISOString(),
        parserVersion: "fixture/1",
      });
    const product = (
      await tx.query(
        "select id,revision from app.products where status='PUBLISHED' order by id limit 1",
      )
    ).rows[0];
    const variant = (
      await tx.query(
        "select id,revision from app.variants where product_id=$1 and status<>'ARCHIVED' order by id limit 1",
        [product.id],
      )
    ).rows[0];
    await recordPriceObservation(tx, owner, {
      sourceId: source.id,
      observationKey: crypto.randomUUID(),
      productId: product.id,
      variantId: variant.id,
      expectedProductRevision: product.revision,
      expectedVariantRevision: variant.revision,
      priceClass: "DISTRIBUTOR_NET",
      originalValue: "0.0250",
      currency: "USD",
      unitBasis: "EACH",
      unitsPerPrice: 1,
      minimumQuantity: 1,
      maximumQuantity: 1000,
      orderMultiple: 1,
      territory: "US",
      channel: "DIRECT",
      observedAt: new Date().toISOString(),
      effectiveFrom: new Date(Date.now() - 60000).toISOString(),
      effectiveUntil: new Date(Date.now() + 86400000).toISOString(),
      freshnessHours: 24,
      evidenceState: "SYNTHETIC",
    });
    const section = newWebsiteSection("capability_claims");
    section.content.entries = [
      {
        id: crypto.randomUUID(),
        statement: "Synthetic unverified restore assertion",
        context: "Test only",
        limitations: "Not available",
        capability: "PROJECT_INQUIRY",
        status: "UNVERIFIED_DO_NOT_PUBLISH",
        deliveryModel: "PLATFORM_WORKFLOW",
        scope: {
          service: "PROJECT_WORKFLOW",
          territory: "US",
          channel: "WEBSITE",
        },
        authoringOrigin: "UNKNOWN",
        confidence: "UNVERIFIED",
        sourceIds: [source.id],
        reviewReference: "",
      },
    ];
    await saveWebsiteDocument(tx, owner, {
      document: {
        schemaVersion: 1,
        siteId: site.id,
        documentType: "WEBSITE_PAGE",
        title: "Synthetic restore fixture",
        path: "/restore-" + crypto.randomUUID(),
        seo: {
          title: "Synthetic restore",
          description: "Not published",
          noIndex: true,
        },
        sections: [section],
      },
    });
    await create(tx, owner, "assets", {
      title: "SYNTHETIC binary restore fixture",
      status: "QUARANTINED",
      site_id: site.id,
      web_bytes: Buffer.from([0, 1, 2, 127, 255]),
      data: {
        kind: "SYNTHETIC_BACKUP_BINARY",
        bufferShapedJson: { type: "Buffer", data: [9, 8, 7] },
      },
    });
  });
  // Recovery must retain budget receipts/cache and ciphertext, not reset a
  // supplier's allowance. The dispatch is synthetic and performs no HTTP call.
  const clientId = "synthetic-restore-" + crypto.randomUUID();
  const created = (await handleNativeSupplier(owner, "api_create_connection", {
    providerType: "SINALITE",
    environment: "mock",
    displayName: "SYNTHETIC restore meter",
    accountIdentifier: clientId,
  })) as { id: string };
  const dashboard = (await handleNativeSupplier(owner, "api_dashboard", {
    id: created.id,
  })) as { policy: ApiPolicy; revision: number };
  await handleNativeSupplier(owner, "api_save_policy", {
    id: created.id,
    policy: { ...dashboard.policy, enabled: true, monthlyCalls: 2 },
    expectedRevision: dashboard.revision,
    reason: "SYNTHETIC recovery test only",
  });
  await handleNativeSupplier(owner, "api_save_credentials", {
    id: created.id,
    credentials: {
      clientId,
      clientSecret: "synthetic-test-only-secret",
    },
  });
  const connection = (await transaction(owner, (tx) =>
    get(tx, owner, "connections", created.id),
  )) as Row;
  const credentialVersion = Number(connection.data.credentialVersion ?? 0);
  let dispatched = 0;
  const dispatch = async () => {
    dispatched++;
    return { items: [{ id: 1, name: "SYNTHETIC cached restore product" }] };
  };
  await meteredCall(
    owner,
    connection,
    "catalog",
    {},
    crypto.randomUUID(),
    "restore-run",
    credentialVersion,
    dispatch,
  );
  const cached = await meteredCall(
    owner,
    connection,
    "catalog",
    {},
    crypto.randomUUID(),
    "restore-run",
    credentialVersion,
    dispatch,
  );
  expect(cached.cacheHit).toBe(true);
  expect(dispatched).toBe(1);
  const result = await localRestoreDrill(root, process.env.DATABASE_URL!);
  expect(result.verification).toBe("LOCAL_SYNTHETIC_RESTORE_VERIFIED");
  expect(result.tables).toBeGreaterThan(100);
  expect(result.counts.intelligence_sources.source).toBeGreaterThan(0);
  expect(result.counts.content_references.source).toBeGreaterThan(0);
  expect(result.counts.price_observations.source).toBeGreaterThan(0);
  for (const table of [
    "intelligence_sources",
    "intelligence_restrictions",
    "price_observations",
    "price_assessments",
    "process_profile_versions",
    "commercial_qualifications",
    "qualification_cost_evidence",
    "supplier_api_billing_groups",
    "supplier_api_accounts",
    "supplier_api_calls",
    "supplier_api_cache",
    "supplier_api_secrets",
  ])
    expect(result.counts[table]).toBeDefined();
  expect(result.contentVerified).toBe(true);
  expect(result.counts.supplier_api_calls.source).toBeGreaterThan(0);
  expect(result.counts.supplier_api_cache.source).toBeGreaterThan(0);
  expect(result.counts.supplier_api_secrets.source).toBeGreaterThan(0);
  expect(result.identityTablesVerified).toBeGreaterThan(0);
  expect(result.foreignKeysValidated).toBeGreaterThan(100);
  expect(result.productionBackupVerified).toBe(false);
}, 60000);
