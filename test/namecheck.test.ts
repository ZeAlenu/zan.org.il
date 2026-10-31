import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const script = join(process.cwd(), "namecheck.py");
const planted = "זזזבדיקהייחודית";

function run(args: string[], env: NodeJS.ProcessEnv = {}) {
  return spawnSync("python3", [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env, ZAN_REALNAMES: env.ZAN_REALNAMES ?? "" },
  });
}

describe("namecheck", () => {
  test("a synthetic list makes it fail without printing the name", () => {
    const root = mkdtempSync(join(tmpdir(), "zan-namecheck-"));
    writeFileSync(join(root, "note.txt"), `שורה\n${planted} כאן\n`, "utf8");
    const list = join(root, "names.txt");
    writeFileSync(list, `# הערה\n\n${planted}\n`, "utf8");

    const result = run([list, "--root", root]);
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("note.txt:2");
    expect(output).not.toContain(planted);
  });

  test("a comment-only list is empty and fails", () => {
    const root = mkdtempSync(join(tmpdir(), "zan-namecheck-"));
    const list = join(root, "names.txt");
    writeFileSync(list, "# רק הערה\n\n", "utf8");
    const result = run([list, "--root", root]);
    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).not.toContain("רק הערה");
  });

  test("a missing list fails", () => {
    const result = run(["/tmp/zan-namecheck-missing-list.txt"]);
    expect(result.status).not.toBe(0);
  });
});
