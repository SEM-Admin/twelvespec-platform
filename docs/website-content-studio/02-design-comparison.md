# Design-direction comparison

**Proposed design; not applied.** The reference image mentioned in the brief was not attached. This comparison is grounded in the written direction and the actual development screenshots, not an invented reading of that image.

## Current versus requested

| Dimension | Current inspected UI | Requested direction | Proposed change after review |
| --- | --- | --- | --- |
| Background | Shop `--paper: #FFFEFA`, cream `#F3F2E8`, hero `#ECEFDC`. | White and very light neutral gray; avoid beige. | White canvas and neutral section surfaces; remove cream/lime decorative backgrounds from customer pages. |
| Text/accent | Forest ink `#233B30`, green, lime and muted orange `#DB633A`. | Charcoal text and vermilion `#FF3F1A`. | Versioned semantic tokens with vermilion accents; keep existing logo lockups/assets intact. |
| Typography | Inter/Helvetica/Arial stack; confident hero, small navigation/body text. | Bold headlines and clean, readable interface text. | Retain the existing font stack initially; improve body/control sizing and responsive hierarchy. Add fonts only with approved licenses and tested loading. |
| Navigation | Hardcoded single-level category links, bundle/store links, mobile toggle. | Polished mega menus and customer-outcome navigation. | Shared data-driven navigation document, accessible groups, featured media and consistent mobile drill-down. |
| Homepage | Hero, value strip, product grid and one project CTA. | Brand positioning, products/services/solutions/brands/campaigns. | Editable approved blocks; preserve the existing product and quote entry points. |
| Product discovery | Four-column cards, swatches, basic filters. | Premium imagery, strong taxonomy, useful filtering. | Refined cards and controlled spacing, server-backed facets, curated collections and explicit image/variant selection. |
| Photography | 120 public synthetic product SVGs plus development uploads. | High-quality real merchandise and campaign assets. | Keep synthetic illustrations clearly identified for demos. Introduce rights-reviewed real assets through the media library; do not hotlink/scrape supplier images or invent reuse rights. |
| Microinteractions | Existing button/swatch feedback, loading and toast states. | Restrained, responsive interactions. | Consistent focus/hover/pressed states, reduced-motion support and honest save/publish progress. Avoid motion that delays configuration or quoting. |
| Organization stores | Shared visual presentation with program records. | Organization branding within approved rules. | Scoped theme/hero/banner/navigation overrides with canonical assortment and eligibility controls. |
| Owner control | Catalog/quote/integration workbenches and generic marketing records. | No-code routine website management. | A task-focused studio with page list, section list, live preview, inspector, review and history. |

Current screenshots: [desktop homepage](evidence/current-storefront-desktop.png), [mobile homepage](evidence/current-storefront-mobile.png), [product detail](evidence/current-product-detail.png), [Marketing](evidence/current-os-marketing.png).

## Proposed token contract

| Token | Initial proposed value | Owner-facing rule |
| --- | --- | --- |
| `surface.canvas` | `#FFFFFF` | Approved neutral palette. |
| `surface.subtle` | `#F5F6F7` | Section variant, not arbitrary per-block CSS. |
| `text.primary` | `#17191B` | Shared readable text. |
| `text.secondary` | `#545B64` | Contrast-checked against each allowed surface. |
| `brand.accent` | `#FF3F1A` | Requested vermilion. |
| `border.default` | `#DDE1E6` | Decorative dividers; interactive borders must separately meet contrast requirements. |
| `button.primary` | Charcoal with white text | Consistent default CTA. |
| `button.accent` | Vermilion with charcoal text | Contrast-safe accent option. |
| `type.family` | Existing UI sans stack | Pick from licensed, tested font IDs; no arbitrary font URL field. |
| `type.scale` | Fluid display, section heading, body 16 px, supporting/control text at least 14 px | Preview at 200% zoom; preserve the original logo typography independently. |
| `layout.spacing` | 8/16/24/40/64 px scale | Compact/standard/roomy variants with responsive mapping. |
| `motion` | Short feedback transitions; reduced-motion alternative | Never required to understand status or use navigation. |

These are semantic tokens and permitted variants, not a free-form CSS editor. Brand changes create a versioned theme draft with an impact preview. Existing logo artwork and lockups are preserved; replacing them is a separate owner decision.

## Vermilion and accessibility

Using the WCAG relative-luminance formula, white text on `#FF3F1A` has contrast approximately **3.513:1**. That is below the 4.5:1 minimum for ordinary text. Charcoal `#17191B` on that accent is approximately **5.018:1**; white on charcoal is approximately **17.628:1**. Preserve the requested accent while choosing appropriate label colors and large-text/decorative use. Do not round a borderline failing value into a pass. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

The fresh mobile audit also found an accessible-name defect. Correct it alongside responsive control changes. The proposed theme cannot be accepted on desktop screenshots alone: test keyboard navigation, focus visibility, drawer behavior, 200% zoom, reduced motion and small-screen labels.

## Visual boundaries

- Keep the current TwelveSpec wordmark, mark and owned assets. No replacement logo is proposed.
- Keep original product/design/quote/account behavior; extract presentation components incrementally.
- Use stable section IDs and approved variants so an owner can rearrange a page without making it inconsistent.
- Product media must represent the chosen variant or clearly state that it is illustrative. A polished mockup is not production geometry or a delivery promise.
- Designs shown in the wireframes are review prototypes. The buttons do not save or publish live content.
