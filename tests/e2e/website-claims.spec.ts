import {loginCustomer} from './customer-session';
import { test, expect, type Page } from "@playwright/test";
import axe from "axe-core";
import { loginOwner } from "./owner-session";
const OS = "http://localhost:3001",
  SHOP = "http://localhost:3000";
test.setTimeout(150000);
test.use({ actionTimeout: 10000 });

function receipt(page: Page, action: string, path = "/api/website") {
  return page.waitForResponse(
    (r) =>
      r.url().endsWith(path) &&
      r.request().method() === "POST" &&
      r.request().postDataJSON()?.action === action,
  );
}
async function platform(
  page: Page,
  module: string,
  action: string,
  input: unknown,
) {
  const response = await page.request.post(OS + "/api/platform", {
    headers: { Origin: OS },
    data: { module, action, input },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).result;
}
async function website(page: Page, action: string, input: unknown) {
  const response = await page.request.post(OS + "/api/website", {
    headers: { Origin: OS },
    data: { action, input },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  return (await response.json()).result;
}

test("owner authors a permitted service claim, customer sees its qualifications, and source revocation removes it", async ({
  page,
  browser,
}) => {
  const suffix = crypto.randomUUID().slice(0, 8),
    sourceTitle = "SYNTHETIC claim evidence " + suffix,
    pageTitle = "Supported services " + suffix,
    path = "/supported-services-" + suffix,
    statement = "Managed print project review " + suffix;
  await loginOwner(page, "/supplier");
  const library = page.getByRole("region", {
    name: "Private price evidence",
    exact: true,
  });
  await library.getByText("Record a source document", { exact: true }).click();
  await library.getByLabel("Source name", { exact: true }).fill(sourceTitle);
  await library
    .getByLabel("Publisher or supplier", { exact: true })
    .fill("PRIVATE SYNTHETIC policy publisher");
  await library
    .getByLabel("Edition or version", { exact: true })
    .fill("policy-test/1");
  await library
    .getByRole("combobox", { name: "Evidence origin", exact: true })
    .selectOption("OPERATOR_DOCUMENT");
  await library
    .getByLabel("Reference document (fingerprint only)", { exact: true })
    .setInputFiles({
      name: "synthetic-claim-policy.txt",
      mimeType: "text/plain",
      buffer: Buffer.from(
        "SYNTHETIC TEST ONLY. No real business claim or rights established. Tests the operator-document policy branch.",
      ),
    });
  await library
    .getByLabel("Rights or agreement reference", { exact: true })
    .fill("PRIVATE SYNTHETIC rights locator");
  const permission = library.getByRole("checkbox", {
    name: "The source explicitly permits supporting public website capability claims.",
    exact: true,
  });
  await expect(permission).not.toBeChecked();
  await permission.check();
  await library
    .getByRole("checkbox", {
      name: "I confirmed the permitted use and retention stated above.",
      exact: true,
    })
    .check();
  const recorded = receipt(page, "register_evidence_source", "/api/platform");
  await library
    .getByRole("button", { name: "Save source evidence", exact: true })
    .click();
  const sourceResponse = await recorded;
  expect(sourceResponse.ok()).toBeTruthy();
  const source = (await sourceResponse.json()).result;
  expect(source.allowed_uses).toEqual(["INTERNAL_RESEARCH", "PUBLIC_CLAIM"]);
  await expect(library.getByRole("status")).toContainText(
    "Source recorded privately",
  );

  // An isolated private program keeps this revocation scenario independent of
  // the main storefront's other editorial acceptance journeys.
  const store = await platform(page, "stores", "create_store", {
    title: "Claim test program " + suffix,
    type: "CORPORATE_ON_GOING",
  });
  await platform(page, "stores", "approve", { id: store.id });
  const session = await (await page.request.get(OS + "/api/session")).json();
  // Customer membership is established through the existing owner command;
  // resolve its server-validated identity using an independent real sign-in.
  const customerContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  try {
    const customer = await customerContext.newPage();
    await loginCustomer(customer);
    const customerSession = await (
      await customer.request.get(SHOP + "/api/session")
    ).json();
    expect(customerSession.actor.role).toBe("customer");
    expect(session.actor.role).toBe("owner");
    await platform(page, "stores", "add_member", {
      storeId: store.id,
      userId: customerSession.actor.userId,
    });
    await website(page, "initialize", { storeId: store.id });
    await page.goto(OS + "/website", { waitUntil: "networkidle" });
    const workspaceResponse = await page.request.get(OS + "/api/website");
    const workspace = await workspaceResponse.json(),
      site = workspace.sites.find(
        (s: { store_id: string }) => s.store_id === store.id,
      );
    expect(site?.id).toBeTruthy();
    await page
      .getByRole("combobox", { name: "Website", exact: true })
      .selectOption(site.id);
    await expect(
      page.getByRole("combobox", { name: "Website", exact: true }),
    ).toHaveValue(site.id);
    await page.getByLabel("New page title", { exact: true }).fill(pageTitle);
    await page.getByLabel("New page path", { exact: true }).fill(path);
    const created = receipt(page, "create_page");
    await page
      .getByRole("button", { name: "Create page draft", exact: true })
      .click();
    expect((await created).ok()).toBeTruthy();
    await expect(
      page.getByLabel("Document title", { exact: true }),
    ).toHaveValue(pageTitle);
    await page
      .getByRole("combobox", { name: "Add approved component", exact: true })
      .selectOption("capability_claims");
    await page
      .getByRole("button", { name: "Add section", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add capability assertion", exact: true })
      .click();
    const assertion = page.getByRole("group", {
      name: "Capability assertion 1",
      exact: true,
    });
    await assertion
      .getByRole("combobox", { name: "Capability", exact: true })
      .selectOption("MANAGED_PRINT");
    await assertion
      .getByRole("combobox", { name: "Truth status", exact: true })
      .selectOption("CONDITIONAL_OR_QUOTE_FIRST");
    await assertion
      .getByLabel("Public statement", { exact: true })
      .fill(statement);
    await assertion
      .getByLabel("Public context", { exact: true })
      .fill("Synthetic example of a managed print review.");
    await assertion
      .getByLabel("Public limitations", { exact: true })
      .fill(
        "Subject to a reviewed quote and producer acceptance; no stock, delivery or production guarantee.",
      );
    await assertion
      .getByRole("combobox", { name: "Authoring origin", exact: true })
      .selectOption("AI_ASSISTED");
    await assertion
      .getByRole("combobox", { name: "Evidence confidence", exact: true })
      .selectOption("DOCUMENTED");
    await assertion
      .getByLabel("Last verified at (UTC)", { exact: true })
      .fill(new Date(Date.now() - 3600000).toISOString().slice(0, 16));
    await assertion
      .getByLabel("Effective from (UTC)", { exact: true })
      .fill(new Date(Date.now() - 3600000).toISOString().slice(0, 16));
    await assertion
      .getByLabel("Claim expires at (UTC)", { exact: true })
      .fill(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
    await assertion
      .getByLabel("Private review and proof reference", { exact: true })
      .fill("PRIVATE proof locator — synthetic browser acceptance only");
    await assertion
      .getByLabel("Find public-use evidence", { exact: true })
      .fill(sourceTitle);
    const evidence = assertion.getByRole("combobox", {
      name: "Evidence source",
      exact: true,
    });
    await expect(evidence.locator(`option[value="${source.id}"]`)).toHaveCount(
      1,
    );
    await evidence.selectOption(source.id);
    await assertion
      .getByRole("button", { name: "Add supporting evidence", exact: true })
      .click();
    const saved = receipt(page, "save_document");
    await page
      .getByRole("button", { name: "Save website draft", exact: true })
      .click();
    expect((await saved).ok()).toBeTruthy();
    expect(
      (
        await (
          await customer.request.get(
            `${SHOP}/api/website?storeId=${store.id}&path=${path}`,
          )
        ).json()
      ).website.page,
    ).toBeNull();
    await page
      .getByRole("checkbox", {
        name: `Select ${pageTitle} for publication`,
        exact: true,
      })
      .check();
    const published = receipt(page, "publish");
    await page
      .getByRole("button", {
        name: "Approve & publish selected (1)",
        exact: true,
      })
      .click();
    const publishResponse = await published;
    expect(publishResponse.ok(), await publishResponse.text()).toBeTruthy();
    await customer.goto(`${SHOP}/stores/${store.id}${path}`, {
      waitUntil: "networkidle",
    });
    await expect(
      customer.getByRole("heading", { name: statement, exact: true }),
    ).toBeVisible();
    await expect(
      customer.getByText("Managed through specialist production partners", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      customer.getByText("Subject to a reviewed quote", { exact: true }),
    ).toBeVisible();
    const publicResult = await (
        await customer.request.get(
          `${SHOP}/api/website?storeId=${store.id}&path=${path}`,
        )
      ).json(),
      publicText = JSON.stringify(publicResult);
    const html = await (await customer.request.get(customer.url())).text();
    for (const privateValue of [
      source.id,
      sourceTitle,
      "PRIVATE SYNTHETIC",
      "PRIVATE proof locator",
      "reviewReference",
      "sourceIds",
    ]) {
      expect(publicText).not.toContain(privateValue);
      expect(html).not.toContain(privateValue);
    }
    expect(
      await customer.locator("body").evaluate((el) => el.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await customer.addScriptTag({ content: axe.source });
    const accessibility = await customer.evaluate(async () =>
      (window as unknown as { axe: typeof axe }).axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      }),
    );
    expect(accessibility.violations).toEqual([]);

    await page.goto(OS + "/supplier");
    const current = page.getByRole("region", {
      name: "Private price evidence",
      exact: true,
    });
    await current
      .getByLabel("Search private evidence", { exact: true })
      .fill(sourceTitle);
    await current
      .getByRole("button", { name: sourceTitle, exact: true })
      .click();
    await current
      .getByText("Restrict source: " + sourceTitle, { exact: true })
      .click();
    await current
      .getByLabel("Restriction reason", { exact: true })
      .fill("SYNTHETIC claim permission withdrawn");
    await current
      .getByRole("button", { name: "Restrict source", exact: true })
      .click();
    await expect(current.getByRole("status")).toContainText(
      "Source restricted",
    );
    await customer.reload({ waitUntil: "networkidle" });
    await expect(
      customer.getByRole("heading", { name: statement, exact: true }),
    ).toHaveCount(0);
    await expect(
      customer.getByRole("heading", {
        name: "Make your next big idea tangible.",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await customerContext.close();
  }
});
