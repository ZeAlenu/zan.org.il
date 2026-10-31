export type WorkRecord = {
  title: string;
  artist: string;
  medium: string;
  description: string;
  mediaUrl: string;
  place: 1 | 2 | 3 | null;
};

export type Work = WorkRecord & {
  slug: string;
};
