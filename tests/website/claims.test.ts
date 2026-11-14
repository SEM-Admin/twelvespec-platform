import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { actors } from "../helpers";
import {
  create,
  get,
  hash,
  pool,
  transaction,
  update,
  type Actor,
  type Input,
  type Row,
} from "../../packages/kernel/src";
import {
  registerEvidenceSource,
  restrictEvidenceSource,
  type EvidenceSource,
} from "../../packages/intelligence/src";
import { handleStores } from "../../packages/stores/src";
import {
  handleWebsite,
  initializeWebsite,
  draftWebsitePreview,
} from "../../packages/marketing/src/website";
import {
  saveWebsiteDocument,
  approveWebsiteRevision,
} from "../../packages/marketing/src/website/documents";
import {
  publishWebsiteChanges,
  processWebsitePublishJob,
} from "../../packages/marketing/src/website/releases";
import {
  readPublishedWebsite,
  withWebsiteReader,
} from "../../packages/marketing/src/website/repository";
import {
  newWebsiteSection,
  parseWebsiteDocument,
  type PageDocument,
} from "../../packages/contracts/src/website";
import {
  capabilityClaimSchema,
  claimPublicationIssues,
  type CapabilityClaim,
} from "../../packages/contracts/src/claims";
import type {
  WebsiteRecord,
  WebsiteRevision,
  WebsiteSite,
} from "../../packages/marketing/src/website/model";

let owner: Actor, customer: Actor, otherOwner: Actor, marketing: Actor;
beforeAll(async () => {
  ({ owner, customer, otherOwner } = await actors());
  const id = crypto.randomUUID();
  await pool().query('insert into "user"(id,name,email) values($1,$2,$3)', [
    id,
    "Claim editor",
    `claim-editor-${id}@example.test`,
  ]);
  await pool().query(
    "insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)",
    [id, owner.tenantId, owner.workspaceId, "marketing"],
  );
  marketing = { ...owner, userId: id, role: "marketing" };
});
afterAll(async () => {
  vi.useRealTimers();
  await pool().end();
});
const iso = (offset = 0) => new Date(Date.now() + offset).toISOString();
function claim(
  sourceIds: string[],
  patch: Partial<CapabilityClaim> = {},
): CapabilityClaim {
  return {
    id: crypto.randomUUID(),
    statement: "A reviewed project inquiry",
    context: "Synthetic acceptance scenario only.",
    limitations:
      "Subject to operator review; no paid order, stock or delivery guarantee.",
    capability: "PROJECT_INQUIRY",
    status: "CONDITIONAL_OR_QUOTE_FIRST",
    deliveryModel: "PLATFORM_WORKFLOW",
    scope: { service: "PROJECT_WORKFLOW", territory: "US", channel: "WEBSITE" },
    authoringOrigin: "HUMAN",
    confidence: "DOCUMENTED",
    sourceIds,
    reviewReference: "PRIVATE REVIEW LOCATOR — must not be public",
    verifiedAt: iso(-60000),
    effectiveFrom: iso(-60000),
    expiresAt: iso(86400000),
    ...patch,
  };
}
function sourceInput(patch: Input = {}) {
  return {
    sourceKey: crypto.randomUUID(),
    title: "Synthetic test document for public-use policy",
    publisher: "PRIVATE WHOLESALE PUBLISHER",
    edition: "test/1",
    sourceUri: "https://example.test/private-wholesale-reference",
    contentHash: hash("synthetic policy fixture"),
    origin: "OPERATOR_DOCUMENT",
    rightsReference:
      "PRIVATE RIGHTS AGREEMENT — isolated policy fixture, not a real license",
    allowedUses: ["INTERNAL_RESEARCH", "PUBLIC_CLAIM"],
    rightsValidFrom: iso(-60000),
    rightsValidUntil: iso(2 * 86400000),
    retentionUntil: iso(3 * 86400000),
    parserVersion: "fixture/1",
    ...patch,
  };
}
const source = (patch: Input = {}, actor = owner) =>
  transaction(actor, (tx) =>
    registerEvidenceSource(tx, actor, sourceInput(patch)),
  );
