import { expect, test } from "@playwright/test";
import { site } from "../src/data/site";

const pages = ["/", "/about", "/vision", "/join", "/contact", "/missions", "/coalition", "/hashiva-shoftenu", "/redgreen"];

test.fixme("A4", async ({ page }) => {
  for (const path of ["/about", "/vision", "/contact"]) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
  }

  await page.goto("/contact");
  await expect(page.locator(`a[href="mailto:${site.email}"]`)).toBeVisible();
  await expect(page.locator(`a[href="${site.whatsapp}"]`)).toBeVisible();
  await expect(page.locator(`a[href="${site.x}"]`)).toBeVisible();

  for (const path of pages) {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "אני רוצה לקחת חלק", exact: true })).toBeVisible();
  }
});
