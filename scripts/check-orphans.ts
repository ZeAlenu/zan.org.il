import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import {
  buildMenu,
  normalizePath,
  projectUrl,
  projectsById,
  wingPath,
  type Project,
  type Wing,
} from "../src/data/catalog.ts";

const root = process.cwd();
const failures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function refId(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return "";
}

async function walk(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(path)));
    else out.push(path);
  }
  return out;
}

function assertCycleDetector() {
  const first: Project = {
    id: "a",
    title: "a",
    summary: "a",
    owners: ["horim"],
    parent: "b",
    kind: "page",
    placeholder: false,
  };
  const second: Project = { ...first, id: "b", parent: "a" };
  try {
    projectUrl(first, new Map([["a", first], ["b", second]]));
  } catch (error) {
    if (String(error).includes("cycle")) return;
  }
  throw new Error("parent cycle check did not fail");
}

async function loadWings(): Promise<Wing[]> {
  const raw = JSON.parse(await readFile(join(root, "src/content/wings.json"), "utf8")) as Wing[];
  return raw.map((wing) => ({
    id: wing.id,
    name: wing.name,
    type: wing.type,
    order: wing.order,
    blurb: wing.blurb,
  }));
}

function parseFrontmatter(source: string, file: string): Record<string, string | string[] | boolean> {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) throw new Error(`${file} is missing frontmatter`);
  const data: Record<string, string | string[] | boolean> = {};
  let key = "";
  for (const line of match[1].split(/\r?\n/)) {
    if (/^\s+-\s+/.test(line) && key) {
      const items = Array.isArray(data[key]) ? data[key] : [];
      items.push(line.replace(/^\s+-\s+/, "").replace(/^["']|["']$/g, ""));
      data[key] = items;
      continue;
    }
    const field = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!field) continue;
    key = field[1] ?? "";
    const raw = (field[2] ?? "").trim();
    if (!raw) continue;
    if (raw.startsWith("[") && raw.endsWith("]")) {
      data[key] = raw
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (raw === "true" || raw === "false") {
      data[key] = raw === "true";
    } else {
      data[key] = raw.replace(/^["']|["']$/g, "");
    }
  }
  return data;
}

async function loadProjects(): Promise<Project[]> {
  const files = (await walk(join(root, "src/content/projects"))).filter((file) =>
    /\.mdx?$/.test(file),
  );
  const projects: Project[] = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const data = parseFrontmatter(source, relative(root, file));
    const id = relative(join(root, "src/content/projects"), file).replace(/\.mdx?$/, "").split("\\").join("/");
    const owners = Array.isArray(data.owners) ? data.owners : data.owners ? [String(data.owners)] : [];
    projects.push({
      id,
      title: String(data.title ?? ""),
      summary: String(data.summary ?? ""),
      owners,
      parent: data.parent ? String(data.parent) : undefined,
      kind: (data.kind as Project["kind"]) ?? "page",
      placeholder: data.placeholder === true,
    });
  }
  return projects;
}

async function loadTiles(): Promise<{ id: string; project: string }[]> {
  const file = join(root, "src/content/home-tiles.json");
  if (!existsSync(file)) return [];
  const raw = JSON.parse(await readFile(file, "utf8")) as unknown;
  if (Array.isArray(raw)) {
    return raw.map((item) => ({ id: String(item.id), project: refId(item.project) }));
  }
  if (!raw || typeof raw !== "object") return [];
  return Object.entries(raw).map(([key, item]) => ({
    id: refId(item) || key,
    project: refId((item as { project?: unknown }).project),
  }));
}

function sliceElement(html: string, start: number): string {
  const open = /^<([a-zA-Z0-9]+)/.exec(html.slice(start));
  const tag = open?.[1];
  if (!tag) return "";
  const re = new RegExp(`</?${tag}\\b[^>]*>`, "gi");
  re.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const token = match[0];
    if (token.endsWith("/>")) continue;
    if (token.startsWith("</")) {
      depth -= 1;
      if (depth === 0) return html.slice(start, match.index + token.length);
    } else {
      depth += 1;
    }
  }
  return "";
}

function elementWith(html: string, marker: string): string {
  const start = html.indexOf(marker);
  if (start < 0) return "";
  const tagStart = html.lastIndexOf("<", start);
  return sliceElement(html, tagStart);
}

function hrefs(html: string): Set<string> {
  const found = new Set<string>();
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const value = match[1] ?? "";
    if (!value.startsWith("/") || value.startsWith("//")) continue;
    found.add(normalizePath(value));
  }
  return found;
}

function toRoute(file: string): string | null {
  const norm = file.split("\\").join("/");
  const marker = norm.includes("/dist/client/") ? "/dist/client/" : "/dist/";
  const index = norm.lastIndexOf(marker);
  if (index < 0) return null;
  let rel = norm.slice(index + marker.length);
  if (rel.endsWith("/index.html")) rel = rel.slice(0, -"/index.html".length);
  else if (rel.endsWith(".html")) rel = rel.slice(0, -".html".length);
  if (rel === "index" || rel === "") return "/";
  return `/${rel}`;
}

function hardcodesArmLabel(source: string, arm: string): boolean {
  const escaped = arm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:["'\`])${escaped}(?:["'\`])|>\\s*${escaped}\\s*<`).test(source);
}

function assertLabelMatcher(arm: string) {
  if (!hardcodesArmLabel(`arm: "${arm}"`, arm)) throw new Error("label matcher missed a literal");
  if (hardcodesArmLabel(`${arm} הריין`, arm)) throw new Error("label matcher flagged prose");
}

async function checkLabel() {
  const siteSource = await readFile(join(root, "src/data/site.ts"), "utf8");
  const arm = siteSource.match(/arm:\s*"([^"]+)"/)?.[1];
  if (!arm) {
    fail("GROUP_LABELS.arm is missing");
    return;
  }
  assertLabelMatcher(arm);
  const skip = new Set(["node_modules", "dist", ".git", ".astro"]);
  const files = (await walk(root)).filter((file) => {
    const rel = relative(root, file);
    if (rel === "src/data/site.ts" || rel === "scripts/check-orphans.ts") return false;
    if (rel.split("/").some((part) => skip.has(part))) return false;
    return /\.(astro|ts|tsx|js|mjs|css|json|md|mdx)$/.test(file);
  });
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (hardcodesArmLabel(source, arm)) fail(`${relative(root, file)} hardcodes the arm label`);
  }
}

