import { expect, test } from "@playwright/test";

test("A3", async ({ page }) => {
  await page.goto("/missions");
  await expect(
    page.getByText("אין כרגע משימות פתוחות באזור שלך. השאירו פרטים ונשבץ אתכם", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);
});
