import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { slugForIndex } from "../src/data/work-slug";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export type FixtureWork = {
  title: string;
  artist: string;
  medium: string;
  description: string;
  mediaUrl: string;
  place: 1 | 2 | 3 | null;
};

export function readWorks(name: "works.json" | "works.unapproved.json"): FixtureWork[] {
  return JSON.parse(readFileSync(join(root, "src/data/fixtures", name), "utf8")) as FixtureWork[];
}

export { slugForIndex };
