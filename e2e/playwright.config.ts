import { defineConfig } from "@playwright/test";
import { assertE2EBaseUrl } from "./base-url";

const baseURL = assertE2EBaseUrl(process.env.E2E_BASE_URL);
const startServer = process.env.E2E_START_SERVER === "1";

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
  },
  projects: [
    { name: "360", use: { viewport: { width: 360, height: 800 } } },
    { name: "1280", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: startServer
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
