import { expect, test } from "@playwright/test";

test.fixme("A3", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "משימות", exact: true })).toHaveCount(0);

  await page.goto("/missions");
  await expect(
    page.getByText("אין כרגע משימות פתוחות באזור שלך. השאירו פרטים ונשבץ אתכם", { exact: true }),
  ).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);
});
