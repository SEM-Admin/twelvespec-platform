"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import {
  PALETTES,
  safeWebsiteHref,
  type MenuItem,
  type PublicWebsiteProduct,
  type ResolvedWebsite,
  type RichNode,
  type WebsiteLink,
  type WebsiteSection,
} from "../../contracts/src/website";

export function WebsiteTheme({
  website,
  children,
}: {
  website: ResolvedWebsite;
  children: ReactNode;
}) {
  const palette = PALETTES[website.theme.paletteId];
  const style = {
    ...Object.fromEntries(
      Object.entries(palette).map(([key, value]) => [`--web-${key}`, value]),
    ),
    fontFamily:
      website.theme.fontPresetId === "system-sans"
        ? "system-ui, sans-serif"
        : undefined,
  } as CSSProperties;
  return (
    <div
      className={`web-theme web-spacing-${website.theme.spacingPresetId} web-buttons-${website.theme.buttonStyleId}`}
      style={style}
      onClick={
        website.preview
          ? (event) => {
              if ((event.target as HTMLElement).closest("a"))
                event.preventDefault();
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}

function href(website: ResolvedWebsite, link?: WebsiteLink) {
  if (!link) return undefined;
  const target =
    website.links[`${link.kind}:${link.targetId ?? link.href ?? ""}`];
  return target && safeWebsiteHref(target, link.kind === "EXTERNAL_HTTPS")
    ? target
    : undefined;
}
function Action({
  website,
  link,
  secondary = false,
}: {
  website: ResolvedWebsite;
  link?: WebsiteLink;
  secondary?: boolean;
}) {
  const target = href(website, link);
  return target ? (
    <a
      className={`web-button${secondary ? " web-secondary" : ""}`}
      href={target}
    >
      {link?.label}
      <span aria-hidden="true"> →</span>
    </a>
  ) : null;
}
function Menu({
  website,
  items,
}: {
  website: ResolvedWebsite;
  items: MenuItem[];
}) {
  return (
    <ul>
      {items.map((item) => {
        const target = href(website, item.link);
        return (
          <li key={item.id}>
            {item.children.length ? (
              <details>
                <summary>{item.label}</summary>
                <div className="web-menu-panel">
                  {target && <a href={target}>{item.label}</a>}
                  {item.featuredAssetId &&
                    website.media[item.featuredAssetId] && (
                      <img
                        src={website.media[item.featuredAssetId].url}
                        alt={website.media[item.featuredAssetId].alt}
                      />
                    )}
                  <Menu website={website} items={item.children} />
                </div>
              </details>
            ) : target ? (
              <a href={target}>{item.label}</a>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
export function WebsiteNavigation({ website }: { website: ResolvedWebsite }) {
  return (
    <nav className="web-navigation" aria-label="Main navigation">
      <Menu website={website} items={website.navigation.items} />
    </nav>
  );
}
export function WebsiteFooter({ website }: { website: ResolvedWebsite }) {
  const links = (items: WebsiteLink[]) =>
    items.map((link, index) => {
      const target = href(website, link);
      return target ? (
        <a key={index} href={target}>
          {link.label}
        </a>
      ) : null;
    });
  return (
    <footer className="web-footer">
      <div>
        <a
          className="wordmark footer-wordmark"
          href="/"
          aria-label="TwelveSpec home"
        >
          <span className="brand-symbol">
            <span />
            <span />
            <span />
            <span />
          </span>
          twelve<span>spec</span>
        </a>
        <p>{website.footer.supportCopy}</p>
      </div>
      {website.footer.groups.map((group) => (
        <div key={group.id}>
          <h2>{group.heading}</h2>
          {links(group.links)}
        </div>
      ))}
      <div className="web-legal">
        {links(website.footer.legalLinks)}
        {links(website.footer.socialLinks)}
        <small>
          Synthetic development preview. Quotes require review. No live payments
          or supplier orders.
        </small>
      </div>
    </footer>
  );
}
function RichText({
  nodes,
  website,
}: {
  nodes: RichNode[];
  website: ResolvedWebsite;
}) {
  return (
    <>
      {nodes.map((node, index) => {
        const children = node.text ?? (
          <RichText nodes={node.children ?? []} website={website} />
        );
        switch (node.type) {
          case "text":
            return (
              <span key={index}>
                {node.marks?.includes("strong") ? (
                  <strong>
                    {node.marks.includes("emphasis") ? (
                      <em>{children}</em>
                    ) : (
                      children
                    )}
                  </strong>
                ) : node.marks?.includes("emphasis") ? (
                  <em>{children}</em>
                ) : (
                  children
                )}
              </span>
            );
          case "paragraph":
            return <p key={index}>{children}</p>;
          case "heading":
            return node.level === 2 ? (
              <h2 key={index}>{children}</h2>
            ) : node.level === 3 ? (
              <h3 key={index}>{children}</h3>
            ) : (
              <h4 key={index}>{children}</h4>
            );
          case "list":
            return <ul key={index}>{children}</ul>;
          case "list_item":
            return <li key={index}>{children}</li>;
          case "link": {
            const target = href(website, node.link);
            return target ? (
              <a href={target} key={index}>
                {children}
              </a>
            ) : (
              <span key={index}>{children}</span>
            );
          }
        }
      })}
    </>
  );
}
export function WebsiteProductCard({
  product,
}: {
  product: PublicWebsiteProduct;
}) {
  const [selected, setSelected] = useState("");
  const variant =
    product.variants.find((v) => v.id === selected) ?? product.variants[0];
  const image = variant?.image ?? product.image;
  const colors = product.variants.filter(
    (v, index, all) => all.findIndex((x) => x.color === v.color) === index,
  );
  return (
    <article className="web-product">
      <a href={`/products/${product.id}`} aria-label={`View ${product.title}`}>
        {image ? (
          <img
            src={image}
            alt={`${product.title}${variant?.color ? ` in ${variant.color}` : ""}`}
            loading="lazy"
          />
        ) : (
          <div className="web-no-image">Photo pending review</div>
        )}
        <h3>{product.title}</h3>
      </a>
      <p>
        {product.brand} · Minimum {product.minimumQuantity}
      </p>
      {colors.length > 1 && (
        <div
          className="web-swatches"
          aria-label={`Colors for ${product.title}`}
        >
          {colors.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-label={`${product.title}: ${v.color}`}
              aria-pressed={variant?.color === v.color}
              onClick={() => setSelected(v.id)}
              style={{
                backgroundColor: /^#[\da-f]{6}$/i.test(v.hex) ? v.hex : "#ddd",
              }}
            />
          ))}
        </div>
      )}
      <a href={`/products/${product.id}`}>Configure & request a quote →</a>
    </article>
  );
}
function Section({
  section: s,
  website: w,
}: {
  section: WebsiteSection;
  website: ResolvedWebsite;
}) {
  const c = s.content;
  const text = (key: string) =>
    typeof c[key] === "string" ? String(c[key]) : "";
  const ids = (key: string) =>
    Array.isArray(c[key]) ? (c[key] as string[]) : [];
  const image = (
    assetId = String(c.imageAssetId ?? ""),
    alt = text("imageAlt"),
    builtIn = text("builtInImage"),
  ) => {
    const asset = w.media[assetId],
      src =
        asset?.url ??
        (/^\/products\/TS-\d{4}-[0-2]\.svg$/.test(builtIn)
          ? builtIn
          : undefined);
    return src ? (
      <img
        className="web-section-image"
        src={src}
        alt={alt || asset?.alt || ""}
        style={{
          objectPosition: `${Number(c.focalX ?? 0.5) * 100}% ${Number(c.focalY ?? 0.5) * 100}%`,
        }}
      />
    ) : null;
  };
  const heading = text("heading") ? <h2>{text("heading")}</h2> : null;
  const actions = (
    <div className="web-actions">
      <Action website={w} link={c.primaryLink as WebsiteLink | undefined} />
      <Action
        website={w}
        link={c.secondaryLink as WebsiteLink | undefined}
        secondary
      />
    </div>
  );
  const titleCard = (title: string, description: string, target: string) => (
    <a className="web-card" key={target} href={target}>
      <h3>{title}</h3>
      <p>{description}</p>
      <span aria-hidden="true">Explore →</span>
    </a>
  );
  switch (s.type) {
    case "hero":
    case "organization_hero":
      return (
        <div className="web-hero">
          <div>
            {text("eyebrow") && (
              <p className="web-eyebrow">{text("eyebrow")}</p>
            )}
            <h1>{text("heading")}</h1>
            <p>{text("body")}</p>
            {s.type === "hero" ? (
              actions
            ) : (
              <Action website={w} link={c.link as WebsiteLink | undefined} />
            )}
          </div>
          {image()}
        </div>
      );
    case "promotion_banner":
      return (
        <div className={`web-banner web-tone-${text("tone")}`}>
          <p>{text("message")}</p>
          <Action website={w} link={c.link as WebsiteLink | undefined} />
        </div>
      );
    case "cta":
      return (
        <div className={`web-cta web-tone-${text("tone")}`}>
          {heading}
          <p>{text("body")}</p>
          {actions}
        </div>
      );
    case "product_carousel": {
      const collection = w.collections[String(c.collectionId)];
      return (
        <>
          {heading}
          {collection && (
            <>
              <div className="web-products">
                {collection.products
                  .slice(0, Number(c.limit ?? 8))
                  .map((product) => (
                    <WebsiteProductCard
                      key={product.id}
                      product={
                        c.showSwatches === false
                          ? {
                              ...product,
                              variants: product.variants.slice(0, 1),
                            }
                          : product
                      }
                    />
                  ))}
              </div>
              <a href={`/collections/${collection.slug}`}>
                Explore {collection.title} →
              </a>
            </>
          )}
        </>
      );
    }
    case "featured_collections":
      return (
        <>
          {heading}
          <div className="web-cards">
            {ids("collectionIds")
              .map((id) => w.collections[id])
              .filter(Boolean)
              .map((collection) =>
                titleCard(
                  collection.title,
                  collection.description,
                  `/collections/${collection.slug}`,
                ),
              )}
          </div>
        </>
      );
    case "category_grid":
      return (
        <>
          {heading}
          <div className="web-cards">
            {ids("categoryIds")
              .filter((id) => w.taxonomy.categories.includes(id))
              .map((id) =>
                titleCard(
                  id,
                  "Explore approved products.",
                  `/catalog?category=${encodeURIComponent(id)}`,
                ),
              )}
          </div>
        </>
      );
    case "brand_showcase":
      return (
        <>
          {heading}
          <div className="web-cards">
            {ids("brandIds")
              .filter((id) => w.taxonomy.brands.includes(id))
              .map((id) =>
                titleCard(
                  id,
                  "Discover the collection.",
                  `/catalog?brand=${encodeURIComponent(id)}`,
                ),
              )}
          </div>
        </>
      );
    case "image_gallery":
      return (
        <>
          {heading}
          <div className="web-gallery">
            {(c.items as { assetId: string; alt: string; caption: string }[])
              .filter((item) => w.media[item.assetId])
              .map((item, index) => (
                <figure key={index}>
                  {image(item.assetId, item.alt, "")}
                  {c.captions === true && (
                    <figcaption>{item.caption}</figcaption>
                  )}
                </figure>
              ))}
          </div>
        </>
      );
    case "testimonials":
      return (
        <>
          {heading}
          <div className="web-cards">
            {(c.entries as { quote: string; publicAttribution: string }[]).map(
              (entry, index) => (
                <figure key={index}>
                  <blockquote>{entry.quote}</blockquote>
                  <figcaption>{entry.publicAttribution}</figcaption>
                </figure>
              ),
            )}
          </div>
        </>
      );
    case "solution_cards":
      return (
        <>
          {heading}
          <div className="web-cards">
            {ids("solutionPageIds")
              .map((id) => w.pages[id])
              .filter(Boolean)
              .map((page) =>
                titleCard(page.title, page.description, page.path),
              )}
          </div>
        </>
      );
    case "faq":
      return (
        <>
          {heading}
          {(c.entries as { question: string; answer: RichNode[] }[]).map(
            (entry, index) => (
              <details
                className="web-faq"
                key={index}
                open={s.variant === "expanded" ? true : undefined}
              >
                <summary>{entry.question}</summary>
                <RichText nodes={entry.answer} website={w} />
              </details>
            ),
          )}
        </>
      );
    case "rich_text_image":
      return (
        <div className="web-rich">
          {s.variant === "image-left" && image()}
          <div>
            {heading}
            <RichText nodes={c.body as RichNode[]} website={w} />
          </div>
          {s.variant === "image-right" && image()}
        </div>
      );
    case "project_inquiry":
      return (
        <div className="web-cta">
          {heading}
          <p>{text("intro")}</p>
          <a className="web-button" href="/cart">
            {text("ctaLabel")} →
          </a>
          <p className="web-hint">
            Choose products and quantities, then sign in to save your private
            quote request.
          </p>
        </div>
      );
    case "store_grid":
      return (
        <>
          {heading}
          <div className="web-cards">
            {ids("storeIds")
              .map((id) => w.stores[id])
              .filter(Boolean)
              .map((store) =>
                titleCard(
                  store.title,
                  store.description,
                  `/stores/${store.id}`,
                ),
              )}
          </div>
        </>
      );
    case "campaign_window_notice": {
      const store = w.stores[String(c.storeId)];
      if (!store) return null;
      const now = Date.now(),
        before = store.startsAt && Date.parse(store.startsAt) > now,
        closed = store.closesAt && Date.parse(store.closesAt) <= now;
      return (
        <p className="web-banner">
          {text(before ? "beforeText" : closed ? "closedText" : "openText")}
        </p>
      );
    }
    // These contracts deliberately remain unavailable until their activation requirements pass.
    case "video":
    case "download_resources":
      return null;
  }
}
export function WebsiteSections({ website }: { website: ResolvedWebsite }) {
  return (
    <div className="web-sections">
      {website.page?.sections
        .filter((section) => section.visible)
        .map((section) => (
          <section
            className={`web-section web-${section.type} web-layout-${section.variant}`}
            data-section-id={section.id}
            key={section.id}
          >
            <Section section={section} website={website} />
          </section>
        ))}
    </div>
  );
}
