# Avnish — Personal Portfolio

[Live portfolio](https://synergicvans.github.io/Portfolio_Project/)

Static HTML, CSS and vanilla JavaScript on GitHub Pages, with a separate Cloudflare-compatible Worker for a Groq Cloud portfolio assistant. The portfolio, résumé, links and contact form work independently of AI. No frontend framework or runtime package installation is required.

## Quick start

Use Node.js 24 or newer:

```sh
node --test tests/assistant.test.mjs
node build.mjs
node serve.mjs
```

Open http://127.0.0.1:4173. Rebuild after edits. The local server serves only `dist/`, never API secrets or repository files. Production API CORS permits the public portfolio origin; localhost shows a portfolio overview fallback unless you run/configure a development API.

## Architecture and file map

| File | Responsibility |
| --- | --- |
| `index.html` | Biography, experience, certifications, contact, generated project section |
| `style.css`, `enhancements.css` | Main design and responsive project cards |
| `projects.json` | Curated card titles, descriptions, tags, images and optional demo URLs |
| `render-projects.mjs` | Escapes and renders all cards between PROJECTS markers |
| `sync.config.json` | GitHub owner, exclusions, fork/archive policy, cover filenames |
| `scripts/sync-projects.mjs` | Reads public repositories and READMEs; adds new cards and metadata |
| `data/profile.json` | Reviewed owner facts used by the assistant; update alongside biography |
| `data/project-metadata.json` | Generated README context, content fingerprints and non-AI fallback summaries |
| `scripts/build-knowledge.mjs` | Combines profile/project metadata and generates a knowledge version hash |
| `data/knowledge.json` | Generated public assistant reference data |
| `data/assistant-config.json` | Public API base URL only; never put a secret here |
| `assistant.js`, `assistant.css` | Translucent cat launcher, accessible dialog and card summary interactions |
| `script.js` | Navigation, tabs and FormSubmit contact handling |
| `build.mjs`, `serve.mjs` | Public-file build with link/anchor validation, local static server |
| `.github/workflows/portfolio.yml` | Daily/manual sync, tests, build and GitHub Pages deployment |
| `api/worker.mjs` | Groq proxy, portfolio grounding, durable answer cache and request quotas |
| `api/db/schema.ts`, `api/drizzle/` | D1 schema and generated immutable migrations |
| `api/.openai/hosting.json` | Existing Sites API registration and logical DB binding |
| `tests/assistant.test.mjs` | Real SQLite checks of cache invalidation, limits, input validation and errors |

## Daily project updates

The GitHub Actions workflow runs at **03:47 UTC / 09:17 India time daily**, on manual dispatch, and on pushes to `main`. Daily/manual runs fetch the repository catalogue; ordinary pushes only build/deploy reviewed local changes. A bot commits generated catalogue changes and deploys the same artifact in that run, without relying on another workflow being triggered by a bot push.

The workflow uses GitHub's built-in `GITHUB_TOKEN`; no personal access token is required. Repository Settings → Pages must use **GitHub Actions** as its source. Run it immediately from Actions → Sync projects and deploy portfolio → Run workflow.

GitHub schedules are best effort, can be delayed, and may be disabled after 60 days of repository inactivity. Check Actions if updates stop and re-enable the workflow if needed. Free hosting is subject to provider terms, account status and limits; there is no permanent uptime guarantee.

Only public repositories with nonzero GitHub size are considered. New cards also require at least one file beyond README/license/.gitignore. Forks are included because two existing projects are forks. Archived repositories are excluded by default. Set `exclude` in `sync.config.json` to hide a repository. Projects no longer eligible are removed on the next successful sync. API failures stop the run before replacing the catalogue.

Existing manually curated text and images are preserved. To add an attractive cover automatically, put `portfolio-cover.png`, `portfolio-cover.jpg`, or `portfolio-cover.webp` (maximum 3 MB) in the new repository root. Otherwise a repository-local README image is considered; if none is usable, a matching category/title/technology SVG cover is generated. External image URLs are not downloaded. Covers are chosen when a card is first added; replace its `image` field manually to change an existing cover. Images do not require AI tokens.

For better automatic descriptions, fill in the GitHub repository description and README. Demo URLs are deliberately curated in `projects.json`. Verify the HTTPS destination before adding one. Preview and validate with:

```sh
node scripts/sync-projects.mjs
node build.mjs
```

Unauthenticated local syncs share GitHub's public API rate limit. In CI the temporary GITHUB_TOKEN increases the available quota. Never put a GitHub credential in source.

## Groq Cloud assistant

This uses **Groq Cloud**, not xAI Grok. The model defaults to `openai/gpt-oss-20b` and can be changed with `GROQ_MODEL` to a model supported by the connected Groq account.

The API fetches the public `data/knowledge.json` from GitHub Pages and keeps it in memory for up to five minutes. The model receives only reviewed public profile data and project references. Chat is scoped to Avnish's portfolio; unknown facts should be acknowledged and unrelated requests redirected. Project README text is untrusted data, not instructions. Model answers remain fallible and should be checked against source.

Each card's “Ask summary with AI” opens the same dialog. If AI is unavailable, the card displays its saved portfolio overview and clearly labels it as a non-AI fallback. General chat reports connection/availability issues rather than pretending a fallback came from AI.

### Private setup

Configure these **server runtime settings** in the assistant's Sites environment and redeploy the saved API version:

| Setting | Default / purpose |
| --- | --- |
| `GROQ_API_KEY` | Required secret; obtain from your Groq Cloud account |
| `GROQ_MODEL` | `openai/gpt-oss-20b` |
| `ALLOWED_ORIGIN` | `https://synergicvans.github.io` (an origin has no path) |
| `DAILY_AI_LIMIT` | 100 uncached upstream attempts per UTC day |
| `IP_HOURLY_LIMIT` | 10 uncached requests per visitor/hour |

The D1 binding is `DB`. Its tables are provisioned by migrations, not runtime CREATE TABLE calls. No Groq key is committed or included in the static output. For private local handoff, copy `api/.env.example` to `api/.env`, enter the key there, and have the deployment owner transfer it as a Sites secret. The ignored local file alone does not configure production. Do not paste keys into GitHub, browser code or chat.

`GET /health` reports readiness without revealing the key. `POST /api/chat` accepts `{ "question": "What are Avnish’s skills?" }`. `POST /api/summary` accepts `{ "repo": "Loan-Data-Verification-Copilot" }`. Requests must be JSON with the allowed Origin. Input is limited to 4 KB and chat questions to 500 characters. CORS is not authentication; the server also enforces atomic quotas and a global cap. Set a spending limit in Groq as an additional billing control.

### Cache and cost behavior

D1 stores generated answers, hashed cache keys and expiry times. It does not store raw questions or IP addresses. Groq receives submitted questions and public reference context; responses can be reused for equivalent questions. Visitors are told this in the dialog.

Project summaries are cached for up to one year under a hash of model, prompt version, repository and its content fingerprint. Changing the reviewed description, tags, title or README changes the fingerprint and generates a fresh summary on demand. Chat answers are cached for 24 hours under the normalized question and the whole knowledge version. Repeated cache hits do not call Groq. Model/prompt changes invalidate the relevant keys. Expired records are cleaned after successful generation.

A 60-second database lock prevents simultaneous identical requests from repeatedly calling the provider. An in-progress response asks the visitor to retry. Errors are not cached; unsuccessful upstream attempts still count toward the daily cap. A lost response after the provider processed it can still incur a charge. No claim of zero-cost or guaranteed deduplication across provider/network failures is made.

### API development and deployment

The Worker uses standard Web APIs and parameterized D1 SQL. Runtime has no npm dependencies. From `api/`, `node build.mjs` creates `dist/server/index.js` plus hosting/migration metadata. To change the schema, install locked development dependencies with pnpm and run `pnpm run db:generate`; commit both the generated SQL and Drizzle metadata. Never rewrite applied migrations.

Deploy the API separately with Sites tooling using its existing project registration. Only the sanitized `api/` source is sent to the Sites source repository; portfolio PDFs/history are not part of that deployment. Build and push the exact API source, package the built output with the Sites helper, save the version, then deploy publicly for portfolio visitors. Updating GitHub alone does not deploy API code. Runtime secret changes also require redeployment. Set the resulting origin in `data/assistant-config.json` and rebuild/publish the frontend.

## Content, contact and accessibility

All current contact destinations use **avnish1234pandeys@gmail.com**. `images/Avnish_2026_resume.pdf` is the supplied current résumé. Legacy PDF URLs contain the same current document so existing links remain useful. Historical commits are not rewritten.

The FormSubmit contact form was activated by the owner and its setup submission accepted. It sends names, emails and messages to the owner through FormSubmit. It includes required-field validation, honeypot, pending/duplicate-submit handling, timeout and direct-email fallback. Provider acceptance does not prove inbox delivery; check spam when troubleshooting.

The interface includes keyboard focus styles, reduced-motion behavior, semantic headings, mobile navigation, and a native modal dialog with Escape/close and focus return. Answers are rendered with textContent, never injected as HTML. With JavaScript disabled, normal links and the native contact form remain available.

## Troubleshooting

- **New repository absent:** check Actions logs, public visibility, nonempty content, archive/exclude settings and the next scheduled time.
- **Daily deploy fails:** inspect the failing Actions step, confirm Pages uses GitHub Actions and the branch permits the bot's content update. A concurrent human push is never force-overwritten; rerun after it settles.
- **AI says being connected:** add GROQ_API_KEY as a server secret, redeploy and check `/health`.
- **429:** visitor or daily quota was reached; wait for the window or deliberately adjust server limits.
- **502:** check Groq billing, model availability and provider status. Upstream error bodies and credentials are not sent to visitors.
- **503:** check key/DB setup, knowledge URL availability and service status.
- **409:** another request is generating the same answer; retry shortly.
- **Stale answer:** rebuild knowledge after editing curated data, publish, allow five minutes for reference refresh, and verify the changed content hash.
- **Local test lacks node:sqlite:** use Node 24+, not an older Node on PATH.

Before publishing, run the tests, `node --check assistant.js`, `node --check script.js`, and `node build.mjs`. Tests use mocked Groq responses and real SQLite migrations; an end-to-end paid-model check requires the owner's configured key. Image provenance remains in `images/projects/SOURCES.md` and the accompanying generation records.
