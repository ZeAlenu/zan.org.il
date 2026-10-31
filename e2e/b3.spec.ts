import { expect, test } from "@playwright/test";
import { readWorks, slugForIndex } from "./fixtures";

test("B3", async ({ page }) => {
  const work = readWorks("works.json")[0];
  const slug = slugForIndex(0);
  await page.goto(`/works/${slug}`);
  await expect(page.getByRole("heading", { level: 1, name: work.title })).toBeVisible();
  await expect(page.getByText(work.artist, { exact: true })).toBeVisible();
  await expect(page.getByText(work.medium, { exact: true })).toBeVisible();
  await expect(page.getByText(work.description, { exact: true })).toBeVisible();
  expect(work.description.trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(150);
  await expect(page.locator(`a[href="${work.mediaUrl}"]`).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "חזרה לכל העבודות", exact: true })).toHaveAttribute(
    "href",
    "/hashiva-shoftenu",
  );

  const missing = await page.goto("/works/missing-work");
  expect(missing?.status()).toBe(404);
  await expect(page.getByText("העבודה לא נמצאה", { exact: true })).toBeVisible();

  const client = await page.context().newCDPSession(page);
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await page.route(`**${work.mediaUrl}`, (route) => route.abort());
  await page.goto(`/works/${slug}`);
  await expect(page.getByText("לא ניתן להציג את היצירה כאן", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "למקור היצירה", exact: true })).toBeVisible();
});
