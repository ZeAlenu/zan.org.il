import { expect, test } from "@playwright/test";
import { readWorks } from "./fixtures";

test.fixme("B2", async ({ page }) => {
  const approved = readWorks("works.json");
  const unapproved = readWorks("works.unapproved.json");
  await page.goto("/hashiva-shoftenu");
  await expect(page.getByText(unapproved[0].title, { exact: true })).toHaveCount(0);

  if (approved.length === 0) {
    await expect(page.getByText("העבודות יעלו בקרוב", { exact: true })).toBeVisible();
    return;
  }

  const ranked = approved
    .filter((work) => work.place !== null)
    .sort((a, b) => (a.place ?? 0) - (b.place ?? 0));
  expect(ranked.map((work) => work.place)).toEqual([1, 2, 3]);

  const winners = page.getByRole("region", { name: "הזוכים" });
  for (const [index, work] of ranked.entries()) {
    await expect(winners.getByRole("listitem").nth(index)).toContainText(work.title);
  }

  const gallery = page.getByRole("region", { name: "כל העבודות" });
  await expect(gallery.getByRole("listitem")).toHaveCount(approved.length);
});
