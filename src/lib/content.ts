/**
 * Marketing + product content — ALL original copy for the clean-room clone
 * (PRODUCT-SPEC §6.1: never reproduce the original's copy verbatim; same
 * structural spirit only). Names of third-party models are factual badges
 * (spec §2 model wall) — text chips, no logos.
 */

/* ------------------------------------------------------------------ home -- */

export const HERO = {
  eyebrow: "AI video agent",
  h1: "Turn a sentence into a finished video",
  subhead:
    "Tell the agent what you need. It plans the scene, shows you a preview still, takes your notes, and only renders when you say go — for TikTok, YouTube, Instagram, and X.",
  composerLabel: "Describe the video you want",
  composerPlaceholder:
    "e.g. A 15-second vertical ad for a cold-brew kit, warm morning light, bold text at the end…",
};

export const EXAMPLE_PROMPTS: string[] = [
  "A 30-second SaaS launch teaser with kinetic captions over a clean product UI",
  "A kinetic typography explainer about how compound interest works",
  "A brand launch film for a small-batch hot sauce company, reds and ember tones",
  "An educational explainer teaching kids why the sky changes color at sunset",
  "An infographic-style product animation comparing two subscription tiers",
  "A screen-recorded app demo with animated callouts for a habit tracker",
  "A 20-second service explainer for a bike-repair shop, friendly and hand-drawn feel",
  "Three 9:16 social ads for a fitness app, fast cuts, on-beat text pops",
  "A 60-second cinematic short about a lighthouse keeper's last shift",
  "A live-action style instructional clip on seasoning a cast-iron pan",
  "A 2D animated short introducing a sleepy raccoon mascot for a reading app",
  "A collage explainer that assembles newspaper cutouts into a product story",
  "An AI avatar presenting quarterly numbers to a small team, calm and clear",
  "A looping 5-second logo animation for a woodwork studio, seamless loop",
];

export const STEPS: { title: string; text: string }[] = [
  {
    title: "Start with an idea",
    text: "One plain sentence is enough. Paste a link, attach a PDF, or drop an image — whatever you have.",
  },
  {
    title: "Your agent plans the whole cut",
    text: "It proposes the creative, the pacing, and the defaults — then asks the two decisions only you can make.",
  },
  {
    title: "Refine it in chat",
    text: "Comment on the still preview, swap the palette, trim the timeline. Every change is a message, not a re-edit.",
  },
  {
    title: "Post-ready, hands-off",
    text: "When you say go, it renders and hands you a finished video with a straight list of what it checked — and what it didn't.",
  },
];

