import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { turnstileTest } from "../src/join/turnstile";
import { parseJsonc } from "./jsonc";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

type D1Binding = {
  binding: string;
  database_name: string;
  database_id: string;
};

function readConfig(name: string): {
  d1_databases?: D1Binding[];
  vars?: Record<string, string>;
  previews?: { d1_databases?: D1Binding[]; vars?: Record<string, string> };
} {
  return parseJsonc(readFileSync(join(root, name), "utf8")) as ReturnType<typeof readConfig>;
}

describe("join database bindings", () => {
  test("previews and production use different D1 databases, and previews use the Turnstile test keys", () => {
    const worker = readConfig("wrangler.jsonc");
    const previewMigrations = readConfig("wrangler.preview-migrations.jsonc");
    const productionMigrations = readConfig("wrangler.join-production.jsonc");
    const tests = readConfig("wrangler.test.jsonc");

    expect(worker.d1_databases).toBeUndefined();
    expect(worker.vars?.TURNSTILE_SECRET).toBeUndefined();

    const preview = worker.previews?.d1_databases?.[0];
    expect(preview?.binding).toBe("JOIN_DB");
    expect(preview?.database_name).toBe("zan-org-il-join-preview");
    expect(preview?.database_id).toBe(previewMigrations.d1_databases?.[0]?.database_id);
    expect(previewMigrations.d1_databases?.[0]?.database_name).toBe("zan-org-il-join-preview");

    expect(worker.previews?.vars?.TURNSTILE_SECRET).toBe(turnstileTest.secret);
    expect(worker.previews?.vars?.TURNSTILE_SITEKEY).toBe(turnstileTest.sitekey);

    const production = productionMigrations.d1_databases?.[0];
    expect(production?.binding).toBe("JOIN_DB");
    expect(production?.database_name).toBe("zan-org-il-join");
    expect(production?.database_id).not.toBe(preview?.database_id);
    expect(tests.d1_databases?.[0]?.database_name).toBe("zan-org-il-join-test");
    expect(tests.d1_databases?.[0]?.database_name).not.toBe(production?.database_name);
    expect(tests.d1_databases?.[0]?.database_name).not.toBe(preview?.database_name);
  });
});
