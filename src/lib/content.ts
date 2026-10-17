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

/* ---------------------------------------------------------------- login -- */

export const LOGIN = {
  h1: "Welcome back",
  subhead: "Sign in to open your workspace and keep the conversation going.",
  googleCta: "Continue with Google",
  divider: "or",
  demoCta: "Try a demo session",
  demoHint: "Demo sessions are local-only: same journey, nothing persisted to a real account.",
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
