import { getCollection } from "astro:content";
import {
  buildMenu,
  projectsById,
  type MenuGroup,
  type Project,
  type Wing,
} from "./catalog.ts";

export type SiteData = {
  wings: Wing[];
  projects: Project[];
  byId: Map<string, Project>;
  menu: MenuGroup[];
};

function ownerId(owner: string | { id: string }): string {
  return typeof owner === "string" ? owner : owner.id;
}

export async function loadSite(): Promise<SiteData> {
  const wingEntries = await getCollection("wings");
  const projectEntries = await getCollection("projects");
  const wings: Wing[] = wingEntries
    .map((entry) => ({
      id: entry.id,
      name: entry.data.name,
      type: entry.data.type,
      order: entry.data.order,
      blurb: entry.data.blurb,
    }))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "he"));
  const projects: Project[] = projectEntries.map((entry) => ({
    id: entry.id,
    title: entry.data.title,
    summary: entry.data.summary,
    owners: entry.data.owners.map(ownerId),
    parent: entry.data.parent ? ownerId(entry.data.parent) : undefined,
    kind: entry.data.kind,
    placeholder: entry.data.placeholder,
  }));
  const byId = projectsById(projects);
  return {
    wings,
    projects,
    byId,
    menu: buildMenu(wings, projects, import.meta.env.PROD),
  };
}
