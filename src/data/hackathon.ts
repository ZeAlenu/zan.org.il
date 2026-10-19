import raw from "./hackathon.json";

export type HackathonWork = {
  order: number;
  title: string;
  artist: string;
  medium: string;
  statement?: string;
  image: string | null;
  imageWidth?: number;
  imageHeight?: number;
  video?: string;
  outOfCompetition?: boolean;
  hidden?: boolean;
  license: string;
};

function asWork(value: (typeof raw.works)[number]): HackathonWork {
  const work = value as HackathonWork;
  if (work.image && (work.imageWidth == null || work.imageHeight == null)) {
    throw new Error(`hackathon work ${work.order} is missing image dimensions`);
  }
  return work;
}

// images/28-eli-shofet-elyon.webp (1200×675) is held out of the repo pending a license check.
// The שופט עליון entry keeps image null until that file comes back. Removing hidden publishes the work.
const works = raw.works
  .map(asWork)
  .filter((work) => work.hidden !== true)
  .sort((a, b) => a.order - b.order);

export const hackathon = {
  event: raw.event,
  license: raw.license,
  works,
};

export function hackathonImage(image: string): string {
  return `/hackathon/${image}`;
}
