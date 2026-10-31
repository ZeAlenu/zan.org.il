import { expect, test } from "@playwright/test";

test.fixme("B1", async ({ page }) => {
  await page.goto("/hashiva-shoftenu");
  await expect(page.getByText("האקתון אמנות — מחאה וחזון בנושא בג״ץ", { exact: true })).toBeVisible();
  await expect(page.getByText("11–20 באוקטובר 2026 · בית אורי צבי, ירושלים", { exact: true })).toBeVisible();
  await expect(page.getByText("ההאקתון הסתיים", { exact: true })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.getByText("חסות", { exact: false })).toHaveCount(0);
});
