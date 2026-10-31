import { expect, test } from "@playwright/test";
import { readWorks, slugForIndex } from "./fixtures";

test("B4", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const work = readWorks("works.json")[0];
  const credit = `${work.title} / ${work.artist}, השיבה שופטינו כבראשונה, CC BY-SA 4.0`;

  await page.goto(`/works/${slugForIndex(0)}`);
  await expect(page.getByText(credit, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "רישיון: CC BY-SA 4.0", exact: true })).toHaveAttribute(
    "href",
    "https://creativecommons.org/licenses/by-sa/4.0/deed.he",
  );
  await page.getByRole("button", { name: "העתקת קרדיט", exact: true }).click();
  await expect(page.getByText("הקרדיט הועתק", { exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(credit);
});
