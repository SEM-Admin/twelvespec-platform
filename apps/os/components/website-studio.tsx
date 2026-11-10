"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  newWebsiteSection,
  WEBSITE_COMPONENTS,
  type WebsiteDocument,
  type WebsiteSection,
} from "../../../packages/contracts/src/website";
import {
  GlobalFields,
  SectionFields,
  type WebsiteChoices,
} from "./website-fields";
import { WebsiteCollections, WebsiteMedia } from "./website-library";
import { request, type Actor, type Data, type Row } from "./types";
import { websiteCommand } from "./website-api";

type Site = Row & {
  generation: number;
  store_id: string | null;
  active_release_id: string | null;
};
export type WebsiteWorkspace = {
  sites: Site[];
  site: Site | null;
  documents: Row[];
  pageChoices: Row[];
  media: Row[];
  collections: Row[];
  stores: Row[];
  releases: Row[];
  jobs: Row[];
  memberships: Row[];
  grants: Row[];
  capabilities?: {
    edit: boolean;
    publish: boolean;
    media: boolean;
    merchandise: boolean;
  };
  page: number;
  pageSize: number;
  total: number;
  canInitialize: boolean;
  durable: boolean;
  schedulerActive: boolean;
};
type Revision = Row & {
  data: {
    document: WebsiteDocument;
    version: number;
    hash: string;
    archived: boolean;
    reason: string;
  };
};
type LoadedDocument = {
  record: Row;
  revision: Revision;
  history: Revision[];
  historyPage: number;
  historyTotal: number;
  historyPageSize: number;
};
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "The website operation failed.";

