"use client";

import { useEffect, useState } from "react";
import {
  CLAIM_CAPABILITIES,
  CLAIM_STATUSES,
  type CapabilityClaim,
  type ClaimCapability,
} from "../../../packages/contracts/src/claims";
import { websiteCommand } from "./website-api";

type Source = {
  id: string;
  title: string;
  edition: string;
  origin: string;
  rights_valid_until: string;
  eligible: boolean;
};
type Choices = {
  rows: Source[];
  selected: Source[];
  page: number;
  total: number;
  totalPages: number;
};
const statusLabels: Record<CapabilityClaim["status"], string> = {
  VERIFIED_AVAILABLE: "Verified available",
  CONDITIONAL_OR_QUOTE_FIRST: "Conditional / reviewed quote first",
  PLANNED_NOT_AVAILABLE: "Planned / Coming Soon",
  UNVERIFIED_DO_NOT_PUBLISH: "Unverified / do not publish",
  RETIRED: "Retired",
};
const empty: Choices = {
  rows: [],
  selected: [],
  page: 1,
  total: 0,
  totalPages: 1,
};

function ClaimSources({
  siteId,
  ids,
  onChange,
}: {
  siteId: string;
  ids: string[];
  onChange: (ids: string[]) => void;
}) {
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [choices, setChoices] = useState(empty),
    [selected, setSelected] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const idsKey = ids.join(",");
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setBusy(true);
      void websiteCommand<Choices>("claim_sources", {
        siteId,
        search,
        page,
        selectedIds: idsKey ? idsKey.split(",") : [],
      })
        .then((value) => {
          if (active) {
            setChoices(value);
            setError("");
          }
        })
        .catch((error) => {
          if (active)
            setError(
              error instanceof Error
                ? error.message
                : "Evidence could not be loaded.",
            );
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [siteId, search, page, idsKey]);
  return (
    <fieldset aria-busy={busy}>
      <legend>Supporting evidence</legend>
      <p>
        A source steward must grant public-claim use in Integration Center.
        Internal costing permission is insufficient. Synthetic, expired or
        revoked evidence cannot support publication.
      </p>
      <label>
        Find public-use evidence
        <input
          type="search"
          value={search}
          maxLength={200}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
            setSelected("");
          }}
        />
      </label>
      <label>
        Evidence source
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Choose supporting evidence</option>
          {choices.rows
            .filter((s) => !ids.includes(s.id))
            .map((source) => (
              <option value={source.id} key={source.id}>
                {source.title} · {source.edition}
                {source.eligible ? "" : " · unavailable for publication"}
              </option>
            ))}
        </select>
      </label>
      <button
        type="button"
        disabled={busy || !selected || ids.length >= 5}
        onClick={() => {
          onChange([...ids, selected]);
          setSelected("");
        }}
      >
        Add supporting evidence
      </button>
      <ul>
        {ids.map((id) => {
          const source = [...choices.selected, ...choices.rows].find(
            (s) => s.id === id,
          );
          return (
            <li key={id}>
              {source
                ? `${source.title} · ${source.edition}${source.eligible ? "" : " · unavailable for publication"}`
                : "Previously selected source; awaiting current eligibility"}{" "}
              <button
                type="button"
                onClick={() => onChange(ids.filter((value) => value !== id))}
              >
                Remove supporting evidence
              </button>
            </li>
          );
        })}
      </ul>
      <div className="web-actions">
        <button
          type="button"
          disabled={busy || page <= 1}
          onClick={() => {
            setPage(page - 1);
            setSelected("");
          }}
        >
          Previous claim sources
        </button>
        <span>
          Page {page} of {choices.totalPages}
        </span>
        <button
          type="button"
          disabled={busy || page >= choices.totalPages}
          onClick={() => {
            setPage(page + 1);
            setSelected("");
          }}
        >
          Next claim sources
        </button>
      </div>
      {!choices.total && !busy && (
        <p>
          No public-use sources match. Register a permitted source in
          Integration Center before publication.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
    </fieldset>
  );
}

export function ClaimFields({
  siteId,
  entries,
  onChange,
}: {
  siteId: string;
  entries: CapabilityClaim[];
  onChange: (entries: CapabilityClaim[]) => void;
}) {
  const set = (id: string, patch: Partial<CapabilityClaim>) =>
    onChange(
      entries.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    );
  return (
    <fieldset>
      <legend>Capability assertions and evidence</legend>
      <p>
        Drafts can contain incomplete assertions. Every visible assertion needs
        current evidence and publisher approval. Existing narrative and SEO copy
        still require editorial fact checking.
      </p>
      {entries.map((entry, index) => (
        <fieldset
          key={entry.id}
          aria-label={`Capability assertion ${index + 1}`}
        >
          <legend>Capability assertion {index + 1}</legend>
          <label>
            Capability
            <select
              value={entry.capability}
              onChange={(e) => {
                const capability = e.target.value as ClaimCapability,
                  definition = CLAIM_CAPABILITIES[capability];
                set(entry.id, {
                  capability,
                  deliveryModel: definition.delivery,
                  ...(!definition.available
                    ? { status: "PLANNED_NOT_AVAILABLE" }
                    : {}),
                  scope: {
                    ...entry.scope,
                    service:
                      capability === "MANAGED_PRINT"
                        ? "PRINT"
                        : capability === "MANAGED_PROMO"
                          ? "PROMO"
                          : capability === "MANAGED_APPAREL"
                            ? "APPAREL"
                            : "PROJECT_WORKFLOW",
                  },
                });
              }}
            >
              {Object.entries(CLAIM_CAPABILITIES).map(([key, value]) => (
                <option value={key} key={key}>
                  {value.label}
                  {value.available ? "" : " · Coming Soon only"}
                </option>
              ))}
            </select>
          </label>
          <label>
            Truth status
            <select
              value={entry.status}
              onChange={(e) =>
                set(entry.id, {
                  status: e.target.value as CapabilityClaim["status"],
                })
              }
            >
              {CLAIM_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <p>
            Delivery:{" "}
            {entry.deliveryModel === "MANAGED_SPECIALIST"
              ? "Managed through specialist production partners"
              : entry.deliveryModel === "FUTURE_UNAVAILABLE"
                ? "Not currently available"
                : "TwelveSpec project workflow"}
            . This does not authorize a manufacturing or purchase release.
          </p>
          <label>
            Public statement
            <textarea
              value={entry.statement}
              maxLength={500}
              onChange={(e) => set(entry.id, { statement: e.target.value })}
            />
          </label>
          <label>
            Public context
            <textarea
              value={entry.context}
              maxLength={500}
              onChange={(e) => set(entry.id, { context: e.target.value })}
            />
          </label>
          <label>
            Public limitations
            <textarea
              value={entry.limitations}
              maxLength={1000}
              onChange={(e) => set(entry.id, { limitations: e.target.value })}
            />
          </label>
          <label>
            Service scope
            <select
              value={entry.scope.service}
              onChange={(e) =>
                set(entry.id, {
                  scope: {
                    ...entry.scope,
                    service: e.target
                      .value as CapabilityClaim["scope"]["service"],
                  },
                })
              }
            >
              <option value="PROJECT_WORKFLOW">Project workflow</option>
              <option value="PRINT">Print</option>
              <option value="PROMO">Promotional products</option>
              <option value="APPAREL">Apparel</option>
            </select>
          </label>
          <label>
            Country scope
            <input
              value={entry.scope.territory}
              pattern="[A-Z]{2}"
              maxLength={2}
              onChange={(e) =>
                set(entry.id, {
                  scope: {
                    ...entry.scope,
                    territory: e.target.value.toUpperCase(),
                  },
                })
              }
            />
          </label>
          <label>
            Authoring origin
            <select
              value={entry.authoringOrigin}
              onChange={(e) =>
                set(entry.id, {
                  authoringOrigin: e.target
                    .value as CapabilityClaim["authoringOrigin"],
                })
              }
            >
              <option value="UNKNOWN">Unknown / needs review</option>
              <option value="HUMAN">Human authored</option>
              <option value="AI_ASSISTED">
                AI assisted / human review required
              </option>
            </select>
          </label>
          <label>
            Evidence confidence
            <select
              value={entry.confidence}
              onChange={(e) =>
                set(entry.id, {
                  confidence: e.target.value as CapabilityClaim["confidence"],
                })
              }
            >
              <option value="UNVERIFIED">Unverified</option>
              <option value="OPERATOR_ATTESTED">
                Operator attested with supporting evidence
              </option>
              <option value="DOCUMENTED">Documented evidence</option>
            </select>
          </label>
          {(["verifiedAt", "effectiveFrom", "expiresAt"] as const).map(
            (key) => (
              <label key={key}>
                {key === "verifiedAt"
                  ? "Last verified at (UTC)"
                  : key === "effectiveFrom"
                    ? "Effective from (UTC)"
                    : "Claim expires at (UTC)"}
                <input
                  type="datetime-local"
                  value={
                    entry[key]
                      ? new Date(entry[key]!).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    set(entry.id, {
                      [key]: e.target.value
                        ? new Date(e.target.value + "Z").toISOString()
                        : undefined,
                    })
                  }
                />
              </label>
            ),
          )}
          <label>
            Private review and proof reference
            <textarea
              value={entry.reviewReference}
              maxLength={1000}
              onChange={(e) =>
                set(entry.id, { reviewReference: e.target.value })
              }
            />
          </label>
          <ClaimSources
            siteId={siteId}
            ids={entry.sourceIds}
            onChange={(sourceIds) => set(entry.id, { sourceIds })}
          />
          <button
            type="button"
            onClick={() =>
              onChange(entries.filter((item) => item.id !== entry.id))
            }
          >
            Remove capability assertion
          </button>
        </fieldset>
      ))}
      <button
        type="button"
        disabled={entries.length >= 12}
        onClick={() =>
          onChange([
            ...entries,
            {
              id: crypto.randomUUID(),
              statement: "",
              context: "",
              limitations: "",
              capability: "PROJECT_INQUIRY",
              deliveryModel: "PLATFORM_WORKFLOW",
              status: "UNVERIFIED_DO_NOT_PUBLISH",
              scope: {
                service: "PROJECT_WORKFLOW",
                territory: "US",
                channel: "WEBSITE",
              },
              authoringOrigin: "UNKNOWN",
              confidence: "UNVERIFIED",
              sourceIds: [],
              reviewReference: "",
            },
          ])
        }
      >
        Add capability assertion
      </button>
    </fieldset>
  );
}