async function fixture(privateStore = false) {
  const site = await transaction(owner, async (tx) => {
    const store = (await handleStores(tx, owner, "create_store", {
      title: "Synthetic claim policy site",
      type: "CORPORATE_ON_GOING",
    })) as Row;
    await handleStores(tx, owner, "approve", { id: store.id });
    if (!privateStore)
      await update(tx, owner, "stores", store.id, {
        data: { ...store.data, visibility: "PUBLIC" },
      });
    await initializeWebsite(tx, owner, store.id);
    return (
      await tx.query(
        "select * from app.websites where tenant_id=$1 and workspace_id=$2 and store_id=$3",
        [owner.tenantId, owner.workspaceId, store.id],
      )
    ).rows[0] as WebsiteSite;
  });
  const document = (entries: CapabilityClaim[]): PageDocument => {
    const section = newWebsiteSection("capability_claims");
    section.content = { heading: "Our supported capabilities", entries };
    const narrative = newWebsiteSection("rich_text_image");
    return {
      schemaVersion: 1,
      siteId: site.id,
      documentType: "WEBSITE_PAGE",
      title: "Policy test",
      path: "/claim-policy",
      seo: {
        title: "Policy test",
        description: "Synthetic website claim acceptance.",
        noIndex: true,
      },
      sections: [narrative, section],
    };
  };
  const save = (entries: CapabilityClaim[], actor = owner) =>
    transaction(actor, (tx) =>
      saveWebsiteDocument(tx, actor, {
        document: document(entries),
        reason: "Synthetic policy test",
      }),
    );
  const publish = (
    saved: { record: WebsiteRecord; revision: WebsiteRevision },
    extra: Input = {},
  ) =>
    transaction(owner, async (tx) => {
      const current = await get(tx, owner, "websites", site.id);
      return publishWebsiteChanges(tx, owner, {
        siteId: site.id,
        expectedGeneration: current.generation,
        changes: [
          {
            documentId: saved.record.id,
            revisionId: saved.revision.id,
            expectedRevision: saved.record.revision,
          },
        ],
        approveSelected: true,
        reason: "Synthetic policy publication",
        ...extra,
      });
    });
  const identity = { tenantId: owner.tenantId, workspaceId: owner.workspaceId };
  const read = (userId?: string) =>
    readPublishedWebsite(
      { ...identity, ...(userId ? { userId } : {}) },
      "/claim-policy",
      site.store_id!,
    );
  return { site, document, save, publish, read, identity };
}

