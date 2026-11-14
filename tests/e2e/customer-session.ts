import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page, type BrowserContext } from "@playwright/test";

const SHOP = "http://localhost:3000";
type Cookies = Awaited<ReturnType<BrowserContext["cookies"]>>;
// Share a real UI-authenticated customer session only within this disposable
// database. Repeated fixture logins must not overwhelm the production limiter.
const fingerprint = createHash("sha256")
  .update(process.env.DATABASE_URL ?? "local")
  .digest("hex");
const folder = resolve(process.env.TWELVESPEC_ROOT ?? process.cwd(), ".local");
const cache = resolve(folder, "browser-customer-" + fingerprint + ".json");
export async function loginCustomer(page: Page, path = "/") {
  const destination = new URL(path, SHOP);
  if (destination.origin !== SHOP)
    throw new Error("Customer fixture is local only.");
  let cookies: Cookies = [];
  try {
    cookies = JSON.parse(readFileSync(cache, "utf8"));
  } catch {}
  if (cookies.length) await page.context().addCookies(cookies);
  const session = await page.request.get(SHOP + "/api/session");
  const authenticated =
    session.ok() && (await session.json()).actor?.role === "customer";
  await page.goto(destination.toString(), { waitUntil: "networkidle" });
  if (!authenticated) {
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const receipt = page.waitForResponse(
      (r) =>
        r.url().endsWith("/api/auth/sign-in/email") &&
        r.request().method() === "POST",
    );
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Sign in", exact: true })
      .click();
    const response = await receipt;
    expect(response.status(), "Customer sign-in should succeed").toBe(200);
    await expect(page.getByRole("dialog")).toBeHidden();
  }
  const verified = await page.request.get(SHOP + "/api/session");
  expect(verified.ok()).toBe(true);
  expect((await verified.json()).actor?.role).toBe("customer");
  mkdirSync(folder, { recursive: true });
  writeFileSync(
    cache,
    JSON.stringify(
      (await page.context().cookies(SHOP)).filter((c) =>
        c.name.includes("twelvespec-shop"),
      ),
    ),
    { mode: 0o600 },
  );
}
