export type Mission = {
  title: string;
  minutes: number;
};

export const missions: readonly Mission[] = [];

export const missionsRequiredToPublish = 3;

export function missionsArePublished(list: readonly Mission[] = missions): boolean {
  return list.length >= missionsRequiredToPublish;
}