describe("Evidence-backed service claims use the existing editorial release", () => {
  it("duplicates assertions as new identities while preserving private source attribution", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    const copy = (await transaction(owner, (tx) =>
      handleWebsite(tx, owner, "duplicate_page", {
        id: saved.record.id,
        path: "/copied-claims",
      }),
    )) as { record: WebsiteRecord; revision: WebsiteRevision };
    const document = copy.revision.data.document as PageDocument;
    const copied = (
      document.sections.find((section) => section.type === "capability_claims")!
        .content.entries as CapabilityClaim[]
    )[0];
    expect(copied.id).not.toBe(entry.id);
    expect(copied.sourceIds).toEqual([s.id]);
    expect(document.sections[1].id).not.toBe(
      (saved.revision.data.document as PageDocument).sections[1].id,
    );
    const citation = await transaction(
      owner,
      async (tx) =>
        (
          await tx.query(
            "select data from app.content_references where source_revision_id=$1 and evidence_source_id=$2",
            [copy.revision.id, s.id],
          )
        ).rows[0],
    );
    expect(citation.data.claimId).toBe(copied.id);
    expect(copy.record.status).toBe("DRAFT");
  });
  it("keeps incomplete assertions as drafts but prevents approval/publication", async () => {
    const f = await fixture(),
      saved = await f.save([
        claim([], {
          status: "UNVERIFIED_DO_NOT_PUBLISH",
          confidence: "UNVERIFIED",
          authoringOrigin: "UNKNOWN",
          verifiedAt: undefined,
        }),
      ]);
    expect((await f.read())?.page).toBeNull();
    await expect(
      transaction(owner, (tx) =>
        approveWebsiteRevision(
          tx,
          owner,
          saved.revision.id,
          f.site.id,
          "Review",
        ),
      ),
    ).rejects.toThrow("WEBSITE_CLAIM_NOT_PUBLISHABLE");
    await expect(f.publish(saved)).rejects.toThrow(
      "WEBSITE_CLAIM_NOT_PUBLISHABLE",
    );
  });
  it("requires explicit public permission without elevating old source editions or fingerprints", async () => {
    const input = sourceInput({
        allowedUses: ["INTERNAL_RESEARCH", "QUOTE_COST"],
      }),
      original = await transaction(owner, (tx) =>
        registerEvidenceSource(tx, owner, input),
      );
    expect(
      (
        await transaction(owner, (tx) =>
          registerEvidenceSource(tx, owner, input),
        )
      ).fingerprint,
    ).toBe(original.fingerprint);
    await expect(
      transaction(owner, (tx) =>
        registerEvidenceSource(tx, owner, {
          ...input,
          allowedUses: ["INTERNAL_RESEARCH", "QUOTE_COST", "PUBLIC_CLAIM"],
        }),
      ),
    ).rejects.toThrow("EVIDENCE_SOURCE_KEY_CONFLICT");
    const f = await fixture();
    await expect(f.save([claim([original.id])])).rejects.toThrow(
      "WEBSITE_CLAIM_PUBLIC_SOURCE_REQUIRED",
    );
  });
  it("rejects synthetic evidence at publication despite an available truth status", async () => {
    const f = await fixture(),
      s = await source({ origin: "SYNTHETIC" }),
      saved = await f.save([claim([s.id])]);
    await expect(f.publish(saved)).rejects.toThrow(
      "WEBSITE_CLAIM_EVIDENCE_UNAVAILABLE",
    );
  });
  it("publishes an exact approved revision and strips every private citation field", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    await f.publish(saved);
    const page = await f.read(),
      serialized = JSON.stringify(page);
    expect(
      page?.page?.sections.find((s) => s.type === "capability_claims")?.content
        .entries,
    ).toEqual([
      {
        statement: entry.statement,
        context: entry.context,
        limitations: entry.limitations,
        scope: entry.scope,
        availability: "Subject to a reviewed quote",
        delivery: "TwelveSpec project workflow",
      },
    ]);
    for (const privateValue of [
      s.id,
      s.source_uri,
      s.publisher,
      s.content_hash,
      entry.id,
      entry.reviewReference,
      "sourceIds",
      "reviewReference",
      "rightsReference",
      "fingerprint",
    ])
      expect(serialized).not.toContain(privateValue);
    const citation = await transaction(
      owner,
      async (tx) =>
        (
          await tx.query(
            "select * from app.content_references where source_revision_id=$1 and evidence_source_id=$2",
            [saved.revision.id, s.id],
          )
        ).rows[0],
    );
    expect(citation.data.claimId).toBe(entry.id);
    expect(citation.data.purpose).toBe("CLAIM_SUPPORT");
    expect(
      (
        await transaction(owner, (tx) =>
          tx.query("update app.content_references set data=$2 where id=$1", [
            citation.id,
            {},
          ]),
        )
      ).rowCount,
    ).toBe(0);
    await expect(
      pool().query("update app.content_references set data=$2 where id=$1", [
        citation.id,
        {},
      ]),
    ).rejects.toThrow("IMMUTABLE_RECORD");
  });
  it("withholds revoked evidence on the next read while preserving the manifest and narrative", async () => {
    const f = await fixture(),
      s = await source(),
      saved = await f.save([claim([s.id])]);
    await f.publish(saved);
    const before = await f.read();
    expect(
      before?.page?.sections.some((s) => s.type === "capability_claims"),
    ).toBe(true);
    await transaction(owner, (tx) =>
      restrictEvidenceSource(tx, owner, {
        sourceId: s.id,
        reason: "Synthetic revocation",
      }),
    );
    const after = await f.read();
    expect(after?.releaseId).toBe(before?.releaseId);
    expect(after?.generation).toBe(before?.generation);
    expect(after?.page?.sections.map((s) => s.type)).toEqual([
      "rich_text_image",
    ]);
    const record = await transaction(owner, (tx) =>
      get(tx, owner, "content_revisions", saved.revision.id),
    );
    expect(record.data.document).toEqual(saved.revision.data.document);
  });
  it("requires every supporting source to remain eligible", async () => {
    const f = await fixture(),
      a = await source(),
      b = await source(),
      saved = await f.save([claim([a.id, b.id])]);
    await f.publish(saved);
    await transaction(owner, (tx) =>
      restrictEvidenceSource(tx, owner, {
        sourceId: b.id,
        reason: "Second source withdrawn",
      }),
    );
    expect(
      (await f.read())?.page?.sections.some(
        (s) => s.type === "capability_claims",
      ),
    ).toBe(false);
  });
  it("withholds expired claims at read time and rejects future, retired or unreviewed assertions", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    await f.publish(saved);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(Date.parse(entry.expiresAt!) + 1));
    try {
      expect(
        (await f.read())?.page?.sections.some(
          (s) => s.type === "capability_claims",
        ),
      ).toBe(false);
    } finally {
      vi.useRealTimers();
    }
    for (const patch of [
      { effectiveFrom: iso(60000) },
      { verifiedAt: iso(60000) },
      { status: "RETIRED" },
      { authoringOrigin: "UNKNOWN" },
      { confidence: "UNVERIFIED" },
      { reviewReference: "" },
    ] as Partial<CapabilityClaim>[]) {
      expect(
        claimPublicationIssues(claim([s.id], patch)).length,
      ).toBeGreaterThan(0);
    }
  });
  it("expires source permission in PostgreSQL even while the claim remains effective", async () => {
    const f = await fixture(),
      s = await source({ rightsValidUntil: iso(5000) }),
      saved = await f.save([claim([s.id])]);
    await f.publish(saved);
    expect(
      (await f.read())?.page?.sections.some(
        (s) => s.type === "capability_claims",
      ),
    ).toBe(true);
    await new Promise((resolve) =>
      setTimeout(
        resolve,
        Math.max(0, new Date(s.rights_valid_until).getTime() - Date.now() + 50),
      ),
    );
    expect(
      (await f.read())?.page?.sections.some(
        (s) => s.type === "capability_claims",
      ),
    ).toBe(false);
  });
  it("blocks future manufacturing technologies as available and clearly publishes plans as Coming Soon", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id], {
        capability: "CAD_ENGINEERING",
        deliveryModel: "FUTURE_UNAVAILABLE",
      }),
      saved = await f.save([entry]);
    await expect(f.publish(saved)).rejects.toThrow("Coming Soon");
    const planned = await transaction(owner, (tx) =>
      saveWebsiteDocument(tx, owner, {
        id: saved.record.id,
        expectedRevision: saved.record.revision,
        document: f.document([{ ...entry, status: "PLANNED_NOT_AVAILABLE" }]),
      }),
    );
    await f.publish(planned);
    const assertions = (await f.read())?.page?.sections.find(
      (s) => s.type === "capability_claims",
    )?.content.entries as Input[];
    expect(assertions[0].availability).toBe("Coming Soon");
    expect(assertions[0].delivery).toBe("Not currently available");
  });
  it("retains mandatory managed-specialist and illustrative-proof qualifications", async () => {
    const f = await fixture(),
      s = await source(),
      managed = claim([s.id], {
        capability: "MANAGED_PRINT",
        deliveryModel: "MANAGED_SPECIALIST",
        scope: { service: "PRINT", territory: "US", channel: "WEBSITE" },
      }),
      proof = claim([s.id], { capability: "ILLUSTRATIVE_2D_PROOF" });
    const saved = await f.save([managed, proof]);
    await f.publish(saved);
    const entries = (await f.read())?.page?.sections.find(
      (s) => s.type === "capability_claims",
    )?.content.entries as Input[];
    expect(entries[0].delivery).toContain("specialist production partners");
    expect(entries[1].delivery).toContain("Illustrative placement only");
    expect(
      claimPublicationIssues({
        ...managed,
        deliveryModel: "PLATFORM_WORKFLOW",
      }),
    ).toContain("Claim delivery model does not match the capability");
  });
  it("rechecks revoked sources for already approved revisions, scheduled activation and rollback", async () => {
    const f = await fixture(),
      s = await source(),
      saved = await f.save([claim([s.id])]);
    const prior = process.env.WEBSITE_SCHEDULER_ENABLED;
    process.env.WEBSITE_SCHEDULER_ENABLED = "1";
    try {
      const local = new Date(Date.now() + 3600000).toISOString().slice(0, 16);
      const scheduled = (await f.publish(saved, {
        schedule: { localDateTime: local, timezone: "UTC" },
      })) as { job: Row; release: Row };
      await transaction(owner, (tx) =>
        restrictEvidenceSource(tx, owner, {
          sourceId: s.id,
          reason: "Withdraw before activation",
        }),
      );
      const status = await transaction(owner, (tx) =>
        processWebsitePublishJob(
          tx,
          owner,
          scheduled.job.id,
          new Date(Date.now() + 7200000),
        ),
      );
      expect(status).toMatchObject({ status: "BLOCKED" });
      await expect(f.publish(saved)).rejects.toThrow(
        "WEBSITE_CLAIM_EVIDENCE_UNAVAILABLE",
      );
      const current = await transaction(owner, (tx) =>
        get(tx, owner, "websites", f.site.id),
      );
      await expect(
        transaction(owner, (tx) =>
          handleWebsite(tx, owner, "rollback_site", {
            siteId: f.site.id,
            expectedGeneration: current.generation,
            releaseId: scheduled.release.id,
            idempotencyKey: crypto.randomUUID(),
            reason: "Try historical invalid release",
          }),
        ),
      ).rejects.toThrow("WEBSITE_CLAIM_EVIDENCE_UNAVAILABLE");
    } finally {
      if (prior === undefined) delete process.env.WEBSITE_SCHEDULER_ENABLED;
      else process.env.WEBSITE_SCHEDULER_ENABLED = prior;
    }
  });
  it("keeps hidden unverified assertions out of the public projection", async () => {
    const f = await fixture(),
      document = f.document([
        claim([], { status: "UNVERIFIED_DO_NOT_PUBLISH" }),
      ]);
    document.sections[1].visible = false;
    const saved = await transaction(owner, (tx) =>
      saveWebsiteDocument(tx, owner, { document }),
    );
    await f.publish(saved);
    expect((await f.read())?.page?.sections.map((s) => s.type)).toEqual([
      "rich_text_image",
    ]);
  });
  it("rejects duplicate claim identities, unsupported product-specific assertions and date inversions", () => {
    const entry = claim([]);
    expect(
      capabilityClaimSchema.safeParse({
        ...entry,
        productId: crypto.randomUUID(),
      }).success,
    ).toBe(false);
    expect(
      capabilityClaimSchema.safeParse({
        ...entry,
        sourceIds: [owner.workspaceId, owner.workspaceId],
      }).success,
    ).toBe(false);
    expect(
      capabilityClaimSchema.safeParse({ ...entry, expiresAt: iso(-120000) })
        .success,
    ).toBe(false);
    const section = newWebsiteSection("capability_claims");
    section.content.entries = [entry, entry];
    expect(() =>
      parseWebsiteDocument({
        schemaVersion: 1,
        siteId: owner.workspaceId,
        documentType: "WEBSITE_PAGE",
        title: "Duplicate",
        path: "/duplicate-claims",
        seo: { title: "Test", description: "Test", noIndex: true },
        sections: [section],
      }),
    ).toThrow("WEBSITE_CLAIM_IDS_DUPLICATED");
  });
});

