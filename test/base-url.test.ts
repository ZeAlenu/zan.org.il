import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";
import { assertE2EBaseUrl } from "../e2e/base-url";

describe("E2E base URL", () => {
  test("allows a local server and a preview host", () => {
    expect(assertE2EBaseUrl("http://127.0.0.1:4321")).toBe("http://127.0.0.1:4321");
    expect(assertE2EBaseUrl("https://zan-org-il-pr-12.example.workers.dev/")).toBe(
      "https://zan-org-il-pr-12.example.workers.dev",
    );
  });

  test("rejects the production hosts", () => {
    for (const value of [
      "https://zan.org.il",
      "https://zan.org.il/join",
      "http://www.zan.org.il",
      "https://WWW.zan.org.il/",
      "https://zan.org.il.",
    ]) {
      expect(() => assertE2EBaseUrl(value)).toThrow(/must not target production/);
    }
  });

  test("rejects a missing or unusable URL", () => {
    expect(() => assertE2EBaseUrl(undefined)).toThrow(/required/);
    expect(() => assertE2EBaseUrl("   ")).toThrow(/required/);
    expect(() => assertE2EBaseUrl("not a url")).toThrow(/not a valid URL/);
    expect(() => assertE2EBaseUrl("file:///tmp/site")).toThrow(/http or https/);
  });

  test("the playwright config fails before it can open production", () => {
    const result = spawnSync(
      "npx",
      ["playwright", "test", "--config", "e2e/playwright.config.ts", "--list"],
      {
        cwd: rootDir(),
        env: { ...process.env, E2E_BASE_URL: "https://www.zan.org.il/join", E2E_START_SERVER: "0" },
        encoding: "utf8",
      },
    );
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).toMatch(/must not target production/);
  });
});

function rootDir(): string {
  return new URL("..", import.meta.url).pathname;
}
