# Deploying zan.org.il

Cloudflare Worker `zan-org-il` (account `77f0c1c932cf504cebd401ad4f204943`), static assets from `./dist/client`.

## Rules
- Production deploys and branch previews come from Cloudflare Workers Builds. A push to `main` runs `wrangler deploy`. Every other branch runs `wrangler preview`.
- No `wrangler deploy` or `npm run deploy` from laptops.
- Pull requests also run `.github/workflows/ci.yml` on a GitHub-hosted runner: `npm ci`, `npm run build`, and an offline lychee check of the built site. The check installs lychee `v0.24.2` in the job. This repository only allows actions owned by ZeAlenu, created by GitHub, or verified in the Marketplace, so `lycheeverse/lychee-action` is not used.
