# pexo-clone

A clean-room clone of **[pexo.ai](https://pexo.ai)** — the chat-first AI video agent — built by
reverse-engineering the public site and the logged-in product surface with
**[REA (Reverse Engineer Anything)](https://github.com/morluto/rea)**.

> **Not affiliated with Pexo.** This is an independent study/teaching reconstruction.
> All code here is original. No Pexo source bundles, assets, images, videos, or marketing
> copy were copied. Product behavior was observed passively (CDP evidence) and re-implemented
> from the behavioral spec in `docs/PRODUCT-SPEC.md`.

## What the original product is

Pexo is an **AI video agent**: you describe a video in a chat box (optionally attaching a
URL / PDF / image / video / audio), an agent plans it with you — asking sharp clarifying
questions, proposing defaults, showing a still-frame "look" preview and a second-by-second
timeline — then renders the video after an explicit "go" confirmation and delivers it with
Download / Share / Mark-to-fix actions. A credit meter is consumed at each stage.

## What this clone delivers

| Surface | Route | Notes |
| --- | --- | --- |
| Marketing home | `/` | Hero with live composer, example tasks, how-it-works, categories, model wall, features, FAQ, footer |
| Video agent page | `/video-agent` | Product explainer |
| Skills page | `/skills` | Agent-skill / CLI connection story |
| Pricing | `/pricing` | Free / Pro / Elite / Max tiers + credits FAQ |
| Login | `/login` | Demo session (Google OAuth shape, no real Google dependency): every login issues a **per-visitor sandbox account** — own projects, own 100 credits |
| Workspace | `/home` | Greeting, composer with template, attachments, quick starts, template gallery, recent projects |
| Project room | `/project/[id]` | The agent conversation: plan → still preview → timeline → confirm gate → render → delivery + feedback |

The agent brain is an LLM-driven state machine (`docs/AGENT-PROTOCOL.md`) that follows the
observed behavioral contract, with real image generation for still previews and a real
render pipeline for final videos (SDK video model; programmatic ffmpeg fallback from the
approved still).

## Architecture

**Stack**: Next.js 16 (App Router) · TypeScript (strict) · Tailwind + shadcn/ui ·
Prisma + Postgres · zustand · provider-chained AI (z-ai-web-dev-sdk sandbox /
DashScope / OpenRouter, server-side only) · Cloudflare R2 or local-disk
artifact storage · ffmpeg fallback (sandbox only).

**Data model** (`prisma/schema.prisma`): `User` (credits 100, plan) · `Project`
(status working|waiting|ready, confirmPolicy) · `Message` (role user|agent, markdown, stage,
attachments JSON) · `Artifact` (kind still|video, url, filename, durationSec) ·
`Feedback` (rating good|okay|bad) · `CreditEvent` (ledger) · `ProjectEvent`
(long-poll event stream). Project status is honest by construction: **working**
means the agent is genuinely computing (a turn is in flight), **waiting** means
the next move is the user's (answer the plan questions, confirm the render,
retry after a failure, top up), **ready** means a video was delivered — the UI
never shows a spinner while it is the user's turn. Artifacts are stored through a storage abstraction
(`src/lib/storage.ts`) — Cloudflare R2 (S3-compatible) when `R2_*` env vars are
set, local `data/artifacts/` otherwise — and served by `/api/artifacts/*` with
HTTP Range support either way.

**Agent stage machine** (`src/lib/agent/protocol.ts`, per `docs/AGENT-PROTOCOL.md`):

```
INTAKE → PLAN_QUESTIONS → STILL_PREVIEW → CONFIRM_GATE → RENDERING → DELIVERY → FEEDBACK
```

- INTAKE consumes PROJECT_START (5 credits); the LLM turn must contain the mandated
  shape (What I'd make / N decisions for you / Defaults: Length, Aspect ratio, Palette,
  Sound / closing direct questions).
- **The attachments pass** (`src/lib/agent/attachments.ts` + `vision.ts`): attached
  images are read by a vision model (same provider chain as the LLM: OpenRouter →
  DashScope `qwen3-vl-plus` → sandbox z-ai SDK), PDFs and URLs through dependency-free
  text extraction (FlateDecode + Tj/TJ operators; SSRF-guarded fetch). Every
  attachment resolves to a `read: …` digest the plan treats as ground truth — or an
  honest `could not read: …` note it must surface (never a silent filename-only
  read). Video/audio are kept as reference with an honest note.
- STILL_PREVIEW consumes PREVIEW (11): one generated still + second-by-second timeline
  (`X–Ys: …`) + limitations + an explicit "say go" ask. The still honors the aspect
  ratio agreed in the conversation (plan default or a later user override; the newest
  mention wins — 9:16, 1:1, 4:3 and the other wan sizes are supported), and the
  timeline honestly covers the 5 seconds the engine renders per clip.
- CONFIRM_GATE: only explicit affirmation ("go", "yes, render", "do it", …) advances;
  anything else is an edit → a fresh preview. Never auto-renders.
- RENDERING checks the balance first (insufficient → upgrade-offer turn, zero spend),
consumes RENDER (6), sets status working, and produces a playable MP4.
- DELIVERY posts the Produced Video card + facts + an honest-limitations note;
  FEEDBACK persists Good/Okay/Bad; Mark-to-fix returns to STILL_PREVIEW.
- Every turn hands the ball back visibly: status goes to **waiting** whenever the
  agent finishes (plan, preview, blocked-on-credits) or a turn fails — the UI
  pill switches from the Working spinner to “Your move” so users are never
  trained to wait when the next move is theirs. DELIVERY sets **ready**.
- Every turn is transactional: generation happens first, credits/messages/artifacts
  commit after; failures roll back.
- Sharing is real and opt-in: the Share menu creates an unguessable public link
  (`/share/<id>`) that renders a read-only view for anyone — the old behavior
  (copying a session-scoped URL that only ever worked for the owner) is gone.
  Revoking or deleting the project kills the link immediately.

**API surface** (name-compatible with the observed original):

| Endpoint | Purpose |
| --- | --- |
| `POST /api/chat` | The agent turn: validates session + project, appends the user message, runs the stage machine |
| `GET /api/biz/projects?page=&page_size=` | Paginated recent projects (owner-scoped) |
| `GET/PATCH/DELETE /api/biz/projects/[id]` | Project detail (messages + artifacts + feedback) · rename · delete |
| `POST /api/biz/projects/[id]/feedback` | Satisfaction rating (good/okay/bad) |
| `POST /api/biz/projects/[id]/share` | Owner-controlled public sharing: `create` an unguessable id / `revoke` it |
| `GET /share/[publicId]` | Public read-only project view (conversation + stills + video) — 404s the moment sharing is revoked or the project is deleted |
| `GET /api/biz/web-push/events?after_event_id=&project_id=` | Long-poll event stream (message/artifact/status/credits) |
| `GET /api/artifacts/[...path]` | Stills + videos from storage (R2 or disk; Range requests, traversal-safe) |
| `POST /api/uploads` | Attachment uploads (≤ 8MB: pdf/image/video/audio) |
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/session` | Demo session (signed httpOnly cookie; Google button is a mock) |
| `POST /api/user/upgrade` · `GET /api/user/credits` | Plan flip (demo) + credit balance |

The UI live-updates through the events long-poll: agent turns, artifacts, project
status, and the credit meter update without manual refresh.

## Public-deployment hardening

The demo is deployed on the public internet with real provider keys behind it, so
the spend surface is guarded end-to-end:

- **Per-visitor sandbox logins.** Every login (the Google mock or the demo button)
  issues its own generated account (`demo-<hex>@demo.vidra.local`) — own projects,
  own 100 credits, never a shared account. Returning visitors land back in their
  own sandbox via a httpOnly hint cookie. Unused sandboxes (no projects, older
  than a week) are pruned opportunistically.
- **Rate limits** (DB-backed fixed windows — serverless instances share no memory,
  so the Postgres row *is* the counter; `RateLimit` table, one atomic upsert per
  request, standard `Retry-After` on 429s):

  | Route | Key | Default limit | Env override |
  | --- | --- | --- | --- |
  | `POST /api/auth/login` | per network (IP) | 10 / 10 min | `LOGIN_RATE_LIMIT` |
  | `POST /api/chat` | per user | 30 / 10 min | `CHAT_RATE_LIMIT` |
  | `POST /api/uploads` | per user | 20 / 10 min | `UPLOAD_RATE_LIMIT` |

- **Sessions fail closed.** `VIDRA_DEMO_SECRET` must be set in production; the
  HMAC fallback in the repo is a public constant, so in production the app refuses
  to sign or trust sessions made with it instead of silently accepting forgeable
  cookies.
- Uploads are already capped (≤ 8MB, type whitelist) and every project/message
  route is owner-scoped by the session user.

## Recon method (REA evidence)

- `rea list-browser-targets` / `inspect-web-page` / `analyze-web-bundle` /
  `capture-web-screenshot` / `observe-web-session` against a user-owned Chrome over CDP.
- Public pages + a logged-in operator account; one full golden-path run
  (prompt → plan → still → render → delivery) observed end-to-end, including network
  (POST `/api/chat`, GET `/api/biz/projects`, long-poll `/api/biz/web-push/events`)
  and storage (`chat-store`, `access_token`, NextAuth) evidence.
- Findings distilled into `docs/PRODUCT-SPEC.md` (facts only — no copied assets).

## Run it

```bash
bun install
cp .env.example .env   # set DATABASE_URL (any Postgres; Neon works great)
bun run db:push        # Prisma + Postgres
bun run dev            # http://localhost:3000
```

No seeding is needed — the first login creates the demo user (100 credits).
Set `VIDRA_DEMO_SECRET` to override the session-signing default.

**AI providers** (`src/lib/agent/llm.ts`, `vision.ts`): with no provider keys set,
the agent uses the sandbox `z-ai-web-dev-sdk` gateway (local/sandbox only — also the
vision fallback for the attachments pass). Set `DASHSCOPE_API_KEY` (Alibaba Model
Studio international) to run anywhere with `qwen-plus` (LLM), `qwen3-vl-plus`
(vision, `DASHSCOPE_VISION_MODEL`), `wan2.2-t2i-flash` (stills) and
`wan2.1-t2v-turbo` (video); optionally `OPENROUTER_API_KEY` (+ `LLM_MODEL` /
`VISION_MODEL`) as the first-choice LLM/vision with automatic fall-through. See
`.env.example` for every knob.

**Artifact storage**: set `R2_BUCKET` + `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`
+ `R2_ENDPOINT` to store stills/videos/uploads in Cloudflare R2 instead of local
disk (required on serverless hosting).

## Deploy (Vercel + Neon + R2)

The production deployment runs on Vercel with Neon Postgres and Cloudflare R2:

1. Create a Neon project, put the connection string in `DATABASE_URL`
   (pooled endpoint with `pgbouncer=true&connection_limit=1` for serverless).
2. Create an R2 bucket + S3 API token, set the four `R2_*` variables.
3. Set `DASHSCOPE_API_KEY` (and optionally the model overrides).
4. `vercel deploy --prod` — `package.json` build runs `prisma generate && next build`.

`/api/chat` exports `maxDuration = 300` because the wan video model takes
~2–3 minutes per 5-second render.

## License

MIT — see `LICENSE`. The Pexo name, product, and assets belong to their respective owners.

## Accessibility (WCAG 2.1/2.2 audit pass)

The clone is audited and fixed against the WCAG success criteria a chat-first
consumer surface actually trips:

- **Focus visible (2.4.7).** The composer textarea intentionally carries no own
  ring (clean look) — instead the whole composer card glows
  (`has-[textarea:focus-visible]:ring-2`), so keyboard users always see where
  they are on the product's primary control. Tab panels got the same treatment.
- **Contrast (1.4.3).** All helper text renders at full `--muted-foreground`
  (6.7:1 on the canvas, 6.3:1 on cards — AA). Opacity-diluted variants of the
  muted token (3.1–3.8:1) are banned from text; hierarchy comes from size and
  weight, never from contrast.
- **Reduced motion (2.3.3).** A global `prefers-reduced-motion` rule resolves
  every animation instantly — the status dots stop bouncing, dialogs snap open.
- **Target size (2.5.8).** Every control clears the 24px AA floor (footer links
  and the guidance trigger used to sit at 16px); the send button is 44px, header
  icons 36px.
- **Bypass blocks (2.4.1).** Every layout (app, marketing, share viewer) opens
  with a keyboard-only "Skip to main content" link.
- **Focus order (2.4.3).** The auto-opening onboarding dialog returns focus to
  the composer (not `<body>`) when dismissed.
- **Status messages (4.1.3).** The conversation is a `role=log`, credit balance
  is `aria-live`, toasts announce, and the project status pill is a
  `role=status` — screen readers hear every state transition.
- Screen-reader polish: the project `h1` no longer reads a 13-digit database id.
