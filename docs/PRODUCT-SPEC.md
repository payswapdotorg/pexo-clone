# PRODUCT-SPEC — pexo-clone behavioral specification

Distilled from REA passive observation of https://pexo.ai (public pages + one logged-in
operator account, 2026-10-17). All items below are behavioral facts to **re-implement**.
Never copy original assets/copy verbatim — write original content in the same structural
spirit. Target naming in this repo: the product is called **"Pexo"** in observations;
the clone must NOT ship the Pexo brand — pick a neutral clone brand (e.g. **"Vidra"**
or keep it configurable via a single `BRAND` constant, default `"Pexo-Clone"`).

## 1. Product concept

An **AI video agent**: a chat-first web app where the user describes a video in plain
language (optionally with attachments), and an agent produces a finished, publish-ready
video through a collaborative, confirm-gated pipeline. Monetization is credit-based
(monthly plans with credits; agent actions consume credits at each stage).

Positioning (paraphrased, do not copy): "the AI video agent that turns your ideas into
videos" — for TikTok / YouTube / Instagram / X outputs; "more than an AI video generator":
it plans, shows previews, takes feedback, and iterates like a teammate.

## 2. Observed routes and surfaces

| Route | Type | Observed content |
| --- | --- | --- |
| `/` | public marketing | Header (logo, dropdowns: Create / Toolkit / Gallery / Resources, links: AI Video Agent, CLI/MCP, Pricing, language selector `en/ja/de/fr/es/pt`, "Get Started" CTA). Hero: H1 greeting, subhead, **prompt textbox + attach + send**, example-task chip carousel (≈15 prompts: SaaS launch video, kinetic typography explainer, brand launch, educational explainer, infographic product animation, app demo, service explainer, social ads, cinematic short film, live-action instructional, animation, mascot launch, launch video, collage explainer, AI avatar video), "How Pexo Delivers" 4-step strip (Start with an idea → Pexo plans it all → Chat to refine → Get ready-to-post video), category tabs (MG Explainer / Launch Videos / Story & Films / Product Ads / Social Media) each with example-video cards, model wall (Seedance, Happy Horse, GPT-Image 2, Nano Banana, Kling AI 3.0 + a logo strip: Hailuo, Pika, Midjourney, Kling, GPT Image, Veo, Seedance, Luma, MiniMax, Runway), features grid (Text/Image/URL/Audio/Script → video, AI avatar, image generation, music generation), customer reviews, blog strip, FAQ, footer (socials: Discord/LinkedIn/X/Instagram/TikTok/YouTube; "ask an AI" links; SEO link farm: use-case pages + model pages; Terms/Privacy; "Add as a preferred source on Google"). Sticky footer required. |
| `/video-agent` | public marketing | Explainer article: "a video agent that thinks with you", what it can make, Q&A, CTA. |
| `/skills` | public marketing | "Connect Pexo to your agent": copyable install command (CLI/MCP), GitHub skill link, capability cards (one brief → full ad set; pick a format; channel on autopilot), vertical use-cases (E-commerce, Explainers & data stories, Social media, Marketing teams, Filmmaking), Video/Image/Audio tabs, FAQ, CTA. |
| `/pricing` | public marketing | Model wall, plan cards (Free / "Unlock Pro" / "Unlock Elite" / "Unlock Max" with "18,000 credits / mo"), credits FAQ (balance, usage, types, rollover, top-ups, cancel, upgrade/downgrade order). |
| `/login` | auth | Redirects to Google OAuth (PKCE, callback `/api/auth/callback/google`); returns to `/home`. Clone: demo login page with "Continue with Google" (mock), creates a local session. |
| `/home` | app | First-run "What's new" dialog (3 slides: Meet Pexo / Motion / URL2Video). Greeting "Let's create videos together, {name}". **Main composer**: rich-text template card ("Create a ~30s, 16:9 promo…" with fields Product URL / Product / Key features / Visuals / Brand), Add attachment (URL, PDF, image, video, audio), confirm-policy selector ("Change when video generation asks to confirm": values incl. "Large costs"), send (arrow-up icon). **Quick Start** buttons: Make an Animation / Create a Short Film / Make an Explainer / Create a UGC Ad. **Template gallery** tabs: Template / Discover / Explainer Videos / Animation / Story & Film / Ads & UGC / Social Media — cards with autoplaying cover videos. **Recent projects** (collapsible). Credits widget + Upgrade. |
| `/project/[id]` | app | Header: Rename project, Credits, Assets panel, Share. **Chat column**: user messages (timestamps), agent messages (markdown: bold lead-ins, numbered decisions, bullet defaults), collapsibles ("Look over the template and the brief", "Read editing guidance"), **still-frame attachments** (image + "Insert to input" button), **produced videos** (inline player, "Produced Video", duration badge, filename), delivery actions **Download / Share / Mark to fix**, satisfaction feedback (**Good / Okay / Bad**). **Recent-projects sidebar** (resizable, status "Working", Delete), affiliate tip ("Share Pexo. Earn 30%." + dismiss), notifications prompt (Enable / Maybe later / Dismiss), web-push tip strip ("Tip: Your credit balance is in the top-right."). |