export const CATEGORIES: {
  id: string;
  label: string;
  cards: { title: string; blurb: string; duration: string; gradient: string }[];
}[] = [
  {
    id: "mg-explainer",
    label: "MG Explainer",
    cards: [
      {
        title: "How gravity slings a probe",
        blurb: "Motion-graphics explainer with orbit paths drawn on-screen",
        duration: "0:48",
        gradient: "from-amber-500/70 via-orange-600/50 to-stone-900",
      },
      {
        title: "Compound interest, visualized",
        blurb: "Growing bars and a timeline that pays you back",
        duration: "1:05",
        gradient: "from-lime-600/60 via-emerald-700/40 to-stone-900",
      },
      {
        title: "Why planes circle before landing",
        blurb: "Animated holding pattern with clean line icons",
        duration: "0:37",
        gradient: "from-sky-700/60 via-slate-700/40 to-stone-900",
      },
    ],
  },
  {
    id: "launch",
    label: "Launch Videos",
    cards: [
      {
        title: "Cold-brew kit, morning launch",
        blurb: "Warm light, slow pours, and one bold claim at the end",
        duration: "0:30",
        gradient: "from-amber-600/70 via-yellow-700/40 to-stone-900",
      },
      {
        title: "Dev-tool teaser in 20 seconds",
        blurb: "Kinetic captions over a crisp terminal aesthetic",
        duration: "0:20",
        gradient: "from-stone-400/50 via-stone-600/40 to-stone-900",
      },
      {
        title: "Running-shoe reveal",
        blurb: "Product turntable with beat-synced text pops",
        duration: "0:15",
        gradient: "from-rose-600/60 via-red-800/40 to-stone-900",
      },
    ],
  },
  {
    id: "story",
    label: "Story & Films",
    cards: [
      {
        title: "The last shift",
        blurb: "A 60-second cinematic short about a lighthouse keeper",
        duration: "1:00",
        gradient: "from-indigo-900/60 via-slate-800/50 to-stone-900",
      },
      {
        title: "Market at dawn",
        blurb: "Documentary-style vignette with ambient sound",
        duration: "0:52",
        gradient: "from-orange-700/60 via-amber-800/40 to-stone-900",
      },
      {
        title: "Paper city",
        blurb: "Stop-motion feel, hand-crafted paper skyline",
        duration: "0:45",
        gradient: "from-teal-700/60 via-cyan-900/40 to-stone-900",
      },
    ],
  },
  {
    id: "ads",
    label: "Product Ads",
    cards: [
      {
        title: "Feature showdown",
        blurb: "Infographic animation comparing two subscription tiers",
        duration: "0:25",
        gradient: "from-violet-800/60 via-purple-900/40 to-stone-900",
      },
      {
        title: "UGC-style unboxing",
        blurb: "Handheld feel, honest voice, one clear CTA",
        duration: "0:18",
        gradient: "from-fuchsia-700/50 via-rose-900/40 to-stone-900",
      },
      {
        title: "Nine ads from one brief",
        blurb: "The agent cuts a full ad set from a single product page",
        duration: "0:12",
        gradient: "from-amber-500/60 via-orange-700/40 to-stone-900",
      },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    cards: [
      {
        title: "On-beat text pops",
        blurb: "Vertical 9:16 cuts for TikTok and Reels",
        duration: "0:09",
        gradient: "from-cyan-600/60 via-teal-800/40 to-stone-900",
      },
      {
        title: "Carousel-to-motion",
        blurb: "Turn a static carousel into a scrolling teaser",
        duration: "0:14",
        gradient: "from-blue-800/60 via-indigo-900/40 to-stone-900",
      },
      {
        title: "Quote card series",
        blurb: "Typography-first quote cards with subtle drift",
        duration: "0:08",
        gradient: "from-stone-500/60 via-stone-700/40 to-stone-900",
      },
    ],
  },
];

export const MODEL_WALL: string[] = [
  "Seedance",
  "Happy Horse",
  "GPT-Image 2",
  "Nano Banana",
  "Kling AI 3.0",
];

export const MODEL_LOGO_STRIP: string[] = [
  "Hailuo",
  "Pika",
  "Midjourney",
  "Kling",
  "GPT Image",
  "Veo",
  "Seedance",
  "Luma",
  "MiniMax",
  "Runway",
];

export const FEATURES: { title: string; text: string; icon: string }[] = [
  {
    title: "Text to video",
    text: "Describe the shot; the agent storyboards and renders it.",
    icon: "type",
  },
  {
    title: "Image to video",
    text: "Feed a still and get motion that respects its composition.",
    icon: "image",
  },
  {
    title: "URL to video",
    text: "Point at a product page; the agent reads it and pitches the cut.",
    icon: "link",
  },
  {
    title: "Audio to video",
    text: "Match cuts, beats, and mood to a track you upload.",
    icon: "audio",
  },
  {
    title: "Script to video",
    text: "Paste a script; get scene beats, b-roll choices, and captions.",
    icon: "scroll",
  },
  {
    title: "AI avatar",
    text: "A presenter who reads your copy with calm, natural delivery.",
    icon: "user",
  },
  {
    title: "Image generation",
    text: "Stills, thumbnails, and keyframes generated in the same chat.",
    icon: "sparkles",
  },
  {
    title: "Music generation",
    text: "A scored bed that fits the length and tone of the cut.",
    icon: "music",
  },
];

export const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      "I typed two sentences on a train and had a launch teaser before my stop. The preview-still step is what sold me — I knew what I was getting.",
    name: "Marta K.",
    role: "Founder, two-person studio",
  },
  {
    quote:
      "It argues with you in the good way. It told me my 90-second script wanted to be 40 seconds, and it was right.",
    name: "Devin A.",
    role: "Growth marketer",
  },
  {
    quote:
      "We replaced a Friday of editing back-and-forth with one chat thread. The honest limitations note is oddly the most trustworthy part.",
    name: "Priya S.",
    role: "Content lead, e-commerce",
  },
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What actually happens after I type my prompt?",
    a: "Your agent drafts a plan — what it would make, the decisions it needs from you, and the defaults it will use. Nothing renders until you explicitly say go.",
  },
  {
    q: "Do I need footage or a script to start?",
    a: "No. A single sentence works. If you have a product URL, images, audio, or a script, attach any of them and the agent will fold them into the plan.",
  },
  {
    q: "Can I change things after seeing a preview?",
    a: "Yes — that is the main loop. The agent posts a still preview and a second-by-second timeline; you reply with changes, and it revises before rendering.",
  },
  {
    q: "What formats and aspect ratios can I get?",
    a: "Vertical 9:16 for TikTok, Reels, and Shorts; 16:9 for YouTube and X; square 1:1 for feeds. The agent proposes one and you can override it.",
  },
  {
    q: "How do credits work?",
    a: "Every account starts with free credits. Each stage of work — planning, previewing, rendering — draws a known number of credits, and the meter is always visible.",
  },
  {
    q: "Who owns the videos I make?",
    a: "You do. Output is yours to publish anywhere. We never resell or republish your creations.",
  },
  {
    q: "Can the agent match our brand style?",
    a: "Give it your palette, font, and a reference frame once, and it keeps those defaults for every future project in the workspace.",
  },
];

