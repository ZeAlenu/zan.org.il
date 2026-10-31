import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import unapproved from "../src/data/fixtures/works.unapproved.json";
import { loadWorks } from "../src/data/works";
import { WorksFixtureError, assertWorksFixture } from "../src/data/works-guard";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("B5 works fixture", () => {
  test("the approved works use only the whitelist and contain no phone or email", () => {
    const works = loadWorks();
    expect(works.map((work) => work.slug)).toEqual(["work-1", "work-2", "work-3", "work-4"]);
    expect(works.map((work) => work.place)).toEqual([1, 2, 3, null]);
    for (const work of works) {
      expect(work.description.trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(150);
    }
  });

  test("a bad fixture is rejected", () => {
    const bad = JSON.parse(readFileSync(join(root, "test/fixtures/works.bad.json"), "utf8"));
    let message = "";
    try {
      assertWorksFixture(bad);
    } catch (error) {
      expect(error).toBeInstanceOf(WorksFixtureError);
      message = error instanceof Error ? error.message : "";
    }
    expect(message).toMatch(/works fixture rejected/);
    expect(message).toMatch(/whitelist/);
    expect(message).toMatch(/phone or email/);
  });

  test("the planted unapproved work is a valid record and is not loaded", () => {
    const planted = assertWorksFixture(unapproved);
    expect(planted[0]?.title).toBe("עבודה שלא אושרה");
    expect(loadWorks().some((work) => work.title === planted[0]?.title)).toBe(false);
  });
});
