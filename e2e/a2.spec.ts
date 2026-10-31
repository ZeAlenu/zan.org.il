import { expect, test } from "@playwright/test";
import { site } from "../src/data/site";

test.fixme("A2", async ({ page }) => {
  await page.goto("/join");
  await expect(page.locator("[name=name]")).toHaveCount(1);
  await expect(page.locator("[name=phone]")).toHaveCount(1);
  await expect(page.locator("[name=email]")).toHaveCount(1);
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
  await expect(page.getByText("שדה חובה", { exact: true })).toBeVisible();

  await page.locator("[name=name]").fill("בדיקה");
  await page.locator("[name=phone]").fill("123");
  await page.locator("[name=profession]").fill("מורה");
  await page.locator("[name=area]").fill("ירושלים");
  await page.getByText("שעה בשבוע", { exact: true }).click();
  await submit.click();
  await expect(page.getByText("מספר טלפון לא תקין", { exact: true })).toBeVisible();
  await expect(page.locator("[name=name]")).toHaveValue("בדיקה");
  await expect(page.locator("[name=phone]")).toHaveValue("123");

  await page.locator("[name=phone]").fill("");
  await page.locator("[name=email]").fill("not-an-email");
  await submit.click();
  await expect(page.getByText("כתובת מייל לא תקינה", { exact: true })).toBeVisible();
  await expect(page.locator("[name=email]")).toHaveValue("not-an-email");

  await page.route("**/api/join", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ ok: false, error: "unavailable", message: "משהו השתבש, נסו שוב", fallback: true }),
    }),
  );
  await page.locator("[name=email]").fill("member@example.com");
  await submit.click();
  await expect(page.getByText("משהו השתבש, נסו שוב", { exact: true })).toBeVisible();
  await expect(page.locator("[name=name]")).toHaveValue("בדיקה");
  await page.unroute("**/api/join");

  const posts: string[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/join") posts.push(request.url());
  });
  await page.locator("[name=phone]").fill("0501234567");
  await submit.click();
  await expect(page.getByText("קיבלנו. נחזור אליך עם צוות ומשימה", { exact: true })).toBeVisible();
  await expect(submit).toBeDisabled();
  expect(posts).toHaveLength(1);

  await page.goto("/join");
  await page.locator("[name=name]").fill("בדיקה שנייה");
  await page.locator("[name=phone]").fill("0501234567");
  await page.locator("[name=profession]").fill("מורה");
  await page.locator("[name=area]").fill("ירושלים");
  await page.getByText("שעה בשבוע", { exact: true }).click();
  await page.locator("form button[type=submit]").click();
  await expect(page.getByText("קיבלנו. נחזור אליך עם צוות ומשימה", { exact: true })).toBeVisible();
});