async function checkRoles() {
  const files = (await walk(join(root, "src"))).filter((file) => /\.(astro|ts|js)$/.test(file));
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (/role="menu"|menuitem|aria-haspopup/.test(source)) {
      fail(`${relative(root, file)} uses a menu role`);
    }
  }
}

async function checkHtml(wings: Wing[], projects: Project[]) {
  const htmlFiles = (await walk(join(root, "dist"))).filter((file) => file.endsWith(".html"));
  const routes = new Map<string, string>();
  for (const file of htmlFiles) {
    const route = toRoute(file);
    if (route && !routes.has(route)) routes.set(route, file);
  }
  if (routes.size === 0) {
    fail("no built HTML pages");
    return;
  }
  const home = routes.get("/");
  if (!home) {
    fail("home page was not built");
    return;
  }
  const homeHtml = await readFile(home, "utf8");
  const menuHtml = `${elementWith(homeHtml, "data-site-nav")}\n${elementWith(homeHtml, 'id="mnav"')}`;
  if (!menuHtml.includes("data-site-nav") || !menuHtml.includes('id="mnav"')) {
    fail("the built home page has no menu");
  }
  const menuHrefs = hrefs(menuHtml);
  const wingById = new Map(wings.map((wing) => [wing.id, wing]));
  for (const wing of wings) {
    const path = wingPath(wing);
    if (!routes.has(path)) fail(`wing ${wing.id} has no page`);
    if (!menuHrefs.has(path)) fail(`wing ${wing.id} is not in the menu`);
  }
  const byId = projectsById(projects);
  for (const project of projects) {
    if (project.placeholder) continue;
    let url = "";
    try {
      url = projectUrl(project, byId);
    } catch (error) {
      fail(String(error));
      continue;
    }
    if (menuHrefs.has(url)) continue;
    let linked = false;
    for (const owner of project.owners) {
      const wing = wingById.get(owner);
      if (!wing) continue;
      const page = routes.get(wingPath(wing));
      if (!page) continue;
      const html = await readFile(page, "utf8");
      if (hrefs(html).has(url)) linked = true;
    }
    if (!linked) fail(`${url} is not reachable from the menu or a wing page`);
  }
}

