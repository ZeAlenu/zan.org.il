import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";

const workflow = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "../.github/workflows/e2e-preview.yml"),
  "utf8",
);

describe("e2e preview workflow", () => {
  test("runs on same-repo pull requests from this branch's copy", () => {
    expect(workflow).toMatch(/pull_request:\n {4}types: \[opened, synchronize, reopened\]/);
    expect(workflow).not.toMatch(/check_run:|workflow_run:/);
    expect(workflow).toMatch(/contents: read\n {2}pull-requests: read\n/);
    expect(workflow).not.toMatch(/\n {2}issues:/);
    expect(workflow).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );
    expect(workflow).toContain("github.event.pull_request.head.sha");
    expect(workflow).toContain("GITHUB_TOKEN: ${{ github.token }}");
    expect(workflow).toContain('E2E_START_SERVER: "0"');
    expect(workflow).toContain("E2E_BASE_URL: ${{ steps.url.outputs.url }}");
  });
});
