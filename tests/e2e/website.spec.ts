import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OS = "http://localhost:3001",
  SHOP = "http://localhost:3000";
// These journeys cover multiple publications, separate browser identities and
// cold Next development compilations. Individual assertions retain 10s limits.
test.setTimeout(120_000);
test.use({ actionTimeout: 10_000 });
let ownerCookies: Awaited<ReturnType<BrowserContext["cookies"]>> | undefined;
async function login(page: Page) {
  if (ownerCookies) await page.context().addCookies(ownerCookies);
  await page.goto(`${OS}/website`, { waitUntil: "networkidle" });
  if (await page.getByLabel("Email address", { exact: true }).isVisible()) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const signedIn = page.waitForResponse(
        (result) =>
          result.url().endsWith("/api/auth/sign-in/email") &&
          result.request().method() === "POST",
      );
      await page
        .getByRole("button", { name: "Sign in to workspace", exact: true })
        .click();
      const result = await signedIn;
      if (result.status() !== 429) {
        expect(result.ok()).toBeTruthy();
        break;
      }
      // Exercise the real limiter without changing its security configuration.
      const retryAfter = Number(result.headers()["retry-after"] ?? 10);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(15);
      await page.waitForTimeout((retryAfter + 1) * 1000);
    }
  }
  await expect(
    page.getByRole("heading", { name: "Website & Content Studio", level: 2 }),
  ).toBeVisible();
  ownerCookies = await page.context().cookies(OS);
}
function response(page: Page, action: string) {
  return page.waitForResponse((result) => {
    if (
      !result.url().endsWith("/api/website") ||
      result.request().method() !== "POST"
    )
      return false;
    try {
      return result.request().postDataJSON().action === action;
    } catch {
      return false;
    }
  });
}
async function command(page: Page, action: string, input: unknown) {
  const result = await page.request.post(`${OS}/api/website`, {
    headers: { origin: OS },
    data: { action, input },
  });
  expect(result.ok(), await result.text()).toBeTruthy();
  return (await result.json()).result;
}
async function save(page: Page) {
  const result = response(page, "save_document");
  await page
    .getByRole("button", { name: "Save website draft", exact: true })
    .click();
  expect((await result).ok()).toBeTruthy();
  await expect(
    page.getByRole("button", { name: "Save website draft", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Preview saved revision", exact: true }),
  ).toBeEnabled();
}
async function publish(page: Page, title: string) {
  await page
    .getByRole("checkbox", {
      name: `Select ${title} for publication`,
      exact: true,
    })
    .check();
  const result = response(page, "publish");
  await page
    .getByRole("button", {
      name: "Approve & publish selected (1)",
      exact: true,
    })
    .click();
  expect((await result).ok()).toBeTruthy();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Selected revisions published" }),
  ).toBeVisible();
}
async function openDocument(page: Page, title: string) {
  await page
    .locator(".web-document-row")
    .filter({
      has: page.locator("strong", { hasText: new RegExp("^" + title + "$") }),
    })
    .getByRole("button")
    .click();
  await expect(page.getByLabel("Document title", { exact: true })).toHaveValue(
    title,
  );
}
async function createPage(page: Page, title: string, path: string) {
  await page.getByLabel("New page title", { exact: true }).fill(title);
  await page.getByLabel("New page path", { exact: true }).fill(path);
  const result = response(page, "create_page");
  await page
    .getByRole("button", { name: "Create page draft", exact: true })
    .click();
  const payload = await (await result).json();
  expect(payload.result.record.id).toBeTruthy();
  await expect(page.getByLabel("Document title", { exact: true })).toHaveValue(
    title,
  );
  return payload.result;
}

test("CMS owner edits private drafts, previews exact revisions, publishes selected pages and restores history", async ({
  page,
  browser,
}) => {
  await login(page);
  const suffix = crypto.randomUUID().slice(0, 8),
    title = `Editorial ${suffix}`,
    path = `/editorial-${suffix}`,
    headline = `A carefully reviewed idea ${suffix}`;
  const created = await createPage(page, title, path);
  const originalRevision = created.revision.id;
  await page.getByLabel("Headline", { exact: true }).fill(headline);
  page.once("dialog", (dialog) => dialog.dismiss());
  await page
    .getByRole("button", { name: "Refresh website content", exact: true })
    .click();
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
    headline,
  );
  await save(page);
  const anonymous = await browser.newContext();
  try {
    const customer = await anonymous.newPage();
    const privateRead = await customer.request.get(
      `${SHOP}/api/website?path=${path}`,
    );
    expect((await privateRead.json()).website.page).toBeNull();
    const unauthorized = await customer.request.get(
      `${OS}/api/website?view=preview&siteId=${created.record.site_id}&revisionId=${originalRevision}`,
    );
    expect(unauthorized.status()).toBe(401);
    await page
      .getByRole("button", { name: "Preview saved revision", exact: true })
      .click();
    const preview = page.frameLocator(
      'iframe[title="Saved website revision preview"]',
    );
    await expect(
      preview.getByRole("heading", { name: headline, exact: true }),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Preview device", exact: true })
      .selectOption("390");
    await expect
      .poll(() =>
        page
          .locator("iframe")
          .evaluate(
            (frame) => (frame as HTMLIFrameElement).contentWindow?.innerWidth,
          ),
      )
      .toBe(390);
    const previewUrl = await page.locator("iframe").getAttribute("src");
    expect(previewUrl).toContain(created.record.site_id);
    const denied = await customer.request.get(OS + previewUrl);
    expect(denied.status()).toBe(404);
    const protectedRead = await page.request.get(OS + previewUrl);
    expect(protectedRead.headers()["cache-control"]).toContain("no-store");
    expect(protectedRead.headers()["x-robots-tag"]).toContain("noindex");
    await page
      .getByRole("button", { name: "Close preview", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Add approved component", exact: true })
      .selectOption("faq");
    await page
      .getByRole("button", { name: "Add section", exact: true })
      .click();
    await page.getByLabel("Heading", { exact: true }).fill("Project questions");
    await page
      .getByRole("button", { name: "Add question", exact: true })
      .click();
    await page
      .getByLabel("Question 1", { exact: true })
      .fill("Can we review a proof?");
    await page
      .getByRole("textbox", { name: "Answer 1", exact: true })
      .fill("Yes. Approve the exact saved proof before production.");
    const move = page.getByRole("button", {
      name: "Move section 3 up",
      exact: true,
    });
    await move.focus();
    await page.keyboard.press("Enter");
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Section moved to position 2 of 3" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Move section 2 up", exact: true }),
    ).toBeFocused();
    await page.getByLabel("Visible section 3", { exact: true }).uncheck();
    await save(page);
    const unrelated = await command(page, "create_page", {
      siteId: created.record.site_id,
      title: "Unrelated private page " + suffix,
      path: "/private-" + suffix,
    });
    await publish(page, title);
    await customer.goto(SHOP + path, { waitUntil: "networkidle" });
    await expect(
      customer.getByRole("heading", { name: headline, exact: true }),
    ).toBeVisible();
    await expect(
      customer.getByRole("heading", { name: "Project questions", exact: true }),
    ).toBeVisible();
    await expect(
      customer.getByRole("heading", {
        name: "Tell us what you’re making.",
        exact: true,
      }),
    ).toHaveCount(0);
    await customer.getByText("Can we review a proof?", { exact: true }).click();
    await expect(
      customer.getByText(
        "Yes. Approve the exact saved proof before production.",
        { exact: true },
      ),
    ).toBeVisible();
    expect(
      (
        await (
          await customer.request.get(
            `${SHOP}/api/website?path=${unrelated.revision.data.document.path}`,
          )
        ).json()
      ).website.page,
    ).toBeNull();
    await page.getByText(/Revision history \(/).click();
    const restore = response(page, "restore_revision");
    await page
      .getByRole("button", { name: "Restore revision 1 as draft", exact: true })
      .click();
    expect((await restore).ok()).toBeTruthy();
    await expect(page.getByLabel("Headline", { exact: true })).not.toHaveValue(
      headline,
    );
    await customer.reload({ waitUntil: "networkidle" });
    await expect(
      customer.getByRole("heading", { name: headline, exact: true }),
    ).toBeVisible();
    await publish(page, title);
    await customer.reload({ waitUntil: "networkidle" });
    await expect(
      customer.getByRole("heading", {
        name: "Make your next big idea tangible.",
        exact: true,
      }),
    ).toBeVisible();
    mkdirSync(".local/integration/screenshots", { recursive: true });
    await page.screenshot({
      path: ".local/integration/screenshots/website-editor.png",
      fullPage: true,
    });
  } finally {
    await anonymous.close();
  }
});

test("CMS company-store content follows the URL and current buyer membership", async ({
  page,
  browser,
}) => {
  await login(page);
  const workspace = await (await page.request.get(`${OS}/api/website`)).json();
  const store = workspace.stores.find(
    (row: { title: string }) => row.title === "Northline Team Store",
  );
  expect(store).toBeTruthy();
  await page
    .getByText("Initialize a company-store website", { exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Existing approved store", exact: true })
    .selectOption(store.id);
  const initializedResponse = response(page, "initialize");
  await page
    .getByRole("button", {
      name: "Initialize selected store website",
      exact: true,
    })
    .click();
  const initialized = (await (await initializedResponse).json()).result;
  await page
    .getByRole("combobox", { name: "Website", exact: true })
    .selectOption(initialized.site.id);
  await expect(
    page.locator(".web-document-row").filter({ hasText: store.title }),
  ).toBeVisible();
  await openDocument(page, store.title);
  const headline = "A private team program " + crypto.randomUUID().slice(0, 8);
  await page
    .getByRole("textbox", { name: "Heading", exact: true })
    .fill(headline);
  await save(page);
  await publish(page, store.title);
  const customerContext = await browser.newContext();
  try {
    const customer = await customerContext.newPage();
    await customer.goto(`${SHOP}/stores/${store.id}`, {
      waitUntil: "networkidle",
    });
    await expect(
      customer.getByRole("heading", {
        name: "Program access required.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      customer.getByRole("heading", { name: headline, exact: true }),
    ).toHaveCount(0);
    await customer
      .getByRole("button", { name: "Sign in for program access", exact: true })
      .click();
    await customer
      .getByRole("dialog")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    await expect(customer.getByRole("dialog")).toBeHidden();
    await expect(
      customer.getByRole("heading", { name: headline, exact: true }),
    ).toBeVisible();
    await expect(customer.locator(".program-choice")).toHaveCount(1);
    await expect(customer.locator(".program-hero")).toContainText(store.title);
    const publicRead = await customer.request.get(
      `${SHOP}/api/website?path=/&storeId=${store.id}`,
    );
    expect((await publicRead.json()).website.site.storeId).toBe(store.id);
    const logout = await customer.request.post(`${SHOP}/api/auth/sign-out`, {
      headers: { origin: SHOP, "content-type": "application/json" },
      data: {},
    });
    expect(logout.ok()).toBeTruthy();
    await customer.reload({ waitUntil: "networkidle" });
    await expect(
      customer.getByRole("heading", {
        name: "Program access required.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      customer.getByRole("heading", { name: headline, exact: true }),
    ).toHaveCount(0);
  } finally {
    await customerContext.close();
  }
});

test("CMS rejects an overlapping editor save and preserves newer content", async ({
  page,
}) => {
  await login(page);
  const suffix = crypto.randomUUID().slice(0, 8),
    title = "Conflict " + suffix;
  const created = await createPage(page, title, "/conflict-" + suffix);
  await page
    .getByLabel("Headline", { exact: true })
    .fill("Unsaved second editor");
  const remote = structuredClone(created.revision.data.document);
  remote.sections[0].content.heading = "First editor already saved";
  const saved = await command(page, "save_document", {
    id: created.record.id,
    expectedRevision: created.record.revision,
    document: remote,
    reason: "Concurrent editor acceptance",
  });
  const failed = response(page, "save_document");
  await page
    .getByRole("button", { name: "Save website draft", exact: true })
    .click();
  expect((await failed).status()).toBe(409);
  await expect(page.locator('.web-edit-error[role="alert"]')).toContainText(
    "REVISION_CONFLICT",
  );
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
    "Unsaved second editor",
  );
  const latest = await (
    await page.request.get(
      `${OS}/api/website?view=document&id=${created.record.id}`,
    )
  ).json();
  expect(latest.revision.id).toBe(saved.revision.id);
  expect(latest.revision.data.document.sections[0].content.heading).toBe(
    "First editor already saved",
  );
  await page
    .getByRole("button", { name: "Reload latest content", exact: true })
    .click();
  await expect(page.getByLabel("Headline", { exact: true })).toHaveValue(
    "First editor already saved",
  );
});

test("CMS publishes approved menus and brand tokens with a reversible coherent release", async ({
  page,
  browser,
}) => {
  await login(page);
  const workspace = await (await page.request.get(`${OS}/api/website`)).json();
  const originalRelease = workspace.site.active_release_id,
    suffix = crypto.randomUUID().slice(0, 8),
    label = "Explore future " + suffix;
  const anonymous = await browser.newContext();
  try {
    await openDocument(page, "Main navigation");
    await page
      .getByRole("button", { name: "Add menu item", exact: true })
      .click();
    const menu = page
      .locator(".web-menu-editor")
      .first()
      .locator(":scope > details")
      .last();
    await menu.locator("summary").first().click();
    await menu.getByLabel("Menu label", { exact: true }).fill(label);
    await menu
      .getByLabel("Destination address", { exact: true })
      .fill("/coming-soon");
    await save(page);
    await publish(page, "Main navigation");
    const customer = await anonymous.newPage();
    await customer.goto(SHOP, { waitUntil: "networkidle" });
    await expect(
      customer
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: label, exact: true }),
    ).toHaveAttribute("href", "/coming-soon");
    await openDocument(page, "Website brand");
    await page
      .getByRole("combobox", { name: "Approved palette", exact: true })
      .selectOption("neutral-blue");
    await page
      .getByRole("combobox", { name: "Button style", exact: true })
      .selectOption("accent-charcoal-label");
    await save(page);
    await publish(page, "Website brand");
    await customer.reload({ waitUntil: "networkidle" });
    await expect
      .poll(() =>
        customer
          .locator(".web-theme")
          .evaluate((element) =>
            getComputedStyle(element).getPropertyValue("--web-accent").trim(),
          ),
      )
      .toBe("#D7E8FF");
    await expect(
      customer
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: label, exact: true }),
    ).toBeVisible();
  } finally {
    const latest = await (await page.request.get(`${OS}/api/website`)).json();
    await command(page, "rollback_site", {
      siteId: workspace.site.id,
      releaseId: originalRelease,
      expectedGeneration: latest.site.generation,
      idempotencyKey: crypto.randomUUID(),
      reason:
        "Restore synthetic browser baseline after global publication acceptance",
    });
    await anonymous.close();
  }
});

test("CMS publishes only licensed image derivatives and canonical collections", async ({
  page,
  browser,
}) => {
  await login(page);
  const suffix = crypto.randomUUID().slice(0, 8),
    title = "Media " + suffix,
    path = "/media-" + suffix;
  const workspace = await (await page.request.get(`${OS}/api/website`)).json();
  await page
    .getByRole("button", { name: "Media library", exact: true })
    .click();
  const png = await sharp({
    create: { width: 120, height: 90, channels: 3, background: "#527b8c" },
  })
    .png()
    .withMetadata()
    .toBuffer();
  await page.getByLabel("Website image file", { exact: true }).setInputFiles({
    name: "synthetic-cms-" + suffix + ".png",
    mimeType: "image/png",
    buffer: png,
  });
  await page
    .getByLabel("Website image description", { exact: true })
    .fill("Synthetic blue test canvas " + suffix);
  await page
    .getByLabel("Rights evidence or license reference", { exact: true })
    .fill("Generated synthetic browser acceptance raster");
  await page
    .getByLabel("I confirm permission to publish this image on this website.", {
      exact: true,
    })
    .check();
  const uploaded = response(page, "upload_media");
  await page
    .getByRole("button", { name: "Upload approved website image", exact: true })
    .click();
  const asset = (await (await uploaded).json()).result;
  expect(asset.id).toBeTruthy();
  const anonymous = await browser.newContext();
  try {
    const customer = await anonymous.newPage();
    expect(
      (
        await customer.request.get(`${SHOP}/api/website/media/${asset.id}`)
      ).status(),
    ).toBe(404);
    await page
      .getByRole("button", { name: "Pages & design", exact: true })
      .click();
    await createPage(page, title, path);
    await page
      .getByRole("combobox", { name: "Approved image", exact: true })
      .selectOption(asset.id);
    await save(page);
    await publish(page, title);
    await customer.goto(SHOP + path, { waitUntil: "networkidle" });
    await expect(
      customer.getByRole("img", {
        name: "Synthetic blue test canvas " + suffix,
        exact: true,
      }),
    ).toBeVisible();
    const media = await customer.request.get(
      `${SHOP}/api/website/media/${asset.id}`,
    );
    expect(media.status()).toBe(200);
    expect(media.headers()["content-type"]).toContain("image/webp");
    expect((await sharp(await media.body()).metadata()).exif).toBeUndefined();
    const publicContent = await (
      await customer.request.get(`${SHOP}/api/website?path=${path}`)
    ).text();
    expect(publicContent).not.toContain(
      "Generated synthetic browser acceptance raster",
    );
    await page
      .getByRole("button", { name: "Collections", exact: true })
      .click();
    await page
      .getByLabel("Collection title", { exact: true })
      .fill("Browser assortment " + suffix);
    await page
      .getByLabel("Collection URL slug", { exact: true })
      .fill("browser-" + suffix);
    await page
      .getByLabel("Collection description", { exact: true })
      .fill("An approved synthetic assortment.");
    const picker = await (
      await page.request.get(
        `${OS}/api/website?view=catalog&siteId=${workspace.site.id}&pageSize=2`,
      )
    ).json();
    const first = picker.products[0];
    await page
      .getByLabel("Find products for this collection", { exact: true })
      .fill(first.title);
    await page
      .getByRole("button", { name: "Add " + first.title, exact: true })
      .click();
    const collectionSaved = response(page, "save_collection");
    await page
      .getByRole("button", {
        name: "Publish collection merchandising",
        exact: true,
      })
      .click();
    expect((await collectionSaved).ok()).toBeTruthy();
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "Collection merchandising published" }),
    ).toBeVisible();
    await customer.goto(`${SHOP}/collections/browser-${suffix}`, {
      waitUntil: "networkidle",
    });
    await expect(
      customer.getByRole("heading", { name: first.title, exact: true }),
    ).toBeVisible();
    await expect(customer.locator(".web-product")).toHaveCount(1);
    await command(page, "revoke_media", {
      id: asset.id,
      reason: "Synthetic rights revocation acceptance",
    });
    expect(
      (
        await customer.request.get(`${SHOP}/api/website/media/${asset.id}`)
      ).status(),
    ).toBe(404);
    await customer.goto(SHOP + path, { waitUntil: "networkidle" });
    await expect(
      customer.getByRole("img", {
        name: "Synthetic blue test canvas " + suffix,
        exact: true,
      }),
    ).toHaveCount(0);
  } finally {
    const latest = await (await page.request.get(`${OS}/api/website`)).json();
    await command(page, "rollback_site", {
      siteId: workspace.site.id,
      releaseId: workspace.site.active_release_id,
      expectedGeneration: latest.site.generation,
      idempotencyKey: crypto.randomUUID(),
      reason:
        "Restore the release before the synthetic media/revocation journey",
    });
    await anonymous.close();
  }
});