export const BLOG_POSTS: {
  title: string;
  blurb: string;
  tag: string;
  readTime: string;
}[] = [
  {
    title: "Why the preview still matters more than the render",
    blurb:
      "A cheap, honest look at frame one saves the expensive mistakes at frame three hundred.",
    tag: "Craft",
    readTime: "4 min",
  },
  {
    title: "From product URL to ad set in one chat thread",
    blurb:
      "How a single brief becomes nine on-brand cuts without a timeline editor.",
    tag: "Playbook",
    readTime: "6 min",
  },
  {
    title: "The confirm gate: an agent that asks permission",
    blurb:
      "Autonomy is great until it costs credits. Our agent waits for your go.",
    tag: "Design",
    readTime: "3 min",
  },
];

/* ---------------------------------------------------------- video-agent -- */

export const VIDEO_AGENT = {
  eyebrow: "AI Video Agent",
  h1: "A video agent that thinks with you",
  lede: "Not a slot machine. A collaborator that plans before it renders, shows its work, and waits for your go.",
  narrative: [
    "Most video tools hand you a spinner and a surprise. An agent is different: before anything renders, it tells you what it would make, asks the two decisions only you can answer, and lays out the defaults it intends to use.",
    "Then it shows you a still preview — frame one of the finished piece — with a second-by-second timeline of everything that follows. You talk. It adjusts. When you are satisfied, you say go.",
    "That single confirmation is the whole philosophy. Creative work deserves a driver with a plan and a passenger with veto rights.",
  ],
  capabilities: [
    {
      title: "Plans before it renders",
      text: "Every project opens with a concrete creative proposal — not a prompt lottery.",
    },
    {
      title: "Shows a still preview",
      text: "See the look and the timeline before a single credit goes to render.",
    },
    {
      title: "Takes edits as conversation",
      text: "\u201cWarmer palette, slower middle\u201d is a complete revision request.",
    },
    {
      title: "Renders once, on your go",
      text: "The expensive step never runs without your explicit yes.",
    },
    {
      title: "Reports its limits honestly",
      text: "Delivery comes with what was checked — and what wasn't.",
    },
    {
      title: "Learns your defaults",
      text: "Length, ratio, palette, and sound stick to the workspace once set.",
    },
  ],
  qa: [
    {
      q: "Is this just prompt-to-video?",
      a: "Prompt-to-video is the floor. The agent adds a planning turn, a preview turn, an edit loop, and a confirm gate — the collaboration is the product.",
    },
    {
      q: "What if I hate the plan?",
      a: "Say so. It re-plans. The plan is cheap; the render is not.",
    },
    {
      q: "Can it use my own footage?",
      a: "Yes — attach video, images, audio, a script, or a product URL and it builds around them.",
    },
  ],
};

