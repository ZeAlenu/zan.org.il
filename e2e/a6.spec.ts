import { expect, test } from "@playwright/test";

const pages = [
  "/",
  "/join",
  "/missions",
  "/about",
  "/vision",
  "/contact",
  "/coalition",
  "/hashiva-shoftenu",
  "/works/work-1",
  "/redgreen",
];

test("A6", async ({ page }) => {
  for (const path of pages) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(/\S/);
    const image = await page.locator('meta[property="og:image"]').getAttribute("content");
    expect(image, path).toBeTruthy();
  }

  const missing = await page.goto("/missing-page-9572");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "העמוד לא נמצא", exact: true })).toBeVisible();
  await expect(page.locator('a[href="/"]').first()).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page).toHaveTitle(/\S/);
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBeTruthy();
});
