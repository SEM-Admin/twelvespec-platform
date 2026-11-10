"use client";

import { useEffect, useState } from "react";
import { request, type Row } from "./types";
import { websiteCommand } from "./website-api";
import type { WebsiteWorkspace } from "./website-studio";

type Props = {
  workspace: WebsiteWorkspace;
  reload: () => Promise<unknown>;
  busy: boolean;
  run: (operation: () => Promise<unknown>, message: string) => Promise<void>;
};
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(new Error("The image file could not be read."));
    reader.readAsDataURL(file);
  });
}
export function WebsiteMedia({ workspace, reload, busy, run }: Props) {
  const [file, setFile] = useState<File | null>(null),
    [alt, setAlt] = useState(""),
    [caption, setCaption] = useState(""),
    [tags, setTags] = useState(""),
    [rights, setRights] = useState(false),
    [rightsNote, setRightsNote] = useState(""),
    [expires, setExpires] = useState("");
  const [search, setSearch] = useState(""),
    [uses, setUses] = useState<{
      asset: Row;
      uses: { title: string; path: string; published: boolean }[];
    } | null>(null),
    [consentTitle, setConsentTitle] = useState(""),
    [consentEvidence, setConsentEvidence] = useState(""),
    [consentConfirmed, setConsentConfirmed] = useState(false);
  if (!workspace.capabilities?.media)
    return <p>Website media permission is required for this site.</p>;
  return (
    <div className="web-library">
      <form
        className="web-edit-panel"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            if (!file) throw new Error("Choose an image.");
            if (file.size > 8 * 1024 * 1024)
              throw new Error("Images must be no larger than 8 MB.");
            await websiteCommand("upload_media", {
              siteId: workspace.site!.id,
              fileName: file.name,
              content: await readFile(file),
              alt,
              caption,
              tags: tags
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
              rightsConfirmed: rights,
              rightsNote,
              ...(expires
                ? { rightsExpiresAt: new Date(expires).toISOString() }
                : {}),
            });
            await reload();
            setFile(null);
            setRights(false);
          }, "Approved image derivative saved. Original bytes remain private.");
        }}
      >
        <h3>Add an approved website image</h3>
        <label>
          Website image file
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <label>
          Website image description
          <input
            required
            maxLength={300}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <label>
          Image caption
          <input
            maxLength={360}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </label>
        <label>
          Image tags, separated by commas
          <input value={tags} onChange={(e) => setTags(e.target.value)} />
        </label>
        <label>
          Rights evidence or license reference
          <textarea
            required
            value={rightsNote}
            maxLength={2000}
            onChange={(e) => setRightsNote(e.target.value)}
          />
        </label>
        <label>
          Rights expiry (optional)
          <input
            type="datetime-local"
            value={expires}
            onChange={(e) => setExpires(e.target.value)}
          />
        </label>
        <label className="web-check">
          <input
            type="checkbox"
            required
            checked={rights}
            onChange={(e) => setRights(e.target.checked)}
          />{" "}
          I confirm permission to publish this image on this website.
        </label>
        <button disabled={busy || !file || !rights}>
          Upload approved website image
        </button>
        <p>
          PNG, JPEG or WebP, up to 8 MB. Server processing removes metadata and
          creates a bounded WebP derivative. Customer artwork and supplier files
          must not be uploaded without publication rights.
        </p>
      </form>
      <div className="web-edit-panel">
        <h3>Reusable media</h3>
        <label>
          Search website media
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="web-media-grid">
          {workspace.media
            .filter((asset) =>
              `${asset.title} ${asset.data.alt} ${asset.data.tags}`
                .toLowerCase()
                .includes(search.toLowerCase()),
            )
            .map((asset) => (
              <article key={asset.id}>
                {!!asset.data.previewUrl && asset.status === "APPROVED" && (
                  <img
                    src={String(asset.data.previewUrl)}
                    alt={String(asset.data.alt ?? "")}
                  />
                )}
                <h4>{asset.title}</h4>
                <p>
                  {asset.status} · {String(asset.data.alt ?? "")}
                </p>
                <small>{String(asset.data.tags ?? "")}</small>
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(
                      async () =>
                        setUses(
                          await websiteCommand("media_usage", { id: asset.id }),
                        ),
                      "Media references loaded.",
                    )
                  }
                >
                  Show usage
                </button>
                {["APPROVED", "VERIFIED"].includes(asset.status) && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        if (
                          !window.confirm(
                            "Revoke this asset or consent? Published requests will stop serving it.",
                          )
                        )
                          return;
                        await websiteCommand("revoke_media", {
                          id: asset.id,
                          reason: "Owner revoked publication permission",
                        });
                        await reload();
                      }, "Permission revoked. Published reads revalidate access.")
                    }
                  >
                    Revoke permission
                  </button>
                )}
              </article>
            ))}
        </div>
        {uses && (
          <div>
            <h4>Usage: {uses.asset.title}</h4>
            {uses.uses.length ? (
              uses.uses.map((use, index) => (
                <p key={index}>
                  {use.title} · {use.path ?? "Shared content"} ·{" "}
                  {use.published ? "Published" : "Draft or history"}
                </p>
              ))
            ) : (
              <p>No recorded references.</p>
            )}
          </div>
        )}
        <details>
          <summary>Record testimonial permission</summary>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await websiteCommand("record_consent", {
                  siteId: workspace.site!.id,
                  title: consentTitle,
                  evidence: consentEvidence,
                  permissionConfirmed: consentConfirmed,
                });
                await reload();
                setConsentConfirmed(false);
              }, "Permission evidence saved privately. The website receives only the approved statement and attribution.");
            }}
          >
            <label>
              Permission record title
              <input
                required
                value={consentTitle}
                onChange={(e) => setConsentTitle(e.target.value)}
              />
            </label>
            <label>
              Private permission evidence
              <textarea
                required
                value={consentEvidence}
                onChange={(e) => setConsentEvidence(e.target.value)}
              />
            </label>
            <label className="web-check">
              <input
                type="checkbox"
                required
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
              />{" "}
              I confirm permission for the approved public attribution and
              statement.
            </label>
            <button disabled={busy || !consentConfirmed}>
              Record permission
            </button>
          </form>
        </details>
      </div>
    </div>
  );
}

