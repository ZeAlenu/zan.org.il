import { expect, test } from "@playwright/test";
import { site } from "../src/data/site";

const pages = ["/", "/about", "/vision", "/contact", "/coalition"];

test("A4", async ({ page }) => {
  for (const path of ["/about", "/vision", "/contact"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
  }

  await page.goto("/contact");
  const main = page.locator("#main");
  await expect(main.locator(`a[href="mailto:${site.email}"]`)).toBeVisible();
  await expect(main.locator(`a[href="${site.whatsapp}"]`)).toBeVisible();
  await expect(main.locator(`a[href="${site.x}"]`)).toBeVisible();

  for (const path of pages) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "אני רוצה לקחת חלק", exact: true })).toBeVisible();
  }
});
