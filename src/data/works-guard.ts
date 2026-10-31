import type { WorkRecord } from "./work-record";

export const workFields = ["title", "artist", "medium", "description", "mediaUrl", "place"] as const;

const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const phonePattern =
  /(?:\+972|972|0)[-\s]?5\d[-\s]?\d{3}[-\s]?\d{4}|0[23489][-\s]?\d{3}[-\s]?\d{4}|\+\d{8,15}|\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b|\b\d{10,}\b/;

export class WorksFixtureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorksFixtureError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function assertWorksFixture(input: unknown): WorkRecord[] {
  if (!Array.isArray(input)) {
    throw new WorksFixtureError("works fixture rejected: expected an array");
  }

  const problems: string[] = [];
  const places = new Set<number>();
  const works: WorkRecord[] = [];

  input.forEach((item, index) => {
    if (!isRecord(item)) {
      problems.push(`works[${index}] is not an object`);
      return;
    }

    const keys = Object.keys(item);
    const extra = keys.filter((key) => !workFields.includes(key as (typeof workFields)[number]));
    const missing = workFields.filter((key) => !keys.includes(key));
    if (extra.length > 0 || missing.length > 0) {
      problems.push(
        `works[${index}] fields are not on the whitelist (${workFields.join(", ")}); extra: ${extra.join(", ") || "none"}; missing: ${missing.join(", ") || "none"}`,
      );
    }

    for (const key of workFields) {
      if (key === "place") continue;
      const value = item[key];
      if (typeof value !== "string" || !value.trim()) {
        problems.push(`works[${index}].${key} must be a non-empty string`);
        continue;
      }
      if (emailPattern.test(value) || phonePattern.test(value)) {
        problems.push(`works[${index}].${key} contains a phone or email`);
      }
    }

    const description = typeof item.description === "string" ? item.description : "";
    if (description && wordCount(description) > 150) {
      problems.push(`works[${index}].description is over 150 words`);
    }

    const mediaUrl = typeof item.mediaUrl === "string" ? item.mediaUrl : "";
    if (mediaUrl && (mediaUrl.startsWith("//") || !(mediaUrl.startsWith("/") || mediaUrl.startsWith("https://")))) {
      problems.push(`works[${index}].mediaUrl must be a site path or https URL`);
    }

    const place = item.place;
    if (place !== null && place !== 1 && place !== 2 && place !== 3) {
      problems.push(`works[${index}].place must be 1, 2, 3, or null`);
    } else if (typeof place === "number") {
      if (places.has(place)) problems.push(`works[${index}].place ${place} is duplicated`);
      places.add(place);
    }

    if (problems.length === 0) {
      works.push({
        title: (item.title as string).trim(),
        artist: (item.artist as string).trim(),
        medium: (item.medium as string).trim(),
        description: description.trim(),
        mediaUrl,
        place: place as 1 | 2 | 3 | null,
      });
    }
  });

  if (problems.length > 0) {
    throw new WorksFixtureError(`works fixture rejected: ${problems.join("; ")}`);
  }

  return works;
}
