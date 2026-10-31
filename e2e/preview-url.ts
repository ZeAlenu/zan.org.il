import { appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const botLogin = "cloudflare-workers-and-pages[bot]";

/** First look is immediate. The remaining attempts cover ten minutes. */
export const previewPollIntervalMs = 10_000;
export const previewPollAttempts = 61;

export type PullComment = {
  user?: { login?: string | null } | null;
  body?: string | null;
};

/** Preview host for this commit, from a Cloudflare Workers Builds pull request comment. */
export function previewUrlFromComment(body: string, headSha: string): string | null {
  const short = headSha.slice(0, 7).toLowerCase();
  if (!/^[0-9a-f]{7}$/.test(short)) return null;

  const rowUrl = deploymentUrl(body, short);
  if (rowUrl) return rowUrl;

  const alias = new RegExp(
    `https://[A-Za-z0-9.-]+\\.workers\\.dev(?= \\(commit ${short}\\))`,
    "i",
  ).exec(body);
  return alias?.[0] ?? null;
}

export function previewUrlFromComments(comments: PullComment[], headSha: string): string | null {
  let found: string | null = null;
  for (const comment of comments) {
    if (comment.user?.login !== botLogin) continue;
    const url = previewUrlFromComment(comment.body ?? "", headSha);
    if (url) found = url;
  }
  return found;
}

export async function resolvePreviewUrl(
  headSha: string,
  loadComments: () => Promise<PullComment[]>,
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms)),
  attempts = previewPollAttempts,
): Promise<string> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const url = previewUrlFromComments(await loadComments(), headSha);
    if (url) return url;
    if (attempt < attempts - 1) await wait(previewPollIntervalMs);
  }
  throw new Error(
    `No preview URL for ${headSha.slice(0, 7)} in the Cloudflare pull request comment`,
  );
}

function deploymentUrl(body: string, short: string): string | null {
  const cell = new RegExp(`<td>\\s*${short}\\s*</td>`, "i");
  for (const row of body.split(/<tr>/i)) {
    if (!cell.test(row)) continue;
    const urls = [...row.matchAll(/https:\/\/[A-Za-z0-9.-]+\.workers\.dev/g)];
    const url = urls.at(-1)?.[0];
    if (url) return url;
  }
  return null;
}

function nextPage(link: string | null): string | null {
  if (!link) return null;
  for (const part of link.split(",")) {
    const match = /<([^>]+)>;\s*rel="next"/.exec(part);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function githubComments(repo: string, pr: string, token: string): Promise<PullComment[]> {
  const comments: PullComment[] = [];
  let url: string | null =
    `https://api.github.com/repos/${repo}/issues/${pr}/comments?per_page=100`;
  while (url) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "zan-e2e-preview",
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`GitHub comments request failed (${response.status}): ${detail.slice(0, 300)}`);
    }
    comments.push(...((await response.json()) as PullComment[]));
    url = nextPage(response.headers.get("link"));
  }
  return comments;
}

async function main(): Promise<void> {
  const pr = process.env.PR_NUMBER ?? "";
  const sha = process.env.HEAD_SHA ?? "";
  const repo = process.env.GITHUB_REPOSITORY ?? "";
  const token = process.env.GITHUB_TOKEN ?? "";
  const output = process.env.GITHUB_OUTPUT;
  if (!pr || !sha || !repo || !token || !output) {
    throw new Error(
      "PR_NUMBER, HEAD_SHA, GITHUB_REPOSITORY, GITHUB_TOKEN, and GITHUB_OUTPUT are required",
    );
  }
  const url = await resolvePreviewUrl(sha, () => githubComments(repo, pr, token));
  appendFileSync(output, `url=${url}\n`);
  console.log(url);
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
