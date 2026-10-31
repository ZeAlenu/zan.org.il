# Deploying zan.org.il

Cloudflare Worker `zan-org-il` (account `77f0c1c932cf504cebd401ad4f204943`), static assets from `./dist/client`.

## Rules
- Production deploys happen **only** from GitHub Actions (`.github/workflows/deploy.yml`) on merge to `main`. No `wrangler deploy` / `npm run deploy` from laptops.
- Every same-repo PR builds, runs an offline link check on the built site, and uploads a Worker **version** (`wrangler versions upload --preview-alias pr-<N>`, never deploy). The preview URL is posted as a sticky PR comment. Fork PRs skip the upload (no secrets).
- After deploy, a smoke test checks https://zan.org.il/ and https://www.zan.org.il/ return 200 and contain the built `<title>`. Canary only: no auto-rollback.

## Secrets (repo → Settings → Secrets → Actions)
- `CLOUDFLARE_ACCOUNT_ID` = `77f0c1c932cf504cebd401ad4f204943`
- `CLOUDFLARE_API_TOKEN` = a dedicated account-owned API token. Never an admin token or Global API Key.

## Token permissions (minimum)
Per Cloudflare's Workers roles (developers.cloudflare.com/workers/authorization/workers/):
- **Account `77f0c1c9…` → Workers → `Editor`, scoped to the individual Worker `zan-org-il`** (covers `versions upload`, `deploy`, `rollback` of an existing Worker; cannot create/delete Workers).
- Only if a deploy changes routes/custom domains: **Zone `zan.org.il` → Workers Routes → Write**. The custom domains already exist, so try without it first; add it only if `wrangler deploy` fails on the custom-domain step.
- Fallback where per-Worker scope isn't offered: legacy `Workers Scripts: Edit` at account scope (applies to all Workers in the account), plus the zone permission above.
- Optional client IP filtering is not usable with GitHub-hosted runners.
