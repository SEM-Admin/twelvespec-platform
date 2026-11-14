import { z } from "zod";

/** Marketing assertions; these definitions grant no operational capability. */
export const CLAIM_STATUSES = [
  "VERIFIED_AVAILABLE",
  "CONDITIONAL_OR_QUOTE_FIRST",
  "PLANNED_NOT_AVAILABLE",
  "UNVERIFIED_DO_NOT_PUBLISH",
  "RETIRED",
] as const;
export const CLAIM_CAPABILITIES = {
  PROJECT_INQUIRY: {
    label: "Project inquiry and reviewed quote",
    available: true,
    delivery: "PLATFORM_WORKFLOW",
  },
  MANAGED_PRINT: {
    label: "Managed print projects",
    available: true,
    delivery: "MANAGED_SPECIALIST",
  },
  MANAGED_PROMO: {
    label: "Managed promotional products",
    available: true,
    delivery: "MANAGED_SPECIALIST",
  },
  MANAGED_APPAREL: {
    label: "Managed decorated apparel",
    available: true,
    delivery: "MANAGED_SPECIALIST",
  },
  ILLUSTRATIVE_2D_PROOF: {
    label: "Illustrative 2D artwork placement",
    available: true,
    delivery: "PLATFORM_WORKFLOW",
  },
  IN_HOUSE_MANUFACTURING: {
    label: "In-house manufacturing",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  MACHINE_READY_EXPORT: {
    label: "Validated manufacturing files",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  EMBROIDERY_DIGITIZING: {
    label: "Embroidery digitization",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  CAD_ENGINEERING: {
    label: "CAD engineering",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  VALIDATED_3D_SIMULATION: {
    label: "Validated 3D simulation",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  AUTONOMOUS_ORDERING: {
    label: "Autonomous supplier ordering",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  LIVE_STOCK_GUARANTEE: {
    label: "Guaranteed real-time stock",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
  PAID_CHECKOUT: {
    label: "Paid production checkout",
    available: false,
    delivery: "FUTURE_UNAVAILABLE",
  },
} as const;
export type ClaimCapability = keyof typeof CLAIM_CAPABILITIES;
const instant = z.string().datetime({ offset: true });
export const capabilityClaimSchema = z
  .object({
    id: z.uuid(),
    statement: z.string().max(500),
    context: z.string().max(500),
    limitations: z.string().max(1000),
    capability: z.enum(
      Object.keys(CLAIM_CAPABILITIES) as [
        ClaimCapability,
        ...ClaimCapability[],
      ],
    ),
    status: z.enum(CLAIM_STATUSES),
    deliveryModel: z.enum([
      "PLATFORM_WORKFLOW",
      "MANAGED_SPECIALIST",
      "FUTURE_UNAVAILABLE",
    ]),
    scope: z
      .object({
        service: z.enum(["PRINT", "PROMO", "APPAREL", "PROJECT_WORKFLOW"]),
        territory: z.string().regex(/^[A-Z]{2}$/),
        channel: z.literal("WEBSITE"),
      })
      .strict(),
    authoringOrigin: z.enum(["HUMAN", "AI_ASSISTED", "UNKNOWN"]),
    confidence: z.enum(["DOCUMENTED", "OPERATOR_ATTESTED", "UNVERIFIED"]),
    sourceIds: z.array(z.uuid()).max(5),
    reviewReference: z.string().max(1000),
    verifiedAt: instant.optional(),
    effectiveFrom: instant.optional(),
    expiresAt: instant.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (new Set(v.sourceIds).size !== v.sourceIds.length)
      ctx.addIssue({
        code: "custom",
        message: "Supporting sources must be distinct.",
      });
    if (
      v.effectiveFrom &&
      v.expiresAt &&
      Date.parse(v.expiresAt) <= Date.parse(v.effectiveFrom)
    )
      ctx.addIssue({
        code: "custom",
        message: "Expiry must be after the effective date.",
      });
  });
export type CapabilityClaim = z.infer<typeof capabilityClaimSchema>;
export type PublicCapabilityClaim = Pick<
  CapabilityClaim,
  "statement" | "context" | "limitations" | "scope"
> & { availability: string; delivery: string };

/** Deterministic gates for typed assertions, not a semantic classifier of free text. */
export function claimPublicationIssues(
  claim: CapabilityClaim,
  now = new Date(),
): string[] {
  const issues: string[] = [];
  if (["UNVERIFIED_DO_NOT_PUBLISH", "RETIRED"].includes(claim.status))
    issues.push("Claim is unverified or retired");
  for (const key of [
    "statement",
    "context",
    "limitations",
    "reviewReference",
  ] as const)
    if (!claim[key].trim()) issues.push(`Claim ${key} is required`);
  if (!claim.sourceIds.length)
    issues.push("Claim supporting evidence is required");
  if (claim.confidence === "UNVERIFIED" || claim.authoringOrigin === "UNKNOWN")
    issues.push("Claim provenance and evidence confidence require review");
  if (!claim.verifiedAt || Date.parse(claim.verifiedAt) > now.getTime())
    issues.push(
      "Claim verification date is required and cannot be in the future",
    );
  if (!claim.effectiveFrom || Date.parse(claim.effectiveFrom) > now.getTime())
    issues.push("Claim is not yet effective");
  if (!claim.expiresAt || Date.parse(claim.expiresAt) <= now.getTime())
    issues.push("Claim is expired or has no expiry");
  if (
    claim.verifiedAt &&
    claim.expiresAt &&
    Date.parse(claim.verifiedAt) >= Date.parse(claim.expiresAt)
  )
    issues.push("Claim verification must precede expiry");
  const definition = CLAIM_CAPABILITIES[claim.capability];
  if (!definition.available && claim.status !== "PLANNED_NOT_AVAILABLE")
    issues.push(
      "Capability is Coming Soon and cannot be represented as available",
    );
  if (claim.deliveryModel !== definition.delivery)
    issues.push("Claim delivery model does not match the capability");
  const service =
    claim.capability === "MANAGED_PRINT"
      ? "PRINT"
      : claim.capability === "MANAGED_PROMO"
        ? "PROMO"
        : claim.capability === "MANAGED_APPAREL"
          ? "APPAREL"
          : null;
  if (service && claim.scope.service !== service)
    issues.push("Claim service scope does not match the capability");
  return issues;
}
export function projectPublicClaim(
  claim: CapabilityClaim,
): PublicCapabilityClaim {
  return {
    statement: claim.statement,
    context: claim.context,
    limitations: claim.limitations,
    scope: { ...claim.scope },
    availability:
      claim.status === "PLANNED_NOT_AVAILABLE"
        ? "Coming Soon"
        : claim.status === "CONDITIONAL_OR_QUOTE_FIRST"
          ? "Subject to a reviewed quote"
          : "Available within the stated scope",
    delivery:
      claim.status === "PLANNED_NOT_AVAILABLE"
        ? "Not currently available"
        : claim.deliveryModel === "MANAGED_SPECIALIST"
          ? "Managed through specialist production partners"
          : claim.capability === "ILLUSTRATIVE_2D_PROOF"
            ? "Illustrative placement only; a production proof and technical review are required"
            : "TwelveSpec project workflow",
  };
}