/* ---------------------------------------------------------------- skills -- */

export const SKILLS = {
  eyebrow: "Agent skills",
  h1: "Connect your agent to the video shop",
  lede: "Give any CLI or MCP-capable agent one install command, and it gains a full video production desk.",
  installCommand: "bunx vidra-skills add video-agent",
  capabilities: [
    {
      title: "One brief, a full ad set",
      text: "Hand the skill a product brief and it returns a campaign: hero cut, retargeting bites, and platform variants.",
    },
    {
      title: "Pick a format, not a settings panel",
      text: "Ask for a 9:16 launch tease or a 16:9 explainer — the skill owns the technical presets.",
    },
    {
      title: "Channel on autopilot",
      text: "Schedule-ready outputs named and sized for each destination, straight from your agent's toolchain.",
    },
  ],
  verticals: [
    {
      title: "E-commerce",
      text: "Product pages become video campaigns overnight.",
    },
    {
      title: "Explainers & data stories",
      text: "Turn dense material into motion graphics that respect attention spans.",
    },
    {
      title: "Social media",
      text: "Always-on verticals without an always-on editor.",
    },
    {
      title: "Marketing teams",
      text: "Briefs go in; reviewable cuts come out — with the paper trail in chat.",
    },
    {
      title: "Filmmaking",
      text: "Pre-visualize scenes and test pacing before the expensive day.",
    },
  ],
  tabs: [
    {
      id: "video",
      label: "Video",
      items: [
        "Launch teasers, product films, social verticals",
        "Storyboard and timeline drafts from one sentence",
        "Aspect-ratio presets for every major platform",
      ],
    },
    {
      id: "image",
      label: "Image",
      items: [
        "Keyframes and still previews in-chat",
        "Thumbnails sized per destination",
        "Palette and style locked to your brand",
      ],
    },
    {
      id: "audio",
      label: "Audio",
      items: [
        "Generated score beds matched to cut length",
        "Voice tracks for avatar presenters",
        "Beat-synced text and transitions",
      ],
    },
  ],
};

/* --------------------------------------------------------------- pricing -- */

export const PLANS: {
  name: string;
  price: string;
  period: string;
  credits: string;
  blurb: string;
  cta: string;
  featured: boolean;
  features: string[];
}[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    credits: "100 credits to start",
    blurb: "Try the full loop — plan, preview, and your first renders.",
    cta: "Start free",
    featured: false,
    features: [
      "100 starting credits",
      "All planning and preview stages",
      "Standard render queue",
      "Community support",
    ],
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    credits: "3,500 credits / mo",
    blurb: "For creators shipping every week.",
    cta: "Unlock Pro",
    featured: false,
    features: [
      "3,500 credits per month",
      "Priority render queue",
      "Brand defaults (palette, fonts, ratio)",
      "Watermark-free exports",
    ],
  },
  {
    name: "Elite",
    price: "$49",
    period: "per month",
    credits: "9,000 credits / mo",
    blurb: "For small teams with a real content calendar.",
    cta: "Unlock Elite",
    featured: true,
    features: [
      "9,000 credits per month",
      "Faster queue + batch ad sets",
      "Workspace defaults shared across projects",
      "Early access to new agent abilities",
    ],
  },
  {
    name: "Max",
    price: "$99",
    period: "per month",
    credits: "18,000 credits / mo",
    blurb: "For studios where video is the product.",
    cta: "Unlock Max",
    featured: false,
    features: [
      "18,000 credits per month",
      "Highest queue priority",
      "Dedicated render capacity windows",
      "Priority support channel",
    ],
  },
];

export const CREDITS_FAQ: { q: string; a: string }[] = [
  {
    q: "How do I check my credit balance?",
    a: "Your balance is always visible in the top-right of the workspace and in every project header. Every spend is itemized on the account page.",
  },
  {
    q: "What consumes credits?",
    a: "The stages of real work: starting a project, planning and previewing (the still + timeline), and the final render. Chatting and editing defaults are free.",
  },
  {
    q: "Do different outputs cost different amounts?",
    a: "Yes — cost scales with render length and complexity. The agent states the cost of the next step before it happens, so nothing is a surprise.",
  },
  {
    q: "Do credits roll over?",
    a: "Monthly plan credits roll over for one month. Free credits do not expire while the account is active.",
  },
  {
    q: "Can I top up mid-month?",
    a: "Anytime. Top-ups are one-off packs that never expire and are spent after your monthly balance.",
  },
  {
    q: "What happens if I cancel?",
    a: "You keep access to the end of the billing period, and your rendered videos remain downloadable forever.",
  },
  {
    q: "How do upgrades and downgrades apply?",
    a: "Upgrades take effect immediately with a prorated charge. Downgrades apply at the next renewal. Your balance and projects carry over either way.",
  },
];