async function checkReachable() {
  const htmlFiles = (await walk(join(root, "dist"))).filter((file) => file.endsWith(".html"));
  const routes = new Map<string, string>();
  for (const file of htmlFiles) {
    const route = toRoute(file);
    if (route && !routes.has(route)) routes.set(route, file);
  }
  const home = routes.get("/");
  if (!home) return;
  const homeHtml = await readFile(home, "utf8");
  const menuHtml = `${elementWith(homeHtml, "data-site-nav")}\n${elementWith(homeHtml, 'id="mnav"')}`;
  const reachable = new Set<string>(["/"]);
  for (const href of hrefs(menuHtml)) {
    if (routes.has(href)) reachable.add(href);
  }
  for (const href of [...reachable]) {
    if (href === "/") continue;
    const file = routes.get(href);
    if (!file) continue;
    const html = await readFile(file, "utf8");
    for (const link of hrefs(html)) {
      if (routes.has(link)) reachable.add(link);
    }
  }
  for (const route of routes.keys()) {
    if (route === "/404") continue;
    if (!reachable.has(route)) fail(`${route} is not reachable from the menu within 2 levels`);
  }
}

async function main() {
  assertCycleDetector();
  const wings = await loadWings();
  const projects = await loadProjects();
  const tiles = await loadTiles();
  const wingIds = new Set(wings.map((wing) => wing.id));
  if (wingIds.size !== wings.length) fail("wing ids are not unique");
  const byId = projectsById(projects);
  const urls = new Map<string, string>();
  for (const project of projects) {
    if (project.owners.length === 0) fail(`project ${project.id} has no owner`);
    if (project.owners.length > 2) fail(`project ${project.id} has more than two owners`);
    for (const owner of project.owners) {
      if (!wingIds.has(owner)) fail(`project ${project.id} owner ${owner} does not exist`);
    }
    try {
      const url = projectUrl(project, byId);
      const previous = urls.get(url);
      if (previous) fail(`${previous} and ${project.id} resolve to ${url}`);
      urls.set(url, project.id);
    } catch (error) {
      fail(String(error));
    }
  }
  for (const tile of tiles) {
    const project = byId.get(tile.project);
    if (!project) fail(`tile ${tile.id} references a missing project`);
    else if (project.placeholder) fail(`tile ${tile.id} references a placeholder`);
  }
  for (const project of projects) {
    if (!project.placeholder) continue;
    let url = "";
    try {
      url = projectUrl(project, byId);
    } catch (error) {
      fail(String(error));
      continue;
    }
    const htmlFiles = (await walk(join(root, "dist"))).filter((file) => file.endsWith(".html"));
    for (const file of htmlFiles) {
      const html = await readFile(file, "utf8");
      if (html.includes(`href="${url}"`) || html.includes(`href="${url}/"`)) {
        fail(`placeholder ${url} is linked from ${relative(root, file)}`);
      }
    }
  }
  const menu = buildMenu(wings, projects, true);
  const inMenu = new Set(menu.flatMap((group) => group.wings.map((wing) => wing.href)));
  for (const wing of wings) {
    if (!inMenu.has(wingPath(wing))) fail(`wing ${wing.id} is not in the menu data`);
  }
  const css = await readFile(join(root, "src/styles/global.css"), "utf8");
  for (const wing of wings) {
    if (!css.includes(`--wing-${wing.id}:`)) fail(`missing accent --wing-${wing.id}`);
  }
  await checkLabel();
  await checkRoles();
  await checkHtml(wings, projects);
  await checkReachable();
  if (failures.length > 0) {
    console.error(failures.map((item) => `- ${item}`).join("\n"));
    process.exit(1);
  }
}

await main();
