import { expect, test } from "@playwright/test";

test.fixme("A1", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "בונים תקומה ציונית" })).toBeVisible();
  await expect(page.getByText("מאזרח צופה לאזרח שותף", { exact: true })).toBeVisible();

  const cta = page.getByRole("link", { name: "אני רוצה לקחת חלק", exact: true });
  await expect(cta).toHaveCount(1);
  await expect(cta).toHaveAttribute("href", "/join");
  const box = await cta.boundingBox();
  const viewport = page.viewportSize();
  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);

  const card = page.locator("article, li").filter({ hasText: "10 דק׳" });
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("heading")).toHaveText(/[\u0590-\u05FF]/);
});