export function WebsiteStudio({ actor }: { actor: Actor }) {
  const [workspace, setWorkspace] = useState<WebsiteWorkspace | null>(null),
    [siteId, setSiteId] = useState(""),
    [documentPage, setDocumentPage] = useState(1),
    [tab, setTab] = useState("pages");
  const [loaded, setLoaded] = useState<LoadedDocument | null>(null),
    [document, setDocument] = useState<WebsiteDocument | null>(null),
    [sectionId, setSectionId] = useState(""),
    [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [preview, setPreview] = useState(""),
    [device, setDevice] = useState("1440"),
    [dragId, setDragId] = useState("");
  const [newTitle, setNewTitle] = useState(""),
    [newPath, setNewPath] = useState(""),
    [reason, setReason] = useState("Reviewed website content update"),
    [newStore, setNewStore] = useState("");
  const [catalogFacets, setCatalogFacets] = useState<{
      categories: string[];
      brands: string[];
    }>({ categories: [], brands: [] }),
    [componentType, setComponentType] = useState("cta");
  const loadSequence = useRef(0),
    documentSequence = useRef(0);
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    const result = await request<WebsiteWorkspace>(
      `/api/website?${new URLSearchParams({ ...(siteId ? { siteId } : {}), page: String(documentPage) })}`,
    );
    if (sequence === loadSequence.current) {
      setWorkspace(result);
      setSelected([]);
    }
    return result;
  }, [siteId, documentPage]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError("");
    void load()
      .catch((error) => {
        if (active) setError(errorText(error));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [load]);
  useEffect(() => {
    if (!workspace?.site?.id) return;
    let active = true;
    void request<{ facets: { categories: string[]; brands: string[] } }>(
      `/api/website?view=catalog&siteId=${workspace.site.id}&pageSize=1`,
    )
      .then((result) => {
        if (active) setCatalogFacets(result.facets);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [workspace?.site?.id]);
  const open = async (id: string, historyPage = 1) => {
    const sequence = ++documentSequence.current;
    const result = await request<LoadedDocument>(
      `/api/website?view=document&id=${id}&page=${historyPage}`,
    );
    if (sequence === documentSequence.current) {
      setLoaded(result);
      setDocument(structuredClone(result.revision.data.document));
      setSectionId(
        result.revision.data.document.documentType === "WEBSITE_PAGE"
          ? (result.revision.data.document.sections[0]?.id ?? "")
          : "",
      );
      setPreview("");
    }
    return result;
  };
  const run = async (operation: () => Promise<unknown>, message: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(message);
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  };
  const dirty =
    !!document &&
    JSON.stringify(document) !== JSON.stringify(loaded?.revision.data.document);
  const currentSite = workspace?.site;
  const choices: WebsiteChoices = {
    documents: workspace?.pageChoices ?? [],
    collections: workspace?.collections ?? [],
    stores: workspace?.stores ?? [],
    media: workspace?.media ?? [],
    ...catalogFacets,
  };
  const changeSite = (id: string) => {
    if (
      dirty &&
      !window.confirm("Discard unsaved website edits and change sites?")
    )
      return;
    documentSequence.current++;
    setSiteId(id);
    setDocumentPage(1);
    setLoaded(null);
    setDocument(null);
    setPreview("");
  };
  const selectDocument = (id: string) => {
    if (
      dirty &&
      !window.confirm("Discard unsaved edits and open another document?")
    )
      return;
    void run(() => open(id), "Document opened.");
  };
  const updateSection = (section: WebsiteSection) => {
    if (document?.documentType === "WEBSITE_PAGE")
      setDocument({
        ...document,
        sections: document.sections.map((s) =>
          s.id === section.id ? section : s,
        ),
      });
  };
  const moveSection = (id: string, index: number) => {
    if (document?.documentType !== "WEBSITE_PAGE") return;
    const sections = [...document.sections],
      from = sections.findIndex((s) => s.id === id);
    if (from < 0 || index < 0 || index >= sections.length) return;
    const [item] = sections.splice(from, 1);
    sections.splice(index, 0, item);
    setDocument({ ...document, sections });
    setNotice(`Section moved to position ${index + 1} of ${sections.length}.`);
  };
  const save = () =>
    run(async () => {
      if (!document || !loaded) return;
      const result = await websiteCommand<{ record: Row; revision: Revision }>(
        "save_document",
        {
          id: loaded.record.id,
          expectedRevision: loaded.record.revision,
          document,
          reason,
        },
      );
      await load();
      await open(result.record.id);
    }, "Draft saved. The published website is unchanged.");
  const publish = () =>
    run(async () => {
      if (!workspace?.site || !reason.trim())
        throw new Error("Enter a publication review note.");
      if (!selected.length)
        throw new Error("Select the exact documents to publish.");
      const changes = workspace.documents
        .filter((row) => selected.includes(row.id))
        .map((row) => ({
          documentId: row.id,
          revisionId: row.head_revision_id,
          expectedRevision: row.revision,
        }));
      await websiteCommand("publish", {
        siteId: workspace.site.id,
        expectedGeneration: workspace.site.generation,
        changes,
        approveSelected: true,
        reason,
        idempotencyKey: crypto.randomUUID(),
      });
      await load();
      if (loaded) await open(loaded.record.id);
    }, "Selected revisions published as one coherent website release.");
  const showPreview = () =>
    run(async () => {
      if (!loaded || !currentSite) return;
      if (dirty)
        throw new Error(
          "Save this draft before opening its exact revision preview.",
        );
      await request(
        `/api/website?view=preview&siteId=${currentSite.id}&revisionId=${loaded.revision.id}`,
      );
      setPreview(
        `/website/preview/${currentSite.id}/${loaded.revision.id}?workspaceId=${encodeURIComponent(actor.workspaceId)}`,
      );
    }, "Preview shows the saved immutable revision.");
  if (!workspace && busy)
    return <p role="status">Opening Website & Content Studio…</p>;
  return (
    <section className="website-studio" aria-label="Website & Content Studio">
      <header className="web-studio-intro">
        <div>
          <p className="eyebrow">CONTENT, CONNECTED TO COMMERCE</p>
          <h2>Website & Content Studio</h2>
          <p>
            Build pages from approved components, review exact revisions, then
            publish selected changes.
          </p>
        </div>
        {currentSite && (
          <label>
            Website
            <select
              value={currentSite.id}
              disabled={busy}
              onChange={(e) => changeSite(e.target.value)}
            >
              {workspace?.sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.title}
                  {site.store_id ? " · Company store" : " · Main storefront"}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (
              dirty &&
              !window.confirm(
                "Discard unsaved website edits and reload the latest content?",
              )
            )
              return;
            void run(async () => {
              await load();
              if (loaded) await open(loaded.record.id);
            }, "Website content refreshed.");
          }}
        >
          Refresh website content
        </button>
      </header>
      {error && (
        <div className="web-edit-error" role="alert">
          <strong>Changes were not completed.</strong>
          <p>{error}</p>
          {/REVISION|GENERATION/.test(error) && (
            <p>
              Another editor has changed this content. Copy any unsaved text,
              then reload the document before saving again.
            </p>
          )}
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await load();
                if (loaded) await open(loaded.record.id);
              }, "Latest revisions loaded.")
            }
          >
            Reload latest content
          </button>
        </div>
      )}
      {notice && (
        <p className="web-edit-notice" role="status">
          {notice}
        </p>
      )}
      {!currentSite ? (
        <div className="web-edit-panel">
          <p>No editable website is initialized in this workspace.</p>
          {workspace?.canInitialize && (
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await websiteCommand("initialize", {});
                  await load();
                }, "Synthetic editable website initialized.")
              }
            >
              Initialize development website
            </button>
          )}
        </div>
      ) : (
        <>
          {!workspace?.durable && (
            <p className="web-edit-warning">
              This preview uses temporary storage. Saved content can reset after
              inactivity. Keep live supplier credentials and financial activity
              disabled.
            </p>
          )}
          <nav className="web-studio-tabs" aria-label="Content studio sections">
            {[
              ["pages", "Pages & design"],
              ["media", "Media library"],
              ["collections", "Collections"],
              ["history", "Releases & access"],
            ].map(([id, label]) => (
              <button
                key={id}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>
          {tab === "pages" && (
            <>
              <div className="web-builder">
                <aside className="web-edit-panel">
                  <h3>Pages & shared design</h3>
                  <p>
                    Only checked revisions are included in the next publication.
                  </p>
                  {workspace?.documents.map((row) => (
                    <div className="web-document-row" key={row.id}>
                      {workspace.capabilities?.publish && (
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.title} for publication`}
                          disabled={busy || dirty}
                          checked={selected.includes(row.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, row.id]
                                : selected.filter((id) => id !== row.id),
                            )
                          }
                        />
                      )}
                      <button
                        disabled={busy}
                        aria-pressed={loaded?.record.id === row.id}
                        onClick={() => selectDocument(row.id)}
                      >
                        <strong>{row.title}</strong>
                        <small>
                          {String(
                            row.website_path ??
                              String(row.document_type).replace("WEBSITE_", ""),
                          )}{" "}
                          ·{" "}
                          {row.published
                            ? "Published"
                            : row.status === "ARCHIVED"
                              ? "Archive draft"
                              : "Draft"}
                        </small>
                      </button>
                    </div>
                  ))}
                  <div className="web-edit-actions">
                    <button
                      disabled={busy || documentPage === 1}
                      onClick={() => setDocumentPage((page) => page - 1)}
                    >
                      Previous documents
                    </button>
                    <span>
                      {documentPage} /{" "}
                      {Math.max(1, Math.ceil((workspace?.total ?? 0) / 25))}
                    </span>
                    <button
                      disabled={
                        busy || documentPage * 25 >= (workspace?.total ?? 0)
                      }
                      onClick={() => setDocumentPage((page) => page + 1)}
                    >
                      Next documents
                    </button>
                  </div>
                  {workspace?.capabilities?.edit && (
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(async () => {
                          const result = await websiteCommand<{ record: Row }>(
                            "create_page",
                            {
                              siteId: currentSite.id,
                              title: newTitle,
                              path: newPath,
                            },
                          );
                          await load();
                          await open(result.record.id);
                          setNewTitle("");
                          setNewPath("");
                        }, "New private draft created.");
                      }}
                    >
                      <h4>Create a page</h4>
                      <label>
                        New page title
                        <input
                          required
                          value={newTitle}
                          maxLength={70}
                          onChange={(e) => setNewTitle(e.target.value)}
                        />
                      </label>
                      <label>
                        New page path
                        <input
                          required
                          placeholder="/our-story"
                          value={newPath}
                          onChange={(e) => setNewPath(e.target.value)}
                        />
                      </label>
                      <button disabled={busy}>Create page draft</button>
                    </form>
                  )}
                  <label>
                    Publication review note
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      maxLength={2000}
                    />
                  </label>
                  <button
                    className="web-edit-primary"
                    disabled={
                      busy ||
                      dirty ||
                      !selected.length ||
                      !workspace?.capabilities?.publish
                    }
                    onClick={() => void publish()}
                  >
                    Approve & publish selected ({selected.length})
                  </button>
                  <p className="web-edit-help">
                    Published generation {currentSite.generation}. Other drafts
                    remain private. Collection merchandising has its own
                    explicit publication action.
                  </p>
                </aside>
                <div className="web-edit-panel">
                  {document && loaded ? (
                    <>
                      <div className="web-edit-actions">
                        <span>
                          {dirty
                            ? "Unsaved edits"
                            : `Saved revision ${loaded.revision.data.version}`}{" "}
                          ·{" "}
                          {loaded.revision.data.archived
                            ? "Archive draft"
                            : "Editable draft"}
                        </span>
                        <button
                          disabled={busy || !dirty}
                          onClick={() => void save()}
                        >
                          Save website draft
                        </button>
                        <button
                          disabled={busy || dirty}
                          onClick={() => void showPreview()}
                        >
                          Preview saved revision
                        </button>
                        <button
                          disabled={busy || dirty}
                          onClick={() =>
                            void run(async () => {
                              await websiteCommand("request_review", {
                                id: loaded.record.id,
                                reason,
                              });
                              await load();
                            }, "Review requested for the exact saved revision.")
                          }
                        >
                          Request review
                        </button>
                      </div>
                      <fieldset disabled={busy}>
                        <label>
                          Document title
                          <input
                            value={document.title}
                            maxLength={160}
                            onChange={(e) =>
                              setDocument({
                                ...document,
                                title: e.target.value,
                              })
                            }
                          />
                        </label>
                        {document.documentType === "WEBSITE_PAGE" ? (
                          <>
                            <label>
                              Page path
                              <input
                                value={document.path}
                                onChange={(e) =>
                                  setDocument({
                                    ...document,
                                    path: e.target.value,
                                  })
                                }
                              />
                            </label>
                            <details>
                              <summary>Search appearance</summary>
                              <label>
                                SEO title
                                <input
                                  maxLength={70}
                                  value={document.seo.title}
                                  onChange={(e) =>
                                    setDocument({
                                      ...document,
                                      seo: {
                                        ...document.seo,
                                        title: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </label>
                              <label>
                                SEO description
                                <textarea
                                  maxLength={180}
                                  value={document.seo.description}
                                  onChange={(e) =>
                                    setDocument({
                                      ...document,
                                      seo: {
                                        ...document.seo,
                                        description: e.target.value,
                                      },
                                    })
                                  }
                                />
                              </label>
                              <label className="web-check">
                                <input
                                  type="checkbox"
                                  checked={document.seo.noIndex}
                                  onChange={(e) =>
                                    setDocument({
                                      ...document,
                                      seo: {
                                        ...document.seo,
                                        noIndex: e.target.checked,
                                      },
                                    })
                                  }
                                />{" "}
                                Request no indexing
                              </label>
                              <p>Development previews always remain noindex.</p>
                            </details>
                            <div className="web-section-builder">
                              <div>
                                <h4>Page sections</h4>
                                {document.sections.map((section, index) => (
                                  <div
                                    className="web-section-row"
                                    key={section.id}
                                    draggable
                                    onDragStart={() => setDragId(section.id)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      if (dragId) moveSection(dragId, index);
                                      setDragId("");
                                    }}
                                  >
                                    <button
                                      type="button"
                                      aria-pressed={sectionId === section.id}
                                      onClick={() => setSectionId(section.id)}
                                    >
                                      {index + 1}.{" "}
                                      {
                                        WEBSITE_COMPONENTS.find(
                                          (c) => c.type === section.type,
                                        )?.label
                                      }
                                      {!section.visible ? " (hidden)" : ""}
                                    </button>
                                    <div className="web-edit-actions">
                                      <button
                                        type="button"
                                        aria-label={`Move section ${index + 1} up`}
                                        disabled={index === 0}
                                        onClick={() =>
                                          moveSection(section.id, index - 1)
                                        }
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        aria-label={`Move section ${index + 1} down`}
                                        disabled={
                                          index === document.sections.length - 1
                                        }
                                        onClick={() =>
                                          moveSection(section.id, index + 1)
                                        }
                                      >
                                        ↓
                                      </button>
                                      <label className="web-check">
                                        <input
                                          type="checkbox"
                                          checked={section.visible}
                                          onChange={(e) =>
                                            updateSection({
                                              ...section,
                                              visible: e.target.checked,
                                            })
                                          }
                                        />{" "}
                                        Visible section {index + 1}
                                      </label>
                                      <button
                                        type="button"
                                        aria-label={`Remove section ${index + 1}`}
                                        onClick={() =>
                                          setDocument({
                                            ...document,
                                            sections: document.sections.filter(
                                              (s) => s.id !== section.id,
                                            ),
                                          })
                                        }
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                ))}
                                <label>
                                  Add approved component
                                  <select
                                    value={componentType}
                                    onChange={(e) =>
                                      setComponentType(e.target.value)
                                    }
                                  >
                                    {WEBSITE_COMPONENTS.filter(
                                      (c) =>
                                        !c.organizationOnly ||
                                        currentSite.store_id,
                                    ).map((c) => (
                                      <option
                                        key={c.type}
                                        value={c.type}
                                        disabled={!c.enabled}
                                      >
                                        {c.label}
                                        {!c.enabled ? " · Coming Soon" : ""}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <button
                                  type="button"
                                  disabled={document.sections.length >= 40}
                                  onClick={() => {
                                    const section = newWebsiteSection(
                                      componentType as WebsiteSection["type"],
                                    );
                                    setDocument({
                                      ...document,
                                      sections: [...document.sections, section],
                                    });
                                    setSectionId(section.id);
                                  }}
                                >
                                  Add section
                                </button>
                                <p className="web-edit-help">
                                  Drag sections to reorder, or use their up and
                                  down buttons. Video and downloadable resources
                                  remain Coming Soon.
                                </p>
                              </div>
                              <div>
                                {document.sections.find(
                                  (s) => s.id === sectionId,
                                ) && (
                                  <>
                                    <h4>Section content</h4>
                                    <SectionFields
                                      section={
                                        document.sections.find(
                                          (s) => s.id === sectionId,
                                        )!
                                      }
                                      choices={choices}
                                      onChange={updateSection}
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <GlobalFields
                            document={document}
                            choices={choices}
                            onChange={setDocument}
                          />
                        )}
                      </fieldset>
                      <details>
                        <summary>
                          Revision history ({loaded.historyTotal})
                        </summary>
                        {loaded.history.map((revision) => (
                          <div className="web-history-row" key={revision.id}>
                            <div>
                              <strong>Revision {revision.data.version}</strong>{" "}
                              · {revision.data.reason}
                              <small>{revision.created_at}</small>
                            </div>
                            <button
                              disabled={busy || dirty}
                              onClick={() =>
                                void run(async () => {
                                  const result = await websiteCommand<{
                                    record: Row;
                                  }>("restore_revision", {
                                    id: loaded.record.id,
                                    revisionId: revision.id,
                                    expectedRevision: loaded.record.revision,
                                    reason:
                                      "Restore selected revision as a new draft",
                                  });
                                  await load();
                                  await open(result.record.id);
                                }, "Earlier revision restored as a new draft. Publication is unchanged.")
                              }
                            >
                              Restore revision {revision.data.version} as draft
                            </button>
                          </div>
                        ))}
                        <div className="web-edit-actions">
                          <button
                            disabled={busy || dirty || loaded.historyPage === 1}
                            onClick={() =>
                              void run(
                                () =>
                                  open(
                                    loaded.record.id,
                                    loaded.historyPage - 1,
                                  ),
                                "History loaded.",
                              )
                            }
                          >
                            Previous revisions
                          </button>
                          <button
                            disabled={
                              busy ||
                              dirty ||
                              loaded.historyPage * loaded.historyPageSize >=
                                loaded.historyTotal
                            }
                            onClick={() =>
                              void run(
                                () =>
                                  open(
                                    loaded.record.id,
                                    loaded.historyPage + 1,
                                  ),
                                "History loaded.",
                              )
                            }
                          >
                            Next revisions
                          </button>
                        </div>
                      </details>
                      {document.documentType === "WEBSITE_PAGE" && (
                        <div className="web-edit-actions">
                          <button
                            disabled={busy || dirty}
                            onClick={() =>
                              void run(async () => {
                                const result = await websiteCommand<{
                                  record: Row;
                                }>("duplicate_page", { id: loaded.record.id });
                                await load();
                                await open(result.record.id);
                              }, "Page duplicated as a separate private draft.")
                            }
                          >
                            Duplicate page
                          </button>
                          {document.path !== "/" && (
                            <button
                              disabled={busy || dirty}
                              onClick={() =>
                                void run(async () => {
                                  const result = await websiteCommand<{
                                    record: Row;
                                  }>("archive_document", {
                                    id: loaded.record.id,
                                    expectedRevision: loaded.record.revision,
                                    reason: "Archive selected page",
                                  });
                                  await load();
                                  await open(result.record.id);
                                }, "Archive saved as a draft. Publish its selected revision to remove the page after dependency checks.")
                              }
                            >
                              Archive page draft
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p>
                      Select a page, navigation, footer, or brand document to
                      edit.
                    </p>
                  )}
                </div>
              </div>
              {preview && (
                <section className="web-preview">
                  <div className="web-edit-actions">
                    <h3>Exact saved revision preview</h3>
                    <label>
                      Preview device
                      <select
                        value={device}
                        onChange={(e) => setDevice(e.target.value)}
                      >
                        <option value="1440">Desktop · 1440 px</option>
                        <option value="768">Tablet · 768 px</option>
                        <option value="390">Mobile · 390 px</option>
                      </select>
                    </label>
                    <button onClick={() => setPreview("")}>
                      Close preview
                    </button>
                  </div>
                  <div className="web-preview-scroll">
                    <iframe
                      title="Saved website revision preview"
                      src={preview}
                      style={{ width: Number(device) }}
                    />
                  </div>
                </section>
              )}
            </>
          )}
          {tab === "media" && (
            <WebsiteMedia
              workspace={workspace!}
              reload={load}
              busy={busy}
              run={run}
            />
          )}
          {tab === "collections" && (
            <WebsiteCollections
              workspace={workspace!}
              reload={load}
              busy={busy}
              run={run}
            />
          )}
          {tab === "history" && (
            <div className="web-edit-panel">
              <h3>Coherent website releases</h3>
              <p>
                Rollback creates a new audited release. Orders, quotes, artwork
                and supplier records remain unchanged.
              </p>
              <label>
                Rollback review note
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {workspace?.releases.map((release) => (
                <div className="web-history-row" key={release.id}>
                  <div>
                    <strong>
                      {release.title}
                      {release.id === currentSite.active_release_id
                        ? " · Current"
                        : ""}
                    </strong>
                    <small>{release.created_at}</small>
                    <p>{String(release.data.reason ?? "")}</p>
                  </div>
                  <button
                    disabled={
                      busy ||
                      !workspace.capabilities?.publish ||
                      release.id === currentSite.active_release_id
                    }
                    onClick={() =>
                      void run(async () => {
                        if (
                          !window.confirm(
                            "Restore this whole-site release after server dependency checks?",
                          )
                        )
                          return;
                        await websiteCommand("rollback_site", {
                          siteId: currentSite.id,
                          releaseId: release.id,
                          expectedGeneration: currentSite.generation,
                          reason,
                          idempotencyKey: crypto.randomUUID(),
                        });
                        await load();
                        setLoaded(null);
                        setDocument(null);
                      }, "Earlier coherent site restored as a new release.")
                    }
                  >
                    Review & restore release
                  </button>
                </div>
              ))}
              <h3>Scheduled publishing</h3>
              <p>
                Coming Soon until durable storage and the dependable executor
                are activated. No publication is scheduled by this interface.
              </p>
              {workspace?.jobs.map((job) => (
                <p key={job.id}>
                  {job.title} · {job.status}
                </p>
              ))}
              {actor.role === "owner" && (
                <WebsiteAccess
                  workspace={workspace!}
                  reload={load}
                  busy={busy}
                  run={run}
                />
              )}
            </div>
          )}
          {workspace?.canInitialize && (
            <details className="web-edit-panel">
              <summary>Initialize a company-store website</summary>
              <p>
                Reuses the existing store membership, program settings and
                canonical product assortment.
              </p>
              <label>
                Existing approved store
                <select
                  value={newStore}
                  onChange={(e) => setNewStore(e.target.value)}
                >
                  <option value="">Choose a store</option>
                  {workspace.stores
                    .filter(
                      (store) =>
                        !workspace.sites.some(
                          (site) => site.store_id === store.id,
                        ),
                    )
                    .map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.title}
                      </option>
                    ))}
                </select>
              </label>
              <button
                disabled={busy || !newStore}
                onClick={() =>
                  void run(async () => {
                    await websiteCommand("initialize", { storeId: newStore });
                    await load();
                    setNewStore("");
                  }, "Scoped company-store website initialized.")
                }
              >
                Initialize selected store website
              </button>
            </details>
          )}
        </>
      )}
    </section>
  );
}

type Runner = (
  operation: () => Promise<unknown>,
  message: string,
) => Promise<void>;
function WebsiteAccess({
  workspace,
  reload,
  busy,
  run,
}: {
  workspace: WebsiteWorkspace;
  reload: () => Promise<unknown>;
  busy: boolean;
  run: Runner;
}) {
  const [userId, setUserId] = useState(""),
    [permission, setPermission] = useState("EDIT"),
    [reason, setReason] = useState("Scoped website responsibility");
  return (
    <>
      <h3>Scoped website access</h3>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            await websiteCommand("grant_capability", {
              siteId: workspace.site!.id,
              userId,
              permission,
              reason,
            });
            await reload();
          }, "Scoped capability granted.");
        }}
      >
        <label>
          Workspace team member
          <select
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Choose an eligible member</option>
            {workspace.memberships
              .filter(
                (row) => !["staff", "customer"].includes(String(row.role)),
              )
              .map((row) => (
                <option key={row.id} value={row.id}>
                  {String(row.name ?? row.email)} · {String(row.role)}
                </option>
              ))}
          </select>
        </label>
        <label>
          Website capability
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
          >
            {["EDIT", "PUBLISH", "MEDIA", "MERCHANDISE"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Access reason
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button disabled={busy || !userId}>Grant scoped capability</button>
      </form>
      {workspace.grants
        .filter((grant) => grant.status === "ACTIVE")
        .map((grant) => (
          <div className="web-history-row" key={grant.id}>
            <span>
              {String(
                workspace.memberships.find(
                  (row) => row.id === grant.data.userId,
                )?.name ?? "Team member",
              )}{" "}
              · {String(grant.data.permission)}
            </span>
            <button
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await websiteCommand("grant_capability", {
                    siteId: workspace.site!.id,
                    userId: grant.data.userId,
                    permission: grant.data.permission,
                    revoke: true,
                    reason: "Owner revoked scoped website access",
                  });
                  await reload();
                }, "Capability revoked immediately.")
              }
            >
              Revoke capability
            </button>
          </div>
        ))}
    </>
  );
}