/* ------------------------------------------------------ app: workspace -- */

export const WHATS_NEW: { title: string; text: string }[] = [
  {
    title: "Meet your video agent",
    text: "Describe the video you want in plain words. The agent drafts the plan, asks the questions only you can answer, and sets sensible defaults before anything renders.",
  },
  {
    title: "Preview before it renders",
    text: "Every project shows a still frame and a second-by-second timeline first. Comment, adjust, and only spend render credits once you give an explicit go.",
  },
  {
    title: "Bring your own brief",
    text: "Paste a product link, attach a document or an image, or start from a template card. The agent folds whatever you already have into the plan.",
  },
];

export const QUICK_STARTS: { id: string; label: string; prompt: string }[] = [
  {
    id: "animation",
    label: "Make an Animation",
    prompt:
      "Make a 10-second 2D animation of a paper boat crossing a rain puddle, gentle motion, muted palette, seamless loop.",
  },
  {
    id: "short-film",
    label: "Create a Short Film",
    prompt:
      "Create a 45-second cinematic short about a night baker closing up shop, warm tungsten light, no dialogue.",
  },
  {
    id: "explainer",
    label: "Make an Explainer",
    prompt:
      "Make a 60-second explainer on why the sky turns red at sunset, kinetic type over simple diagrams, friendly tone.",
  },
  {
    id: "ugc-ad",
    label: "Create a UGC Ad",
    prompt:
      "Create a 20-second UGC-style ad for a stainless steel water bottle, handheld feel, one honest hook, clear call to action.",
  },
];

/** CSS-art cover config (gradients are Tailwind classes; pattern is a css utility). */
export interface GalleryCard {
  title: string;
  blurb: string;
  prompt: string;
  gradient: string;
  pattern?: "dots" | "lines" | "grid";
}

export interface GalleryTab {
  id: string;
  label: string;
  cards: GalleryCard[];
}