describe("Claim evidence respects site capabilities and public-reader isolation", () => {
  it("preserves store-admin page editing without exposing internal claim drafts, history or evidence", async () => {
    const f = await fixture(true),
      s = await source(),
      saved = await f.save([claim([s.id])]);
    await f.publish(saved);
    const id = crypto.randomUUID();
    await pool().query('insert into "user"(id,name,email) values($1,$2,$3)', [
      id,
      "Synthetic store editor",
      `store-editor-${id}@example.test`,
    ]);
    await pool().query(
      "insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,'store_admin')",
      [id, owner.tenantId, owner.workspaceId],
    );
    const editor: Actor = { ...owner, userId: id, role: "store_admin" };
    await transaction(owner, (tx) =>
      handleStores(tx, owner, "add_member", {
        storeId: f.site.store_id,
        userId: id,
      }),
    );
    const ordinary = (await transaction(editor, (tx) =>
      handleWebsite(tx, editor, "create_page", {
        siteId: f.site.id,
        title: "Ordinary store page",
        path: "/store-editor-page",
      }),
    )) as { record: WebsiteRecord; revision: WebsiteRevision };
    expect(ordinary.record.owner_id).toBe(id);
    await expect(
      transaction(editor, (tx) =>
        handleWebsite(tx, editor, "claim_sources", { siteId: f.site.id }),
      ),
    ).rejects.toThrow("WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED");
    await expect(
      transaction(editor, (tx) =>
        tx.query("select app.website_claim_source_choices($1,$2,$3,'',1)", [
          owner.tenantId,
          owner.workspaceId,
          f.site.id,
        ]),
      ),
    ).rejects.toThrow("WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED");
    await expect(
      transaction(editor, (tx) =>
        handleWebsite(tx, editor, "get_document", { id: saved.record.id }),
      ),
    ).rejects.toThrow("NOT_FOUND");
    await expect(
      transaction(editor, (tx) =>
        draftWebsitePreview(tx, editor, f.site.id, saved.revision.id),
      ),
    ).rejects.toThrow("NOT_FOUND");
    expect(
      (
        await transaction(editor, (tx) =>
          tx.query("select id,data from app.content_revisions where id=$1", [
            saved.revision.id,
          ]),
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await transaction(editor, (tx) =>
          tx.query(
            "select evidence_source_id from app.content_references where evidence_source_id is not null",
          ),
        )
      ).rows,
    ).toEqual([]);
    await expect(f.save([claim([])], editor)).rejects.toThrow(
      "WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED",
    );
    const withoutClaims = f.document([]);
    withoutClaims.sections = withoutClaims.sections.filter(
      (s) => s.type !== "capability_claims",
    );
    await expect(
      transaction(editor, (tx) =>
        saveWebsiteDocument(tx, editor, {
          id: saved.record.id,
          expectedRevision: saved.record.revision,
          document: withoutClaims,
        }),
      ),
    ).rejects.toThrow("NOT_FOUND");
    const publicView = await f.read(id);
    expect(
      publicView?.page?.sections.some((s) => s.type === "capability_claims"),
    ).toBe(true);
    expect(JSON.stringify(publicView)).not.toContain(s.id);
  });
  it("projects only safe current assertions in an authorized exact-revision draft preview", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    const preview = await transaction(owner, (tx) =>
      draftWebsitePreview(tx, owner, f.site.id, saved.revision.id),
    );
    expect(preview.preview).toBe(true);
    expect(
      preview.page?.sections.some((s) => s.type === "capability_claims"),
    ).toBe(true);
    for (const privateValue of [
      s.id,
      s.title,
      entry.reviewReference,
      "sourceIds",
    ])
      expect(JSON.stringify(preview)).not.toContain(privateValue);
    await transaction(owner, (tx) =>
      restrictEvidenceSource(tx, owner, {
        sourceId: s.id,
        reason: "Synthetic preview revocation",
      }),
    );
    const after = await transaction(owner, (tx) =>
      draftWebsitePreview(tx, owner, f.site.id, saved.revision.id),
    );
    expect(
      after.page?.sections.some((s) => s.type === "capability_claims"),
    ).toBe(false);
  });
  it("allows marketing source selection, denies publication and never exposes source metadata in the picker", async () => {
    const f = await fixture(),
      s = await source();
    const result = (await transaction(marketing, (tx) =>
      handleWebsite(tx, marketing, "claim_sources", {
        siteId: f.site.id,
        selectedIds: [s.id],
      }),
    )) as { rows: Input[]; selected: Input[] };
    expect(result.selected[0].id).toBe(s.id);
    const output = JSON.stringify(result);
    for (const field of [
      "PRIVATE WHOLESALE",
      "private-wholesale-reference",
      "PRIVATE RIGHTS",
      "content_hash",
      "source_uri",
      "rights_reference",
    ])
      expect(output).not.toContain(field);
    const saved = await f.save([claim([s.id])], marketing);
    await expect(
      transaction(marketing, (tx) =>
        approveWebsiteRevision(
          tx,
          marketing,
          saved.revision.id,
          f.site.id,
          "Unauthorized",
        ),
      ),
    ).rejects.toThrow("WEBSITE_PERMISSION_REQUIRED");
  });
  it("denies customers, staff, ungranted managers and other workspaces even through direct SQL functions", async () => {
    const f = await fixture(),
      users = (
        await pool().query(
          "select user_id,role from memberships where tenant_id=$1 and workspace_id=$2 and role in ('staff','manager')",
          [owner.tenantId, owner.workspaceId],
        )
      ).rows;
    const denied = [
      customer,
      otherOwner,
      ...users.map(
        (u) => ({ ...owner, userId: u.user_id, role: u.role }) as Actor,
      ),
    ];
    for (const actor of denied) {
      await expect(
        transaction(actor, (tx) =>
          handleWebsite(tx, actor, "claim_sources", { siteId: f.site.id }),
        ),
      ).rejects.toThrow();
      await expect(
        transaction(actor, (tx) =>
          tx.query("select app.website_claim_source_choices($1,$2,$3,'',1)", [
            owner.tenantId,
            owner.workspaceId,
            f.site.id,
          ]),
        ),
      ).rejects.toThrow("WEBSITE_PERMISSION_REQUIRED");
    }
  });
  it("denies raw source and helper access, and returns no eligibility for drafts or cross-scope revisions", async () => {
    const f = await fixture(),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    await expect(
      withWebsiteReader(f.identity, (tx) =>
        tx.query("select * from app.intelligence_sources"),
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      withWebsiteReader(f.identity, (tx) =>
        tx.query("select app.claim_source_current($1,$2,$3)", [
          owner.tenantId,
          owner.workspaceId,
          s.id,
        ]),
      ),
    ).rejects.toThrow("permission denied");
    await expect(
      withWebsiteReader(f.identity, (tx) =>
        tx.query("select app.website_claim_source_choices($1,$2,$3,'',1)", [
          owner.tenantId,
          owner.workspaceId,
          f.site.id,
        ]),
      ),
    ).rejects.toThrow("permission denied");
    const allowed = (identity = f.identity, rev = saved.revision.id) =>
      withWebsiteReader(
        identity,
        async (tx) =>
          (
            await tx.query(
              "select app.website_claim_evidence_current($1,$2,$3,$4) allowed",
              [owner.tenantId, owner.workspaceId, rev, entry.id],
            )
          ).rows[0].allowed,
      );
    expect(await allowed()).toBe(false);
    await f.publish(saved);
    expect(await allowed()).toBe(true);
    expect(
      await allowed({
        tenantId: otherOwner.tenantId,
        workspaceId: otherOwner.workspaceId,
      }),
    ).toBe(false);
    expect(await allowed(f.identity, s.id)).toBe(false);
    expect(
      await withWebsiteReader(
        f.identity,
        async (tx) =>
          (
            await tx.query(
              "select evidence_source_id from app.content_references where evidence_source_id is not null",
            )
          ).rows,
      ),
    ).toEqual([]);
  });
  it("fails closed for an older published reader without the claim-projection protocol", async () => {
    const f = await fixture(),
      s = await source(),
      saved = await f.save([claim([s.id])]);
    await f.publish(saved);
    const tx = await pool().connect();
    try {
      await tx.query("begin read only");
      await tx.query("set local role ts_website_reader");
      await tx.query(
        "select set_config('ts.web_tenant',$1,true),set_config('ts.web_workspace',$2,true),set_config('ts.web_user','',true)",
        [owner.tenantId, owner.workspaceId],
      );
      const rows = (
        await tx.query(
          "select id,data from app.content_revisions where id=$1",
          [saved.revision.id],
        )
      ).rows;
      expect(rows).toEqual([]);
      expect(
        (
          await tx.query(
            "select id from app.content_revisions where site_id=$1",
            [f.site.id],
          )
        ).rowCount,
      ).toBeGreaterThan(0);
    } finally {
      await tx.query("rollback");
      tx.release();
    }
  });
  it("enforces private-store membership inside the status function and the rendered website", async () => {
    const f = await fixture(true),
      s = await source(),
      entry = claim([s.id]),
      saved = await f.save([entry]);
    await f.publish(saved);
    const eligible = (userId?: string) =>
      withWebsiteReader(
        { ...f.identity, userId },
        async (tx) =>
          (
            await tx.query(
              "select app.website_claim_evidence_current($1,$2,$3,$4) allowed",
              [owner.tenantId, owner.workspaceId, saved.revision.id, entry.id],
            )
          ).rows[0].allowed,
      );
    expect(await eligible()).toBe(false);
    expect(await f.read()).toBeNull();
    await transaction(owner, (tx) =>
      handleStores(tx, owner, "add_member", {
        storeId: f.site.store_id,
        userId: customer.userId,
      }),
    );
    expect(await eligible(customer.userId)).toBe(true);
    expect(
      (await f.read(customer.userId))?.page?.sections.some(
        (s) => s.type === "capability_claims",
      ),
    ).toBe(true);
    await transaction(owner, (tx) =>
      tx.query(
        "update app.store_memberships set status='INACTIVE' where store_id=$1 and owner_id=$2",
        [f.site.store_id, customer.userId],
      ),
    );
    expect(await eligible(customer.userId)).toBe(false);
  });
  it("rejects cross-workspace citations at both command and foreign-key boundaries", async () => {
    const f = await fixture(),
      s = await source({}, otherOwner);
    await expect(f.save([claim([s.id])])).rejects.toThrow(
      "WEBSITE_CLAIM_PUBLIC_SOURCE_REQUIRED",
    );
    const saved = await f.save([]);
    await expect(
      transaction(owner, (tx) =>
        create(tx, owner, "content_references", {
          title: "Wrong scope",
          site_id: f.site.id,
          source_revision_id: saved.revision.id,
          evidence_source_id: s.id,
          data: { purpose: "CLAIM_SUPPORT", claimId: crypto.randomUUID() },
        }),
      ),
    ).rejects.toThrow("foreign key");
  });
  it("pages source choices beyond the first 25 without leaking nonpermitted evidence", async () => {
    const f = await fixture(),
      prefix = "Claim paging " + crypto.randomUUID();
    for (let i = 0; i < 27; i++)
      await source({ title: `${prefix} ${String(i).padStart(2, "0")}` });
    await source({
      title: prefix + " PRIVATE ONLY",
      allowedUses: ["INTERNAL_RESEARCH"],
    });
    const first = (await transaction(marketing, (tx) =>
      handleWebsite(tx, marketing, "claim_sources", {
        siteId: f.site.id,
        search: prefix,
        page: 1,
      }),
    )) as { rows: Input[]; total: number; totalPages: number };
    const second = (await transaction(marketing, (tx) =>
      handleWebsite(tx, marketing, "claim_sources", {
        siteId: f.site.id,
        search: prefix,
        page: 2,
      }),
    )) as { rows: Input[]; total: number };
    expect(first.total).toBe(27);
    expect(first.totalPages).toBe(2);
    expect(first.rows).toHaveLength(25);
    expect(second.rows).toHaveLength(2);
    expect(
      [...first.rows, ...second.rows].every(
        (s) => !String(s.title).includes("PRIVATE ONLY"),
      ),
    ).toBe(true);
  });
});
