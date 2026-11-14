import { fail, type Actor, type Input, type Tx } from "../../../kernel/src";
import { z } from "zod";
import {
  capabilityClaimSchema,
  claimPublicationIssues,
  projectPublicClaim,
  type CapabilityClaim,
  type PublicCapabilityClaim,
} from "../../../contracts/src/claims";
import type { WebsiteDocument } from "../../../contracts/src/website";
import { websiteSite, type WebsiteSite } from "./model";

export type ClaimSourceChoice = {
  id: string;
  title: string;
  edition: string;
  origin: string;
  rights_valid_from: string;
  rights_valid_until: string;
  retention_until: string;
  eligible: boolean;
};
export type ClaimSourceChoices = {
  rows: ClaimSourceChoice[];
  page: number;
  total: number;
  totalPages: number;
  selected?: ClaimSourceChoice[];
};
export async function claimSourceChoices(
  tx: Tx,
  a: Actor,
  i: Input,
): Promise<ClaimSourceChoices> {
  if (a.role === "store_admin")
    fail("WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED", 403);
  const site = await websiteSite(tx, a, i.siteId);
  const page = Math.max(1, Math.min(1000000, Math.floor(Number(i.page) || 1))),
    search = typeof i.search === "string" ? i.search.slice(0, 200) : "";
  const parsed = z
    .array(z.uuid())
    .max(5)
    .safeParse(i.selectedIds ?? []);
  if (!parsed.success) fail("WEBSITE_CLAIM_SOURCE_SELECTION_INVALID", 400);
  const result = (
    await tx.query(
      "select app.website_claim_source_choices($1,$2,$3,$4,$5) result",
      [a.tenantId, a.workspaceId, site.id, search, page],
    )
  ).rows[0].result as ClaimSourceChoices;
  result.selected = [];
  for (const id of new Set(parsed.data)) {
    const selected = await claimSourceChoice(tx, site, id);
    if (selected) result.selected.push(selected);
  }
  return result;
}
export async function claimSourceChoice(
  tx: Tx,
  site: WebsiteSite,
  id: string,
): Promise<ClaimSourceChoice | null> {
  const value = (
    await tx.query(
      "select app.website_claim_source_choices($1,$2,$3,'',1,$4) result",
      [site.tenant_id, site.workspace_id, site.id, id],
    )
  ).rows[0].result as ClaimSourceChoices;
  return value.rows[0] ?? null;
}
export function visibleClaims(doc: WebsiteDocument): CapabilityClaim[] {
  return doc.documentType === "WEBSITE_PAGE"
    ? doc.sections
        .filter((s) => s.visible && s.type === "capability_claims")
        .flatMap((s) => s.content.entries as CapabilityClaim[])
    : [];
}
export async function lockClaimEvidence(
  tx: Tx,
  site: WebsiteSite,
  doc: WebsiteDocument,
) {
  // Same lock and stable ordering as Intelligence revocations; no second rights ledger.
  for (const id of [
    ...new Set(visibleClaims(doc).flatMap((c) => c.sourceIds)),
  ].sort())
    await tx.query(
      "select pg_advisory_xact_lock_shared(hashtextextended($1,0))",
      [`${site.tenant_id}/${site.workspace_id}/evidence-rights/${id}`],
    );
}
export function validateClaimAssertions(doc: WebsiteDocument) {
  const issues = visibleClaims(doc).flatMap((c) => claimPublicationIssues(c));
  if (issues.length)
    fail(
      "WEBSITE_CLAIM_NOT_PUBLISHABLE: " + [...new Set(issues)].join("; "),
      409,
    );
}
export async function publicClaimEntries(
  tx: Tx,
  site: WebsiteSite,
  revisionId: string,
  entries: unknown[],
  preview = false,
): Promise<PublicCapabilityClaim[]> {
  const claims: CapabilityClaim[] = [];
  for (const entry of entries) {
    const parsed = capabilityClaimSchema.safeParse(entry);
    if (!parsed.success || claimPublicationIssues(parsed.data).length) continue;
    claims.push(parsed.data);
  }
  if (!claims.length) return [];
  if (preview) {
    const allowed = new Set<string>();
    for (const id of new Set(claims.flatMap((c) => c.sourceIds))) {
      if ((await claimSourceChoice(tx, site, id))?.eligible) allowed.add(id);
    }
    return claims
      .filter((c) => c.sourceIds.every((id) => allowed.has(id)))
      .map(projectPublicClaim);
  }
  // One statement per section keeps source windows and the read snapshot aligned
  // without a network round trip for every assertion or any cross-request cache.
  const rows = (
    await tx.query(
      "select id,app.website_claim_evidence_current($1,$2,$3,id) eligible from unnest($4::uuid[]) id",
      [site.tenant_id, site.workspace_id, revisionId, claims.map((c) => c.id)],
    )
  ).rows;
  const allowed = new Set(
    rows.filter((row) => row.eligible === true).map((row) => row.id),
  );
  return claims.filter((c) => allowed.has(c.id)).map(projectPublicClaim);
}
