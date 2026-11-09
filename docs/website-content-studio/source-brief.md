# TwelveSpec — Premium Customer Experience & Backend Content Management

## Objective

Use the attached TwelveSpec customer experience wireframes as the preferred visual direction for our platform.

I want a premium, creative, modern e-commerce experience that combines the capabilities of a custom print and promotional products business, a creative design platform, a B2B purchasing system, and an organization storefront platform.

**Critical requirement: I must be able to manage and edit the website's content, imagery, navigation, branding, layouts, collections, and customer-facing experiences through a user-friendly backend without editing code.**

Before making changes, thoroughly inspect the current repository, existing architecture, implemented features, and all work already completed by Codex.

**Improve and extend what exists. Do not rebuild successful functionality or create redundant modules.**

---

## 1. Brand & Design Direction

Use the attached reference image as visual inspiration—not as a static website screenshot to reproduce.

The customer experience should feel creative, premium, professional, modern, and intuitive.

### Design system

- Primary backgrounds: clean white and very light neutral gray
- Primary text and navigation: charcoal / near-black
- Brand accent: vermilion `#FF3F1A`
- Supporting colors: restrained, contemporary neutrals
- Typography: bold, confident headlines paired with clean, readable interface typography
- Navigation: polished, intuitive mega menus
- Layouts: strong visual hierarchy, generous but efficient spacing
- Components: refined cards, product tiles, subtle shadows, modern filters, clear calls to action
- Photography: high-quality product imagery, realistic custom merchandise, and visually engaging marketing assets
- Microinteractions: tasteful hover states, transitions, animations, and responsive feedback

Avoid beige backgrounds, dated corporate templates, excessive visual clutter, and generic promotional-product website aesthetics.

The experience should feel like a premium creative-commerce brand without sacrificing usability.

Keep the current brand logo and assets unless separately approved for replacement.

---

## 2. Customer Experience

Preserve and improve the following connected experiences:

1. **Homepage:** compelling brand positioning, featured products, services, customer solutions, featured brands, campaigns, and prominent paths to customization or requesting a quote.
2. **Product Discovery:** browse by category, brand, industry, occasion, solution, and searchable product attributes, with attractive product imagery and color selections.
3. **Product Configuration:** configure colors, sizes, materials, quantities, decoration methods, locations, and compatible options.
4. **Creative Studio:** upload artwork, use design templates, customize products, preview designs, save projects, and reuse assets.
5. **Build Your Own Bundle:** combine products into coordinated projects with individual quantities, specifications, and shared artwork.
6. **Organization Stores:** branded company, school, team, fundraiser, and event stores, including an Add to Store workflow and approved product selections.
7. **Solutions:** shop by desired outcome, such as trade shows, uniforms, employee gifting, school fundraising, and industrial branding.
8. **Quote, Proof, Order & Reorder:** move smoothly from design through quotation or checkout, proof approval, fulfillment, and repeat purchasing.

The customer should see a simple, cohesive experience while complex supplier and production workflows operate behind the scenes.

Quote-first should remain available for custom or unverified products. Direct checkout should only be available for validated configurations.

---

## 3. Build a Backend Website & Content Studio

I want a centralized management experience accessible to authorized TwelveSpec administrators.

Proposed name: **Website & Content Studio**.

The backend must allow nontechnical users to manage the following:

### A. Page Management

- Create, edit, duplicate, schedule, publish, archive, and restore pages
- Edit page titles, subtitles, descriptions, buttons, and links
- Rearrange page sections visually
- Show or hide sections
- Select from reusable page layouts and components
- Preview desktop, tablet, and mobile versions
- Maintain draft, published, and revision history

### B. Visual Page Builder

Create a reusable, component-based editing system.

Examples of editable components:

- Hero sections
- Promotional banners
- Product carousels
- Featured collections
- Category grids
- Brand showcases
- Image galleries
- Testimonials
- Video sections
- Solution cards
- Call-to-action sections
- FAQ sections
- Rich text and image sections
- Forms and project inquiry sections

Administrators should be able to select components, change their content, reorder them, and adjust approved layout options.

Do not create arbitrary HTML editing as the primary experience.

### C. Brand Management

Provide centralized controls for:

- Brand colors and approved color palettes
- Typography and font hierarchy
- Logo variants
- Buttons and component styles
- Shared visual assets
- Global headers and footers
- Reusable design templates

Use design tokens so changes remain consistent across the website.

Protect the brand system from accidental inconsistent edits.

### D. Navigation Management

Allow administrators to manage:

- Main navigation
- Mega menus
- Category menus
- Dropdowns
- Featured menu images
- Promotional links
- Footer navigation
- Mobile navigation

Navigation should be data-driven rather than hardcoded.

### E. Product & Collection Merchandising

Allow administrators to:

- Create curated product collections
- Feature or hide products
- Set product merchandising order
- Associate products with brands, industries, solutions, and occasions
- Feature specific product images and compatible variants
- Manage customer-facing descriptions and SEO
- Control promotional content and featured categories

**Important:** Use the existing canonical product catalog as the source of truth. Do not create a second independent product database inside the CMS.

### F. Media & Creative Asset Management

Provide an organized library for:

- Product images and approved product views
- Website banners and campaign graphics
- Brand assets and logos
- Product videos
- Marketing design templates
- Creative Studio artwork presets
- Approved customer-facing mockups
- Downloadable resources

Support metadata, tagging, usage rights, revisions, reusable assets, and appropriate image optimization.

Original customer artwork and confidential supplier files must remain private.

### G. Campaign & Marketing Management

Allow TwelveSpec to create and manage:

- Seasonal promotions
- Featured campaigns
- Landing pages
- Product highlights
- Industry-specific pages
- Event promotions
- Fundraising campaigns
- Email and social media creative assets
- Downloadable catalogs and lookbooks

Where practical, reuse the same approved product and creative assets across marketing channels.

### H. Organization Store Management

Authorized administrators should be able to manage:

- Organization branding
- Storefront themes within approved brand rules
- Approved product assortments
- Uploaded logos and artwork
- Store banners and content
- Visibility and access permissions
- Order windows and program settings
- Store-specific collections

Company stores should reuse the underlying product and design data without duplicating uncontrolled records.

---

## 4. Editing Experience

The administrative experience must be easy enough that I can operate it independently.

I should be able to:

1. Sign into the backend.
2. Select Website & Content Studio.
3. Choose the page or section I want to edit.
4. Change content, images, or approved layout settings.
5. Preview the result.
6. Save a draft or publish the approved change.

Routine content updates should not require GitHub commits, database queries, code editing, or deployments.

Provide permissions, version history, and rollback for published content.

Make frequently used workflows fast, with minimal steps.

---

## 5. Technical Architecture

Before selecting a CMS or building custom administration, audit what already exists.

Evaluate whether the current architecture can support the required editing experience using:

- Existing platform administration capabilities
- Existing database and storage
- A modular component registry and structured content schema
- A suitable integrated or headless CMS, if justified
- Existing product, media, design, and organization-store records

**Do not automatically introduce another paid service or a second application.**

Recommend the lowest-complexity solution that meets our functional requirements, minimizes vendor lock-in, and reduces ongoing owner maintenance.

Keep these concerns logically separate:

- Website editorial content
- Canonical product intelligence
- Customer artwork and design documents
- Manufacturing specifications
- Marketing assets
- E-commerce transactions
- Organization-store configurations

Connect them through stable identifiers and explicit relationships.

Public content must not reveal private suppliers, wholesale pricing, client artwork, or internal production information.

Use appropriate authentication, authorization, versioning, validation, and secure storage.

---

## 6. Deliverables Required Before Implementation

First provide:

1. An audit of current website and backend capabilities.
2. A comparison of the existing UI against the attached design direction.
3. A customer experience gap analysis across the eight workflows.
4. A recommended backend CMS architecture, including build-versus-buy reasoning.
5. A list of reusable page components and their editable properties.
6. A proposed content schema and relationships to existing product/design data.
7. Wireframes for the Website & Content Studio administrative experience.
8. A phased implementation plan identifying what to preserve, modify, add, or eliminate.
9. Acceptance tests covering editing, previews, publishing, rollback, permissions, performance, and mobile responsiveness.

Separate currently working capabilities from proposed features.

Do not claim that a wireframe feature is already implemented without inspecting the code.

Do not modify production data, publish changes, deploy, or undertake a broad rebuild until the audit and proposed implementation have been reviewed.

---

## 7. Definition of Success

A customer sees a sophisticated, easy-to-use TwelveSpec shopping and customization experience.

I can independently manage customer-facing pages, featured products, menus, marketing content, collections, banners, and approved layouts through the backend.

The same verified product and creative intelligence can support the website, customer design tool, marketing materials, quotes, and eventual production workflows.

The system remains scalable without requiring me to become the permanent website administrator or developer.

**Build a premium experience that is easy for customers to use and easy for TwelveSpec to manage.**