type Product = {
  id: string;
  title: string;
  image?: string;
  variants: { id: string; color: string; size?: string }[];
};
type Member = {
  productId: string;
  variantId?: string;
  hidden: boolean;
  featured: boolean;
};
type Collection = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  industries: string[];
  solutions: string[];
  occasions: string[];
  items: Member[];
  expectedRevision?: number;
};
const empty = (): Collection => ({
  title: "",
  slug: "",
  description: "",
  seoTitle: "",
  seoDescription: "",
  industries: [],
  solutions: [],
  occasions: [],
  items: [],
});
export function WebsiteCollections({ workspace, reload, busy, run }: Props) {
  const [collection, setCollection] = useState<Collection>(empty),
    [products, setProducts] = useState<Product[]>([]),
    [productNames, setProductNames] = useState<Record<string, Product>>({}),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [pages, setPages] = useState(1),
    [catalogError, setCatalogError] = useState(""),
    [catalogLoading, setCatalogLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    const timer = setTimeout(() => {
      void request<{ products: Product[]; totalPages: number }>(
        `/api/website?${new URLSearchParams({ view: "catalog", siteId: workspace.site!.id, search, page: String(page), pageSize: "12" })}`,
      )
        .then((result) => {
          if (active) {
            setProducts(result.products);
            setPages(result.totalPages);
            setProductNames((names) => ({
              ...names,
              ...Object.fromEntries(
                result.products.map((product) => [product.id, product]),
              ),
            }));
            setCatalogError("");
          }
        })
        .catch((error) => {
          if (active)
            setCatalogError(
              error instanceof Error
                ? error.message
                : "Catalog could not load.",
            );
        })
        .finally(() => {
          if (active) setCatalogLoading(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [workspace.site?.id, search, page]);
  useEffect(() => {
    setCollection(empty());
    setProducts([]);
    setProductNames({});
    setPage(1);
    setSearch("");
  }, [workspace.site?.id]);
  if (!workspace.capabilities?.merchandise)
    return <p>Website merchandising permission is required for this site.</p>;
  const setMember = (index: number, change: Partial<Member>) =>
    setCollection({
      ...collection,
      items: collection.items.map((item, n) =>
        n === index ? { ...item, ...change } : item,
      ),
    });
  return (
    <div className="web-library">
      <div className="web-edit-panel">
        <h3>Canonical collections</h3>
        <p>
          Collections point to existing approved products. Publishing
          merchandising updates changes every page using that collection.
        </p>
        <label>
          Collection to manage
          <select
            value={collection.id ?? ""}
            disabled={busy}
            onChange={(event) => {
              if (!event.target.value) {
                setCollection(empty());
                return;
              }
              void run(async () => {
                const result = await websiteCommand<{
                  collection: Row;
                  items: Member[];
                  products: Product[];
                }>("get_collection", {
                  siteId: workspace.site!.id,
                  id: event.target.value,
                });
                const data = result.collection.data;
                setProductNames((names) => ({
                  ...names,
                  ...Object.fromEntries(
                    result.products.map((product) => [product.id, product]),
                  ),
                }));
                setCollection({
                  id: result.collection.id,
                  title: result.collection.title,
                  slug: String(data.slug ?? ""),
                  description: String(data.description ?? ""),
                  seoTitle: String(data.seoTitle ?? ""),
                  seoDescription: String(data.seoDescription ?? ""),
                  industries: (data.industries as string[]) ?? [],
                  solutions: (data.solutions as string[]) ?? [],
                  occasions: (data.occasions as string[]) ?? [],
                  items: result.items,
                  expectedRevision: result.collection.revision,
                });
              }, "Canonical collection loaded.");
            }}
          >
            <option value="">Create a new collection</option>
            {workspace.collections.map((row) => (
              <option key={row.id} value={row.id}>
                {row.title}
              </option>
            ))}
          </select>
        </label>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const result = await websiteCommand<Row>("save_collection", {
                ...collection,
                siteId: workspace.site!.id,
              });
              await reload();
              setCollection((current) => ({
                ...current,
                id: result.id,
                expectedRevision: result.revision,
              }));
            }, "Collection merchandising published using canonical products.");
          }}
        >
          <fieldset disabled={busy}>
            {(
              [
                "title",
                "slug",
                "description",
                "seoTitle",
                "seoDescription",
              ] as const
            ).map((name) => (
              <label key={name}>
                {
                  {
                    title: "Collection title",
                    slug: "Collection URL slug",
                    description: "Collection description",
                    seoTitle: "Collection SEO title",
                    seoDescription: "Collection SEO description",
                  }[name]
                }
                <input
                  required={name === "title" || name === "slug"}
                  maxLength={
                    name === "seoTitle"
                      ? 70
                      : name === "seoDescription"
                        ? 180
                        : name === "description"
                          ? 2000
                          : 160
                  }
                  value={collection[name]}
                  onChange={(e) =>
                    setCollection({ ...collection, [name]: e.target.value })
                  }
                />
              </label>
            ))}
            {(["industries", "solutions", "occasions"] as const).map((name) => (
              <label key={name}>
                {name} (comma separated)
                <input
                  value={collection[name].join(", ")}
                  onChange={(e) =>
                    setCollection({
                      ...collection,
                      [name]: e.target.value
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </label>
            ))}
            <h4>Collection order ({collection.items.length})</h4>
            {collection.items.map((item, index) => {
              const product = productNames[item.productId];
              return (
                <div className="web-repeat" key={item.productId}>
                  <strong>
                    {product?.title ?? `Existing approved product ${index + 1}`}
                  </strong>
                  <div className="web-edit-actions">
                    <button
                      type="button"
                      disabled={index === 0}
                      aria-label={`Move collection product ${index + 1} up`}
                      onClick={() => {
                        const items = [...collection.items];
                        [items[index - 1], items[index]] = [
                          items[index],
                          items[index - 1],
                        ];
                        setCollection({ ...collection, items });
                      }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === collection.items.length - 1}
                      aria-label={`Move collection product ${index + 1} down`}
                      onClick={() => {
                        const items = [...collection.items];
                        [items[index + 1], items[index]] = [
                          items[index],
                          items[index + 1],
                        ];
                        setCollection({ ...collection, items });
                      }}
                    >
                      ↓
                    </button>
                    <label className="web-check">
                      <input
                        type="checkbox"
                        checked={item.hidden}
                        onChange={(e) =>
                          setMember(index, { hidden: e.target.checked })
                        }
                      />{" "}
                      Hide product {index + 1}
                    </label>
                    <label className="web-check">
                      <input
                        type="checkbox"
                        checked={item.featured}
                        onChange={(e) =>
                          setMember(index, { featured: e.target.checked })
                        }
                      />{" "}
                      Feature product {index + 1}
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCollection({
                          ...collection,
                          items: collection.items.filter((_, n) => n !== index),
                        })
                      }
                    >
                      Remove product {index + 1}
                    </button>
                  </div>
                  {product && (
                    <label>
                      Featured compatible variant
                      <select
                        value={item.variantId ?? ""}
                        onChange={(e) =>
                          setMember(index, {
                            variantId: e.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Default product image</option>
                        {product.variants.map((variant) => (
                          <option key={variant.id} value={variant.id}>
                            {variant.color} · {variant.size}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              );
            })}
            <button
              className="web-edit-primary"
              disabled={busy || !collection.title || !collection.slug}
            >
              Publish collection merchandising
            </button>
          </fieldset>
        </form>
      </div>
      <div className="web-edit-panel">
        <h3>Approved catalog picker</h3>
        <label>
          Find products for this collection
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        {catalogError && <p role="alert">{catalogError}</p>}
        {catalogLoading && <p role="status">Loading approved products…</p>}
        <div className="web-media-grid">
          {products.map((product) => (
            <article key={product.id}>
              {product.image && <img src={product.image} alt={product.title} />}
              <h4>{product.title}</h4>
              <button
                disabled={
                  busy ||
                  catalogLoading ||
                  collection.items.some((item) => item.productId === product.id)
                }
                onClick={() =>
                  setCollection({
                    ...collection,
                    items: [
                      ...collection.items,
                      { productId: product.id, hidden: false, featured: false },
                    ],
                  })
                }
              >
                Add {product.title}
              </button>
              {workspace.site?.store_id && (
                <small>Already authorized for this store.</small>
              )}
            </article>
          ))}
        </div>
        <div className="web-edit-actions">
          <button
            disabled={catalogLoading || page === 1}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous catalog products
          </button>
          <span>
            {page} / {pages}
          </span>
          <button
            disabled={catalogLoading || page >= pages}
            onClick={() => setPage((value) => value + 1)}
          >
            Next catalog products
          </button>
        </div>
      </div>
    </div>
  );
}
