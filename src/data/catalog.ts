import { GROUP_BLURBS, GROUP_LABELS, site, type GroupType } from "./site.ts";

export type Wing = {
  id: string;
  name: string;
  type: GroupType;
  order: number;
  blurb: string;
};

export type Project = {
  id: string;
  title: string;
  summary: string;
  owners: string[];
  parent?: string;
  kind: "campaign" | "work" | "publication" | "tool" | "page";
  placeholder: boolean;
};

export type MenuLink = { href: string; label: string };

export type MenuProject = { title: string; href: string; also?: string };

export type MenuWing = Wing & { href: string; projects: MenuProject[] };

export type MenuGroup = {
  type: GroupType;
  label: string;
  sentence: string;
  count: string;
  wings: MenuWing[];
};

const groupOrder: GroupType[] = ["movement", "arm", "forum"];

export function normalizePath(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
  return path || "/";
}

export function wingPath(wing: Pick<Wing, "id" | "type">): string {
  if (wing.type === "movement") return `/movements/${wing.id}`;
  if (wing.type === "forum") return "/forum";
  return `/arms/${wing.id}`;
}

export function projectUrl(project: Project, byId: Map<string, Project>): string {
  const segments: string[] = [];
  const seen = new Set<string>();
  let current: Project | undefined = project;
  while (current) {
    if (seen.has(current.id)) {
      throw new Error(`project parent cycle at ${current.id}`);
    }
    seen.add(current.id);
    segments.unshift(current.id);
    if (!current.parent) break;
    const parent = byId.get(current.parent);
    if (!parent) {
      throw new Error(`project ${current.id} parent ${current.parent} does not exist`);
    }
    current = parent;
  }
  return `/projects/${segments.join("/")}`;
}

export function projectsById(projects: Project[]): Map<string, Project> {
  return new Map(projects.map((project) => [project.id, project]));
}

export function visibleProjects(projects: Project[], production: boolean): Project[] {
  if (!production) return projects;
  return projects.filter((project) => !project.placeholder);
}

export function wingCount(count: number): string {
  const words: Record<number, string> = {
    1: "אגף אחד",
    2: "שני אגפים",
    3: "שלושה אגפים",
    4: "ארבעה אגפים",
    5: "חמישה אגפים",
    6: "שישה אגפים",
    7: "שבעה אגפים",
    8: "שמונה אגפים",
    9: "תשעה אגפים",
    10: "עשרה אגפים",
  };
  return words[count] ?? `${count} אגפים`;
}

export function siblingHeading(type: GroupType): string {
  if (type === "forum") return GROUP_LABELS.forum;
  return `${GROUP_LABELS[type]} נוספות`;
}

function alsoText(project: Project, wingId: string, wings: Map<string, Wing>): string | undefined {
  const others = project.owners.filter((id) => id !== wingId);
  if (others.length === 0) return undefined;
  const names = others.map((id) => {
    const wing = wings.get(id);
    if (!wing) throw new Error(`project ${project.id} owner ${id} does not exist`);
    return `ב${wing.name}`;
  });
  return `גם ${names.join(" ו")}`;
}

export function buildMenu(wings: Wing[], projects: Project[], production: boolean): MenuGroup[] {
  const byId = projectsById(projects);
  const wingById = new Map(wings.map((wing) => [wing.id, wing]));
  const published = visibleProjects(projects, production);
  return groupOrder
    .map((type) => {
      const members = wings
        .filter((wing) => wing.type === type)
        .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "he"));
      return {
        type,
        label: GROUP_LABELS[type],
        sentence: GROUP_BLURBS[type],
        count: wingCount(members.length),
        wings: members.map((wing) => ({
          ...wing,
          href: wingPath(wing),
          projects: published
            .filter((project) => project.owners.includes(wing.id))
            .map((project) => ({
              title: project.title,
              href: projectUrl(project, byId),
              also: alsoText(project, wing.id, wingById),
            })),
        })),
      };
    })
    .filter((group) => group.wings.length > 0);
}

export function projectsLink(): MenuLink {
  return { href: "/projects", label: "פרויקטים" };
}

export function utilityLinks(): MenuLink[] {
  return [
    { href: "/about", label: "מי אנחנו" },
    { href: "/vision", label: "החזון" },
    { href: "/contact", label: "קשר" },
    { href: site.mapHref, label: site.mapTitle },
  ];
}

export function joinLink(): MenuLink {
  return { href: "/join", label: "הצטרפות" };
}
