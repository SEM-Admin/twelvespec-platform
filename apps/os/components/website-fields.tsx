"use client";

import {
  plainRichText,
  richTextPlain,
  WEBSITE_COMPONENTS,
  type MenuItem,
  type RichNode,
  type WebsiteDocument,
  type WebsiteLink,
  type WebsiteSection,
} from "../../../packages/contracts/src/website";
import type { Row } from "./types";

export type WebsiteChoices = {
  documents: Row[];
  collections: Row[];
  stores: Row[];
  media: Row[];
  categories: string[];
  brands: string[];
};
const move = <T,>(items: T[], index: number, offset: number) => {
  const next = [...items];
  [next[index], next[index + offset]] = [next[index + offset], next[index]];
  return next;
};
export function LinkField({
  label,
  value,
  onChange,
  choices,
  optional = false,
}: {
  label: string;
  value?: WebsiteLink;
  onChange: (value: WebsiteLink | undefined) => void;
  choices: WebsiteChoices;
  optional?: boolean;
}) {
  const link = value ?? {
    label: "Explore",
    kind: "WORKFLOW",
    href: "/catalog",
  };
  const targets =
    link.kind === "PAGE"
      ? choices.documents.filter((d) => d.document_type === "WEBSITE_PAGE")
      : link.kind === "COLLECTION"
        ? choices.collections
        : choices.stores;
  return (
    <fieldset className="web-edit-link">
      <legend>{label}</legend>
      {optional && (
        <label className="web-check">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked ? link : undefined)}
          />{" "}
          Show this action
        </label>
      )}
      {(!optional || value) && (
        <>
          <label>
            Button or link label
            <input
              value={link.label}
              maxLength={80}
              onChange={(e) => onChange({ ...link, label: e.target.value })}
            />
          </label>
          <label>
            Destination type
            <select
              value={link.kind}
              onChange={(e) => {
                const kind = e.target.value as WebsiteLink["kind"];
                onChange(
                  kind === "WORKFLOW" || kind === "EXTERNAL_HTTPS"
                    ? {
                        label: link.label,
                        kind,
                        href: kind === "WORKFLOW" ? "/catalog" : "https://",
                      }
                    : { label: link.label, kind },
                );
              }}
            >
              <option value="WORKFLOW">Storefront path</option>
              <option value="PAGE">Website page</option>
              <option value="COLLECTION">Product collection</option>
              <option value="STORE">Company store</option>
              <option value="EXTERNAL_HTTPS">External HTTPS website</option>
            </select>
          </label>
          {link.kind === "WORKFLOW" || link.kind === "EXTERNAL_HTTPS" ? (
            <label>
              Destination address
              <input
                value={link.href ?? ""}
                onChange={(e) => onChange({ ...link, href: e.target.value })}
                placeholder={
                  link.kind === "WORKFLOW" ? "/catalog" : "https://example.com"
                }
              />
            </label>
          ) : (
            <label>
              Choose destination
              <select
                value={link.targetId ?? ""}
                onChange={(e) =>
                  onChange({ ...link, targetId: e.target.value || undefined })
                }
              >
                <option value="">Select a permitted record</option>
                {targets.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </fieldset>
  );
}
function MultiChoice({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: string[];
  options: { id: string; title: string }[];
  onChange: (values: string[]) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      {options.length ? (
        options.map((option) => (
          <label className="web-check" key={option.id}>
            <input
              type="checkbox"
              checked={values.includes(option.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...values, option.id]
                    : values.filter((id) => id !== option.id),
                )
              }
            />
            {option.title}
          </label>
        ))
      ) : (
        <p>No permitted records available.</p>
      )}
      {values.map((id, index) => (
        <div className="web-order-item" key={id}>
          <span>
            {options.find((o) => o.id === id)?.title ?? "Unavailable record"}
          </span>
          <button
            type="button"
            aria-label={`Move ${label} item ${index + 1} up`}
            disabled={index === 0}
            onClick={() => onChange(move(values, index, -1))}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`Move ${label} item ${index + 1} down`}
            disabled={index === values.length - 1}
            onClick={() => onChange(move(values, index, 1))}
          >
            ↓
          </button>
        </div>
      ))}
    </fieldset>
  );
}
export function SectionFields({
  section,
  onChange,
  choices,
}: {
  section: WebsiteSection;
  onChange: (value: WebsiteSection) => void;
  choices: WebsiteChoices;
}) {
  const definition = WEBSITE_COMPONENTS.find(
    (component) => component.type === section.type,
  )!;
  const set = (key: string, value: unknown) => {
    const content = { ...section.content };
    if (value === undefined) delete content[key];
    else content[key] = value;
    onChange({ ...section, content });
  };
  const media = choices.media.filter(
    (row) =>
      row.status === "APPROVED" && row.data.kind === "WEBSITE_DERIVATIVE",
  );
  return (
    <>
      <label>
        Section layout
        <select
          value={section.variant}
          onChange={(e) => onChange({ ...section, variant: e.target.value })}
        >
          {definition.variants.map((variant) => (
            <option key={variant}>{variant}</option>
          ))}
        </select>
      </label>
      {definition.fields.map((field) => {
        const value = section.content[field.key],
          key = field.key;
        if (field.kind === "link")
          return (
            <LinkField
              key={key}
              label={field.label}
              value={value as WebsiteLink | undefined}
              onChange={(v) => set(key, v)}
              choices={choices}
              optional={key !== "primaryLink"}
            />
          );
        if (field.kind === "boolean")
          return (
            <label className="web-check" key={key}>
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => set(key, e.target.checked)}
              />
              {field.label}
            </label>
          );
        if (field.kind === "image")
          return (
            <label key={key}>
              {field.label}
              <select
                value={String(value ?? "")}
                onChange={(e) => {
                  const asset = media.find((row) => row.id === e.target.value);
                  const content = { ...section.content };
                  delete content.builtInImage;
                  if (asset) {
                    content[key] = asset.id;
                    content.imageAlt = String(asset.data.alt ?? "");
                  } else delete content[key];
                  onChange({ ...section, content });
                }}
              >
                <option value="">
                  {section.content.builtInImage
                    ? "Use existing synthetic illustration"
                    : "No image"}
                </option>
                {media.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </label>
          );
        if (field.kind === "select")
          return (
            <label key={key}>
              {field.label}
              <select
                value={String(value ?? "")}
                onChange={(e) => set(key, e.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          );
        if (
          field.kind === "collection" ||
          field.kind === "store" ||
          field.kind === "brandKit"
        ) {
          if (field.kind === "brandKit")
            return (
              <p key={key} className="web-edit-help">
                Organization brand-kit authorization is managed in Creative
                Studio. An existing approved association is preserved.
              </p>
            );
          const options =
            field.kind === "collection" ? choices.collections : choices.stores;
          return (
            <label key={key}>
              {field.label}
              <select
                value={String(value ?? "")}
                onChange={(e) => set(key, e.target.value || undefined)}
              >
                <option value="">Select a permitted record</option>
                {options.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </label>
          );
        }
        if (
          ["collections", "pages", "stores", "taxonomy"].includes(field.kind)
        ) {
          const options =
            field.kind === "collections"
              ? choices.collections
              : field.kind === "pages"
                ? choices.documents.filter(
                    (d) => d.document_type === "WEBSITE_PAGE",
                  )
                : field.kind === "stores"
                  ? choices.stores
                  : (key === "brandIds"
                      ? choices.brands
                      : choices.categories
                    ).map((id) => ({ id, title: id }));
          return (
            <MultiChoice
              key={key}
              label={field.label}
              values={Array.isArray(value) ? (value as string[]) : []}
              options={options}
              onChange={(v) => set(key, v)}
            />
          );
        }
        if (field.kind === "faq") {
          const entries =
            (value as { question: string; answer: RichNode[] }[]) ?? [];
          return (
            <fieldset key={key}>
              <legend>{field.label}</legend>
              {entries.map((entry, index) => (
                <div className="web-repeat" key={index}>
                  <label>
                    Question {index + 1}
                    <input
                      value={entry.question}
                      onChange={(e) =>
                        set(
                          key,
                          entries.map((item, n) =>
                            n === index
                              ? { ...item, question: e.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Answer {index + 1}
                    <textarea
                      value={richTextPlain(entry.answer)}
                      onChange={(e) =>
                        set(
                          key,
                          entries.map((item, n) =>
                            n === index
                              ? {
                                  ...item,
                                  answer: plainRichText(e.target.value),
                                }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        key,
                        entries.filter((_, n) => n !== index),
                      )
                    }
                  >
                    Remove question {index + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={entries.length >= 20}
                onClick={() =>
                  set(key, [
                    ...entries,
                    {
                      question: "New question",
                      answer: plainRichText("Your answer."),
                    },
                  ])
                }
              >
                Add question
              </button>
            </fieldset>
          );
        }
        if (field.kind === "gallery") {
          const items =
            (value as { assetId: string; alt: string; caption: string }[]) ??
            [];
          return (
            <fieldset key={key}>
              <legend>{field.label}</legend>
              {items.map((item, index) => (
                <div className="web-repeat" key={index}>
                  <label>
                    Gallery image {index + 1}
                    <select
                      value={item.assetId}
                      onChange={(e) =>
                        set(
                          key,
                          items.map((x, n) =>
                            n === index ? { ...x, assetId: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      <option value="">Choose an approved image</option>
                      {media.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Image description {index + 1}
                    <input
                      value={item.alt}
                      onChange={(e) =>
                        set(
                          key,
                          items.map((x, n) =>
                            n === index ? { ...x, alt: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Caption {index + 1}
                    <input
                      value={item.caption}
                      onChange={(e) =>
                        set(
                          key,
                          items.map((x, n) =>
                            n === index ? { ...x, caption: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        key,
                        items.filter((_, n) => n !== index),
                      )
                    }
                  >
                    Remove image {index + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={!media.length || items.length >= 12}
                onClick={() =>
                  set(key, [
                    ...items,
                    {
                      assetId: media[0].id,
                      alt: String(media[0].data.alt ?? ""),
                      caption: "",
                    },
                  ])
                }
              >
                Add gallery image
              </button>
            </fieldset>
          );
        }
        if (field.kind === "testimonials") {
          const entries =
              (value as {
                quote: string;
                publicAttribution: string;
                consentEvidenceId: string;
              }[]) ?? [],
            consents = choices.media.filter(
              (row) =>
                row.status === "VERIFIED" &&
                row.data.kind === "WEBSITE_CONSENT",
            );
          return (
            <fieldset key={key}>
              <legend>{field.label}</legend>
              <p>
                Record permission in the media library before adding a
                testimonial.
              </p>
              {entries.map((entry, index) => (
                <div className="web-repeat" key={index}>
                  {(["quote", "publicAttribution"] as const).map((name) => (
                    <label key={name}>
                      {name === "quote" ? "Statement" : "Public attribution"}{" "}
                      {index + 1}
                      <input
                        value={entry[name]}
                        onChange={(e) =>
                          set(
                            key,
                            entries.map((item, n) =>
                              n === index
                                ? { ...item, [name]: e.target.value }
                                : item,
                            ),
                          )
                        }
                      />
                    </label>
                  ))}
                  <label>
                    Consent evidence {index + 1}
                    <select
                      value={entry.consentEvidenceId}
                      onChange={(e) =>
                        set(
                          key,
                          entries.map((item, n) =>
                            n === index
                              ? { ...item, consentEvidenceId: e.target.value }
                              : item,
                          ),
                        )
                      }
                    >
                      {consents.map((row) => (
                        <option key={row.id} value={row.id}>
                          {row.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        key,
                        entries.filter((_, n) => n !== index),
                      )
                    }
                  >
                    Remove statement {index + 1}
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={!consents.length || entries.length >= 8}
                onClick={() =>
                  set(key, [
                    ...entries,
                    {
                      quote: "Approved statement",
                      publicAttribution: "Approved attribution",
                      consentEvidenceId: consents[0].id,
                    },
                  ])
                }
              >
                Add testimonial
              </button>
            </fieldset>
          );
        }
        if (field.kind === "textarea" || field.kind === "richtext")
          return (
            <label key={key}>
              {field.label}
              <textarea
                rows={4}
                maxLength={field.kind === "richtext" ? 4000 : 2000}
                value={
                  field.kind === "richtext"
                    ? richTextPlain((value as RichNode[]) ?? [])
                    : String(value ?? "")
                }
                onChange={(e) =>
                  set(
                    key,
                    field.kind === "richtext"
                      ? plainRichText(e.target.value)
                      : e.target.value,
                  )
                }
              />
            </label>
          );
        return (
          <label key={key}>
            {field.label}
            <input
              type={field.kind === "number" ? "number" : "text"}
              min={field.kind === "number" ? 1 : undefined}
              max={field.kind === "number" ? 12 : undefined}
              value={String(value ?? "")}
              onChange={(e) =>
                set(
                  key,
                  field.kind === "number"
                    ? Number(e.target.value)
                    : e.target.value,
                )
              }
            />
          </label>
        );
      })}
    </>
  );
}
export function NavigationFields({
  items,
  onChange,
  choices,
  depth = 1,
}: {
  items: MenuItem[];
  onChange: (items: MenuItem[]) => void;
  choices: WebsiteChoices;
  depth?: number;
}) {
  return (
    <div className="web-menu-editor">
      {items.map((item, index) => (
        <details key={item.id}>
          <summary>{item.label || "Untitled menu item"}</summary>
          <label>
            Menu label
            <input
              value={item.label}
              onChange={(e) =>
                onChange(
                  items.map((x, n) =>
                    n === index ? { ...x, label: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <LinkField
            label="Menu destination"
            value={item.link}
            onChange={(link) =>
              link &&
              onChange(items.map((x, n) => (n === index ? { ...x, link } : x)))
            }
            choices={choices}
          />
          <label>
            Featured menu image
            <select
              value={item.featuredAssetId ?? ""}
              onChange={(e) =>
                onChange(
                  items.map((x, n) =>
                    n === index
                      ? { ...x, featuredAssetId: e.target.value || undefined }
                      : x,
                  ),
                )
              }
            >
              <option value="">No featured image</option>
              {choices.media
                .filter((row) => row.status === "APPROVED")
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
            </select>
          </label>
          <div className="web-edit-actions">
            <button
              type="button"
              disabled={index === 0}
              aria-label={`Move ${item.label} menu up`}
              onClick={() => onChange(move(items, index, -1))}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={index === items.length - 1}
              aria-label={`Move ${item.label} menu down`}
              onClick={() => onChange(move(items, index, 1))}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => onChange(items.filter((_, n) => n !== index))}
            >
              Remove {item.label}
            </button>
          </div>
          {depth < 3 && (
            <NavigationFields
              items={item.children}
              choices={choices}
              depth={depth + 1}
              onChange={(children) =>
                onChange(
                  items.map((x, n) => (n === index ? { ...x, children } : x)),
                )
              }
            />
          )}
        </details>
      ))}
      <button
        type="button"
        disabled={items.length >= (depth === 1 ? 12 : 15)}
        onClick={() =>
          onChange([
            ...items,
            {
              id: crypto.randomUUID(),
              label: depth === 1 ? "New menu item" : "New submenu item",
              link: { label: "Explore", kind: "WORKFLOW", href: "/catalog" },
              children: [],
            },
          ])
        }
      >
        {depth === 1 ? "Add menu item" : "Add submenu item"}
      </button>
    </div>
  );
}
export function GlobalFields({
  document: d,
  onChange,
  choices,
}: {
  document: Exclude<WebsiteDocument, { documentType: "WEBSITE_PAGE" }>;
  onChange: (value: WebsiteDocument) => void;
  choices: WebsiteChoices;
}) {
  if (d.documentType === "WEBSITE_THEME")
    return (
      <>
        {(
          [
            [
              "paletteId",
              "Approved palette",
              ["neutral-vermilion", "neutral-blue", "neutral-slate"],
            ],
            ["fontPresetId", "Typography", ["existing-ui-sans", "system-sans"]],
            [
              "buttonStyleId",
              "Button style",
              ["charcoal-primary", "accent-charcoal-label"],
            ],
            [
              "spacingPresetId",
              "Section spacing",
              ["compact", "standard", "roomy"],
            ],
          ] as const
        ).map(([key, label, options]) => (
          <label key={key}>
            {label}
            <select
              value={d[key]}
              onChange={(e) => onChange({ ...d, [key]: e.target.value })}
            >
              {options.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        ))}
        <p>
          Current TwelveSpec wordmark is preserved. Palette colors and
          accessible text pairings are controlled by approved design tokens.
        </p>
      </>
    );
  if (d.documentType === "WEBSITE_NAVIGATION")
    return (
      <>
        <label className="web-check">
          <input
            type="checkbox"
            checked={d.searchEnabled}
            onChange={(e) =>
              onChange({ ...d, searchEnabled: e.target.checked })
            }
          />{" "}
          Show product search
        </label>
        <NavigationFields
          items={d.items}
          onChange={(items) => onChange({ ...d, items })}
          choices={choices}
        />
      </>
    );
  const group = (links: WebsiteLink[], set: (links: WebsiteLink[]) => void) => (
    <>
      {links.map((link, index) => (
        <div className="web-repeat" key={index}>
          <LinkField
            label={`Link ${index + 1}`}
            value={link}
            onChange={(value) =>
              value && set(links.map((x, n) => (n === index ? value : x)))
            }
            choices={choices}
          />
          <button
            type="button"
            onClick={() => set(links.filter((_, n) => n !== index))}
          >
            Remove link {index + 1}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={links.length >= 10}
        onClick={() =>
          set([
            ...links,
            { label: "New link", kind: "WORKFLOW", href: "/catalog" },
          ])
        }
      >
        Add link
      </button>
    </>
  );
  return (
    <>
      <label>
        Footer support copy
        <textarea
          value={d.supportCopy}
          maxLength={240}
          onChange={(e) => onChange({ ...d, supportCopy: e.target.value })}
        />
      </label>
      {d.groups.map((g, index) => (
        <details key={g.id}>
          <summary>{g.heading}</summary>
          <label>
            Group heading
            <input
              value={g.heading}
              onChange={(e) =>
                onChange({
                  ...d,
                  groups: d.groups.map((x, n) =>
                    n === index ? { ...x, heading: e.target.value } : x,
                  ),
                })
              }
            />
          </label>
          {group(g.links, (links) =>
            onChange({
              ...d,
              groups: d.groups.map((x, n) =>
                n === index ? { ...x, links } : x,
              ),
            }),
          )}
          <button
            type="button"
            onClick={() =>
              onChange({ ...d, groups: d.groups.filter((_, n) => n !== index) })
            }
          >
            Remove group
          </button>
        </details>
      ))}
      <button
        type="button"
        disabled={d.groups.length >= 6}
        onClick={() =>
          onChange({
            ...d,
            groups: [
              ...d.groups,
              { id: crypto.randomUUID(), heading: "New group", links: [] },
            ],
          })
        }
      >
        Add footer group
      </button>
      <details>
        <summary>Legal links</summary>
        {group(d.legalLinks, (legalLinks) => onChange({ ...d, legalLinks }))}
      </details>
      <details>
        <summary>Social links</summary>
        {group(d.socialLinks, (socialLinks) => onChange({ ...d, socialLinks }))}
      </details>
    </>
  );
}
