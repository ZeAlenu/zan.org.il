import { expect, test } from "@playwright/test";
import { coalitionOrgs } from "../src/data/coalition";

test("A5", async ({ page }) => {
  await page.goto("/coalition");
  for (const section of ["מטעם זה עלינו", "ארגוני ברית", "שותפים"]) {
    await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
  }

  const ring2 = coalitionOrgs.filter((org) => org.ring === 2);
  const ring3 = coalitionOrgs.filter((org) => org.ring === 3);
  expect(ring2.length).toBeGreaterThan(0);

  const allies = page.getByRole("region", { name: "ארגוני ברית" });
  const partners = page.getByRole("region", { name: "שותפים" });
  for (const org of ring2) {
    await expect(allies.getByRole("heading", { name: org.name, exact: true })).toBeVisible();
  }
  for (const org of ring3) {
    await expect(partners.getByRole("heading", { name: org.name, exact: true })).toBeVisible();
  }

  await expect(allies.getByRole("link", { name: "השיבה שופטינו כבראשונה", exact: true })).toHaveAttribute(
    "href",
    "/hashiva-shoftenu",
  );
});
