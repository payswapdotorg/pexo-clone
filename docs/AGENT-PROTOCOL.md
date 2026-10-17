# AGENT-PROTOCOL — the video-agent behavioral contract

This is the soul of the clone. It re-implements the observed conversation behavior of the
original product's agent, as a deterministic stage machine with an LLM as the language
engine. Every user-visible agent turn is produced THROUGH this protocol, not improvised.

## Stage machine

```
INTAKE ──▶ PLAN_QUESTIONS ──▶ STILL_PREVIEW ──▶ CONFIRM_GATE ──▶ RENDERING ──▶ DELIVERY ──▶ FEEDBACK
              (user answers)      (still+timeline)    ("go")        (progress)     (video+actions)
```

Any user message can also be: `EDIT` (Mark to fix / change request) → back to
STILL_PREVIEW (or PLAN_QUESTIONS if scope changes), and `ANSWER` (advances the stage).

### S0 INTAKE (on first prompt of a project)
- Create project (id, title derived from the prompt), consume PROJECT_START credits.
- Select/attach the template card if the composer carried one.

### S1 PLAN_QUESTIONS (LLM turn, temperature low)
Output markdown with EXACTLY this shape:
1. **What I'd make:** one concrete creative paragraph (specific visual idea, not generic).
2. **{N} decisions for you:** numbered; each = a real fork the user must decide
   (asset availability, template fit, scope). When a chosen template doesn't fit the
   ask, say so and propose dropping structure while keeping style.
3. **Defaults I'll use unless you change them:** bullets — Length, Aspect ratio,
   Palette, Sound (always these four at minimum).
4. Closing direct questions (ask exactly what's needed to proceed).
Style: collaborative, specific, honest about limitations ("I can't design a logo —
send the file or I'll set plain type"), never sycophantic, no emojis.

### S2 STILL_PREVIEW
- Consume PREVIEW credits. Generate ONE still frame (image generation) of the key moment.
- Post: the still attachment (with "Insert to input"), a **second-by-second timeline**
  (bullets `X–Ys: what happens`), limitations note, and the closing ask for an explicit
  "go" — no rendering before it.

### S3 CONFIRM_GATE
- Accept only explicit affirmations ("go", "yes, render", "do it"). Anything else is an
  edit → S2 (or S1 if scope changed). Never auto-advance.

### S4 RENDERING
- Consume RENDER credits (check balance first; if insufficient → offer Upgrade, stop).
- Project status "Working"; progress visible in UI (polling or SSE-equivalent
  `/api/biz/web-push/events` long-poll).

### S5 DELIVERY
- Produced Video card: inline player, duration badge, filename, actions
  **Download / Share / Mark to fix**.
- Message: delivery facts + **honest-limitations note** (what the agent did NOT verify:
  e.g. only a single frame was checked; the user should review specific moments).

### S6 FEEDBACK
- "Are you satisfied with the video?" — Good / Okay / Bad. Mark-to-fix returns to S2
  with the fix request. Feedback is persisted on the project.

## Credit contract (defaults, configurable)

| Stage | Key | Default cost |
| --- | --- | --- |
| Project start | `PROJECT_START` | 5 |
| Still + plan | `PREVIEW` | 11 |
| Render (5s) | `RENDER` | 6 |
| New account | — | 100 free credits |

## Backend implementation notes

- `POST /api/chat` → validates session + project, appends the user message, runs the
  stage machine, returns the agent turn (and any artifacts).
- Agent turns are **transactional**: a turn completes fully (DB writes + artifact files)
  before responding; failures roll back credit spends.
- Artifacts (stills/videos) are stored under a per-project data dir; only URLs are in DB.
- Long-poll `/api/biz/web-push/events` returns queued events newer than the cursor.
- All LLM/generation calls go through `z-ai-web-dev-sdk` **server-side only**.