export const GALLERY_TABS: GalleryTab[] = [
  {
    id: "template",
    label: "Template",
    cards: [
      {
        title: "30-second product promo",
        blurb: "A tight 16:9 promo cut built from your product page.",
        prompt:
          "Make a 30-second 16:9 promo for my product: bold claim up front, three feature beats, brand end card.",
        gradient: "from-amber-500/70 via-orange-600/50 to-stone-900",
        pattern: "grid",
      },
      {
        title: "Vertical social teaser",
        blurb: "A 9:16 teaser with on-beat text pops.",
        prompt:
          "Create a 12-second vertical teaser for social: hook in the first two seconds, fast cuts, bold text pops.",
        gradient: "from-rose-600/60 via-red-800/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Kinetic-type explainer",
        blurb: "Teach one idea with animated type and steady pacing.",
        prompt:
          "Make a 45-second kinetic typography explainer for the idea in my brief, clean type, steady pacing.",
        gradient: "from-stone-400/50 via-stone-600/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Seamless logo loop",
        blurb: "A 5-second brand loop whose last frame matches its first.",
        prompt:
          "Make a 5-second seamless logo loop animation for my brand, minimal motion, loop-perfect final frame.",
        gradient: "from-teal-700/60 via-emerald-900/40 to-stone-900",
      },
      {
        title: "UGC-style ad",
        blurb: "Handheld feel, honest voice, one clear CTA.",
        prompt:
          "Create a 20-second UGC-style ad with a handheld feel, one honest hook, and a clear call to action at the end.",
        gradient: "from-violet-800/60 via-purple-900/40 to-stone-900",
        pattern: "dots",
      },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    cards: [
      {
        title: "One brief, nine cuts",
        blurb: "A full ad set spun from a single product page.",
        prompt:
          "Read my product page and cut a hero ad plus two short social variants from the same brief.",
        gradient: "from-amber-600/70 via-yellow-700/40 to-stone-900",
        pattern: "grid",
      },
      {
        title: "Launch-day teaser",
        blurb: "Countdown energy with a single bold promise.",
        prompt:
          "Make a 15-second launch teaser with countdown energy, one bold promise, and a clean logo sting.",
        gradient: "from-fuchsia-700/50 via-rose-900/40 to-stone-900",
      },
      {
        title: "Podcast clip to reels",
        blurb: "Turn a long conversation into punchy verticals.",
        prompt:
          "Turn my podcast episode into three 30-second vertical reels with captioned highlight moments.",
        gradient: "from-lime-600/60 via-emerald-700/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Recruiting culture clip",
        blurb: "A 30-second window into team life.",
        prompt:
          "Create a 30-second recruiting clip about team life at my startup, candid tone, no corporate gloss.",
        gradient: "from-teal-600/60 via-emerald-800/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Event aftermovie",
        blurb: "Wrap a conference day into one rewatchable minute.",
        prompt:
          "Cut a 60-second aftermovie from my event brief: arrival, talks, crowd energy, closing card.",
        gradient: "from-orange-700/60 via-amber-800/40 to-stone-900",
      },
      {
        title: "Docs teaser",
        blurb: "A 20-second nudge toward your documentation.",
        prompt:
          "Make a 20-second teaser that walks developers from landing page to first API call, terminal aesthetic.",
        gradient: "from-stone-500/60 via-stone-700/40 to-stone-900",
        pattern: "grid",
      },
    ],
  },
  {
    id: "explainer",
    label: "Explainer Videos",
    cards: [
      {
        title: "How compound interest works",
        blurb: "Growing bars and a timeline that pays you back.",
        prompt:
          "Make a 60-second explainer on how compound interest works, growing bars, one clear analogy, calm narration-free type.",
        gradient: "from-lime-600/60 via-emerald-700/40 to-stone-900",
      },
      {
        title: "Your product in one minute",
        blurb: "Problem, twist, fix — with your UI in motion.",
        prompt:
          "Explain my product in 60 seconds: the problem, why old ways fail, and the fix — with animated UI moments.",
        gradient: "from-amber-500/70 via-orange-700/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Data story with three charts",
        blurb: "Numbers that move instead of sit.",
        prompt:
          "Turn my three statistics into a 45-second animated data story with counters and one takeaway line.",
        gradient: "from-teal-700/60 via-emerald-800/40 to-stone-900",
        pattern: "grid",
      },
      {
        title: "Comparison, side by side",
        blurb: "Two options, one honest verdict.",
        prompt:
          "Make a 40-second side-by-side comparison of the two options in my brief, ending with an honest verdict.",
        gradient: "from-violet-800/60 via-purple-900/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Process, step by step",
        blurb: "A workflow that draws itself.",
        prompt:
          "Animate my five-step process as a 50-second explainer where each step draws itself in sequence.",
        gradient: "from-stone-400/50 via-stone-600/40 to-stone-900",
      },
    ],
  },
  {
    id: "animation",
    label: "Animation",
    cards: [
      {
        title: "Character introduction",
        blurb: "A mascot's first five seconds on screen.",
        prompt:
          "Animate a 15-second introduction for my mascot character: reveal, one signature move, freeze-frame end.",
        gradient: "from-rose-600/60 via-red-800/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Stop-motion paper city",
        blurb: "Hand-crafted feel, frame-by-frame charm.",
        prompt:
          "Create a 30-second stop-motion style animation of a paper city waking up, tactile textures, gentle pacing.",
        gradient: "from-teal-700/60 via-emerald-800/40 to-stone-900",
        pattern: "grid",
      },
      {
        title: "Whiteboard walkthrough",
        blurb: "Idea sketching at a steady hand's speed.",
        prompt:
          "Make a 45-second whiteboard-style walkthrough of my concept, sketch lines that finish as the voice lands.",
        gradient: "from-stone-400/50 via-stone-600/40 to-stone-900",
      },
      {
        title: "Collage explainer",
        blurb: "Cutouts that assemble into a story.",
        prompt:
          "Build a 35-second collage animation where newspaper cutouts assemble into my product story.",
        gradient: "from-amber-600/70 via-yellow-700/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Type in motion",
        blurb: "One sentence, choreographed.",
        prompt:
          "Choreograph a 20-second kinetic type piece around one sentence from my brief, rhythm-led, high contrast.",
        gradient: "from-fuchsia-700/50 via-purple-900/40 to-stone-900",
      },
    ],
  },
  {
    id: "story",
    label: "Story & Film",
    cards: [
      {
        title: "The last shift",
        blurb: "A 60-second cinematic short, no dialogue.",
        prompt:
          "Write and storyboard a 60-second cinematic short about a lighthouse keeper's last night on the job, no dialogue.",
        gradient: "from-teal-800/60 via-slate-800/50 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Market at dawn",
        blurb: "A documentary vignette with ambient sound.",
        prompt:
          "Create a 50-second documentary-style vignette of a market waking at dawn, ambient bed, observed not narrated.",
        gradient: "from-orange-700/60 via-amber-800/40 to-stone-900",
      },
      {
        title: "Scene previsualization",
        blurb: "Test the pacing before the expensive day.",
        prompt:
          "Pre-visualize my scene as a 30-second animatic: blocking, camera moves, and timing beats only.",
        gradient: "from-stone-500/60 via-stone-700/40 to-stone-900",
        pattern: "grid",
      },
      {
        title: "Title sequence",
        blurb: "A cold open that sets the tone.",
        prompt:
          "Design a 20-second title sequence for my project: mood-setting shots, restrained type, final card.",
        gradient: "from-rose-800/60 via-red-900/40 to-stone-900",
        pattern: "dots",
      },
    ],
  },
  {
    id: "ads",
    label: "Ads & UGC",
    cards: [
      {
        title: "Feature showdown",
        blurb: "Two tiers, one animated comparison.",
        prompt:
          "Make a 25-second ad comparing my two subscription tiers with animated callouts and a single closing hook.",
        gradient: "from-violet-800/60 via-purple-900/40 to-stone-900",
      },
      {
        title: "Unboxing, handheld",
        blurb: "First-person feel, honest reactions.",
        prompt:
          "Create an 18-second UGC unboxing for my product: handheld camera, honest first reaction, logo end card.",
        gradient: "from-amber-500/60 via-orange-700/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Testimonial-style spot",
        blurb: "One customer story, plainly told.",
        prompt:
          "Cut a 30-second testimonial-style ad from my customer's quote: their words, plain type, product b-roll.",
        gradient: "from-teal-700/60 via-emerald-900/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Retargeting bites",
        blurb: "Six-second reminders for the almost-converted.",
        prompt:
          "Make three 6-second retargeting ads from my product's strongest single benefit, one message each.",
        gradient: "from-rose-600/60 via-red-800/40 to-stone-900",
      },
      {
        title: "Launch-week push",
        blurb: "A countdown cadence across platforms.",
        prompt:
          "Plan a launch-week ad set: one 20-second hero and two 8-second teasers, consistent style, different hooks.",
        gradient: "from-lime-600/60 via-emerald-700/40 to-stone-900",
        pattern: "grid",
      },
    ],
  },
  {
    id: "social",
    label: "Social Media",
    cards: [
      {
        title: "On-beat text pops",
        blurb: "Vertical cuts cut to the beat.",
        prompt:
          "Make a 12-second vertical with on-beat text pops for my track, sharp cuts, captions locked to rhythm.",
        gradient: "from-teal-600/60 via-emerald-900/40 to-stone-900",
      },
      {
        title: "Carousel to motion",
        blurb: "A static set becomes a scrolling teaser.",
        prompt:
          "Turn my five-slide carousel into a 15-second scrolling teaser with slide-in transitions.",
        gradient: "from-amber-600/60 via-yellow-800/40 to-stone-900",
        pattern: "lines",
      },
      {
        title: "Quote card series",
        blurb: "Typography-first, subtle drift.",
        prompt:
          "Create a series of three 8-second quote cards from my article, subtle drift, consistent type system.",
        gradient: "from-stone-400/50 via-stone-600/40 to-stone-900",
        pattern: "dots",
      },
      {
        title: "Story sequence",
        blurb: "Three frames that hold together.",
        prompt:
          "Design a three-part story sequence for my announcement: tease, reveal, CTA — 10 seconds each.",
        gradient: "from-fuchsia-700/50 via-rose-900/40 to-stone-900",
      },
      {
        title: "Reply-bait question",
        blurb: "One question, one comment section.",
        prompt:
          "Make a 10-second vertical that opens with a question and ends on my product, tuned for comments.",
        gradient: "from-violet-800/60 via-purple-900/40 to-stone-900",
        pattern: "grid",
      },
    ],
  },
];

export interface TemplateField {
  id: string;
  label: string;
  placeholder: string;
  optional: boolean;
}

/** The ~30s promo template fields (composer template card). */
export const TEMPLATE_FIELDS: TemplateField[] = [
  {
    id: "productUrl",
    label: "Product URL",
    placeholder: "https://your-product-page.example",
    optional: true,
  },
  {
    id: "product",
    label: "Product",
    placeholder: "What you're selling, in a sentence",
    optional: false,
  },
  {
    id: "features",
    label: "Key features",
    placeholder: "The three points the video must hit",
    optional: false,
  },
  {
    id: "visuals",
    label: "Visuals",
    placeholder: "Look and feel — palette, motion, mood",
    optional: false,
  },
  {
    id: "brand",
    label: "Brand",
    placeholder: "Brand name, voice, and any assets (optional)",
    optional: true,
  },
];

export interface ConfirmPolicyOption {
  value: "large_costs" | "always" | "never";
  label: string;
  hint: string;
}

export const CONFIRM_POLICIES: ConfirmPolicyOption[] = [
  {
    value: "large_costs",
    label: "Ask before: Large costs",
    hint: "Confirm only before expensive steps like renders",
  },
  {
    value: "always",
    label: "Always",
    hint: "Confirm before every stage that spends credits",
  },
  {
    value: "never",
    label: "Never",
    hint: "Run every stage without asking",
  },
];

/** Editing guidance shown under the first plan turn in a project. */
export const GUIDANCE: string[] = [
  "Reply in plain words — a note like a warmer palette or a slower middle is a complete revision.",
  "The agent waits for your explicit go before spending render credits.",
  "Attach references any time: a link, a document, an image, audio, or footage.",
  "If a delivery misses, use Mark to fix — it sends the video straight back to preview.",
];

/* ---------------------------------------------------------------- login -- */

export const LOGIN = {
  h1: "Welcome back",
  subhead: "Sign in to open your workspace and keep the conversation going.",
  googleCta: "Continue with Google",
  divider: "or",
  demoCta: "Try a demo session",
  demoHint:
    "Each demo session is an isolated sandbox — your own projects and 100 credits, no real Google account involved. Unused sandboxes are cleaned up after a week.",
  note: "By continuing you agree to the Terms of Service and acknowledge the Privacy Policy.",
};

/* --------------------------------------------------------------- footer -- */

export const FOOTER_SOCIALS: { label: string; href: string }[] = [
  { label: "Discord", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "TikTok", href: "#" },
  { label: "YouTube", href: "#" },
];

export const FOOTER_LEGAL: { label: string; href: string }[] = [
  { label: "Terms of Service", href: "#" },
  { label: "Privacy Policy", href: "#" },
];

export const FOOTER_SECTIONS: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "AI Video Agent", href: "/video-agent" },
      { label: "Pricing", href: "/pricing" },
      { label: "Skills", href: "/skills" },
      { label: "Get Started", href: "/login" },
    ],
  },
  {
    title: "Use cases",
    links: [
      { label: "E-commerce ads", href: "/#categories" },
      { label: "Explainers", href: "/#categories" },
      { label: "Social media", href: "/#categories" },
      { label: "Filmmaking", href: "/#categories" },
    ],
  },
  {
    title: "Models",
    links: [
      { label: "Seedance", href: "/#models" },
      { label: "Kling AI 3.0", href: "/#models" },
      { label: "GPT-Image 2", href: "/#models" },
      { label: "Veo", href: "/#models" },
    ],
  },
];

export const LANGUAGES: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];