## 3. Golden path (observed end-to-end, 5s logo-loop task)

1. User types prompt in `/home` composer → send.
2. A project is created; browser navigates to `/project/{id}`; sidebar shows it "Working".
   Agent replies with **plan + clarifying questions**, explicitly listing:
   - "What I'd make:" — a concrete creative description;
   - "Two decisions for you:" — numbered items, each a hard choice the user must make
     (e.g. logo file vs plain type; template mismatch and what will be dropped/kept);
   - "Defaults I'll use unless you change them:" — Length, Aspect ratio, Palette, Sound;
   - Ends with direct questions ("Do you have …? And is X right, or Y?").
   - Notes it will show a still frame of the look before animating.
3. User answers ("Go with plain type. 16:9 is right.").
4. Agent posts a **still frame** attachment (mid-ripple frame; "Insert to input" available)
   plus a **second-by-second timeline** (0.7–1.7s drop forms and falls; 1.7–3s ripple;
   3.3–4.8s line draws in and spreads; 5s last frame matches first — seamless loop),
   states limitations ("no sound; plain Inter type, not a designed logo"), then asks for
   an explicit "go" before rendering.
5. User: "go".
6. Agent renders; project status "Working"; then delivers the **Produced Video** card
   (player + duration + filename + Download / Share / Mark to fix) and a message stating
   the delivery facts + an **honest-limitations note** ("I only checked a single frame…
   Give the loop point a look when you play it."), followed by a **feedback widget**
   ("Are you satisfied with the video?" Good / Okay / Bad).

### Observed credit accounting (5s logo task, plan: Free account)

100 (start) → 95 (after first prompt/project start) → 84 (after still + plan) → 79 → 78
(after render). Implement per-stage costs configurable in `CREDITS` constant; surface the
meter in header + project bar, with an Upgrade link.

## 4. Observed API surface (name-compatible re-implementation)

- `POST /api/chat` — send a chat message for the active project (body shape: project id +
  message; server drives the agent turn).
- `GET /api/biz/projects?page=1&page_size=10` — paginated recent projects list.
- `GET /api/biz/web-push/events?after_created_at=…&after_event_id=…` — long-poll event
  stream used for live agent status updates while working.
- NextAuth-style session (`nextauth.message` in localStorage, `access_token` in
  localStorage, Google callback `/api/auth/callback/google`).
- Client store: zustand `chat-store` in localStorage.
- Analytics: GA4 + Clarity (skip in clone), Firebase push (skip; keep the events API).

## 5. Tech (observed) and clone stack

Observed original: Next.js (App Router, Turbopack chunks), NextAuth (Google), zustand,
lucide icons, contenteditable rich editor, HLS cover videos, 6 locales.

Clone stack (required): **Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui,
Prisma (SQLite), lucide-react, zustand.** The agent brain and generation run
server-side through the sandbox AI SDK (`z-ai-web-dev-sdk`): LLM for planning turns,
image generation for still previews, video/animated rendering for the final deliverable
(any honest method that yields a playable MP4/WebM is acceptable; if real video
generation is unavailable in the runtime, fall back to a programmatic renderer
(e.g. ffmpeg-backed frame sequence from generated stills) and label it honestly).

## 6. Hard requirements

1. **Original everything**: no Pexo assets, fonts-of-record, marketing copy, or code.
   Screenshots from recon are internal evidence only and must NOT be committed.
2. Same journey shapes as §2–§3: every listed surface exists and is reachable via nav.
3. Sticky footer (marketing + app), responsive (mobile-first), a11y labels on all
   interactive elements, loading states on every async action, error toasts.
4. The agent NEVER renders without the explicit confirm gate (§3 step 4→5).
5. Credits are real (Prisma-backed) and enforced server-side.
6. Single `/` route is the app entry in the sandbox preview; marketing pages can be
   sections/modals of the app experience — do not create a multi-domain split.
