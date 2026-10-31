import { expect, test } from "@playwright/test";
import { site } from "../src/data/site";

test("A2", async ({ page }) => {
  await page.route("**/challenges.cloudflare.com/**", (route) => route.abort());
  await page.goto("/join");
  await expect(page.locator("[name=name]")).toHaveCount(1);
  await expect(page.locator("[name=reach]")).toHaveCount(1);
  await expect(page.locator("[name=profession]")).toHaveCount(1);
  await expect(page.locator("[name=area]")).toHaveCount(1);
  for (const time of ["שעה בשבוע", "כמה שעות בשבוע", "משימה חד־פעמית"]) {
    await expect(page.getByText(time, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("link", { name: "או הצטרפו לקהילת הוואטסאפ", exact: true })).toHaveAttribute(
    "href",
    site.whatsapp,
  );

  const submit = page.locator("form button[type=submit]");
  await submit.click();
  await expect(page.getByText("שדה חובה", { exact: true }).first()).toBeVisible();

  await page.locator("[name=name]").fill("בדיקה");
  await page.locator("[name=reach]").fill("123");
  await page.locator("[name=profession]").fill("מורה");
  await page.locator("[name=area]").selectOption("ירושלים והסביבה");
  await page.getByText("שעה בשבוע", { exact: true }).click();
  await submit.click();
  await expect(page.getByText("מספר טלפון לא תקין", { exact: true })).toBeVisible();
  await expect(page.locator("[name=name]")).toHaveValue("בדיקה");
  await expect(page.locator("[name=reach]")).toHaveValue("123");

  await page.locator("[name=reach]").fill("not@mail");
  await submit.click();
  await expect(page.getByText("כתובת מייל לא תקינה", { exact: true })).toBeVisible();
  await expect(page.locator("[name=reach]")).toHaveValue("not@mail");

  await page.route("**/api/join", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "unavailable", message: "משהו השתבש, נסו שוב", fallback: true }),
    }),
  );
  await page.locator("[name=reach]").fill("member@example.com");
  await submit.click();
  await expect(page.getByText("משהו השתבש, נסו שוב", { exact: true })).toBeVisible();
  await expect(page.locator("[name=name]")).toHaveValue("בדיקה");
  await expect(page.getByRole("link", { name: "או הצטרפו לקהילת הוואטסאפ", exact: true })).toBeVisible();
  await page.unroute("**/api/join");

  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/join") posts.push(request.url());
  });
  await page.route("**/api/join", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    }),
  );
  await page.locator("[name=reach]").fill("0501234567");
  await submit.click();
  await expect(page.getByText("קיבלנו. נחזור אליך עם צוות ומשימה", { exact: true })).toBeVisible();
  await expect(submit).toBeDisabled();
  expect(posts).toHaveLength(1);

  await page.goto("/join");
  await page.locator("[name=name]").fill("בדיקה שנייה");
  await page.locator("[name=reach]").fill("0501234567");
  await page.locator("[name=profession]").fill("מורה");
  await page.locator("[name=area]").selectOption("ירושלים והסביבה");
  await page.getByText("שעה בשבוע", { exact: true }).click();
  await page.locator("form button[type=submit]").click();
  await expect(page.getByText("קיבלנו. נחזור אליך עם צוות ומשימה", { exact: true })).toBeVisible();
});
