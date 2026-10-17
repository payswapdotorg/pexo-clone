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
| Login | `/login` | Demo session (Google OAuth shape, no real Google dependency) |
| Workspace | `/home` | Greeting, composer with template, attachments, quick starts, template gallery, recent projects |
| Project room | `/project/[id]` | The agent conversation: plan → still preview → timeline → confirm gate → render → delivery + feedback |

The agent brain is an LLM-driven state machine (`docs/AGENT-PROTOCOL.md`) that follows the
observed behavioral contract, with real image generation for still previews and a real
render pipeline for final videos.

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
bun run db:push   # Prisma + SQLite
bun run dev       # http://localhost:3000
```

## License

MIT — see `LICENSE`. The Pexo name, product, and assets belong to their respective owners.
