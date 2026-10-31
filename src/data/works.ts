import approved from "./fixtures/works.json";
import type { Work } from "./work-record";
import { slugForIndex } from "./work-slug";
import { assertWorksFixture } from "./works-guard";

const records = assertWorksFixture(approved);

export function loadWorks(): Work[] {
  return records.map((work, index) => ({
    ...work,
    slug: slugForIndex(index),
  }));
}

export function workBySlug(slug: string): Work | undefined {
  return loadWorks().find((work) => work.slug === slug);
}
