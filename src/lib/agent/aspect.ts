/**
 * Aspect-ratio resolution (honesty pass).
 *
 * The PLAN stage negotiates an "Aspect ratio" default with the user, and the
 * user can override it at any later turn ("make it vertical", "9:16 please").
 * The generation engines must honor that agreement: this module scans the
 * conversation for the newest explicit aspect mention and maps it to sizes
 * the image/video models actually accept (verified against the live APIs):
 *
 *   wan2.2-t2i-flash (image): 1344*768 · 768*1344 · 1024*1024 · 1152*864 ·
 *                             864*1152 · 1440*720 · 720*1440
 *   wan2.1-t2v-turbo (video): 1280*720 · 720*1280 · 960*960
 */

export type Aspect =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:3"
  | "3:4"
  | "4:5"
  | "5:4"
  | "2:1"
  | "1:2"
  | "21:9";

export const DEFAULT_ASPECT: Aspect = "16:9";

/* Ratio notations the conversation may contain, longest-first so that
   "16:9" is not eaten by a looser pattern. */
const RATIO_RE =
  /\b(9:16|16:9|1:1|4:5|5:4|4:3|3:4|2:1|1:2|21:9)\b/i;
const WORD_RE =
  /\b(vertical|portrait|9 by 16|9x16)\b|\b(horizontal|landscape|widescreen|letterboxed?|cinemascope|16 by 9|16x9)\b|\b(square)\b/i;

/** Map one free-text mention to an aspect, or null when it says nothing. */
export function aspectFromText(text: string): Aspect | null {
  const ratio = text.match(RATIO_RE);
  if (ratio) return normalizeRatio(ratio[1]);

  const words = text.match(WORD_RE);
  if (words) {
    const w = words[1] ?? words[2] ?? words[3];
    if (w) return normalizeRatio(w);
  }
  return null;
}

function normalizeRatio(token: string): Aspect {
  const t = token.toLowerCase();
  switch (t) {
    case "9:16":
    case "vertical":
    case "portrait":
    case "9 by 16":
    case "9x16":
      return "9:16";
    case "1:1":
    case "square":
      return "1:1";
    case "4:5":
      return "4:5";
    case "5:4":
      return "5:4";
    case "4:3":
      return "4:3";
    case "3:4":
      return "3:4";
    case "2:1":
      return "2:1";
    case "1:2":
      return "1:2";
    case "21:9":
      return "21:9";
    default:
      // horizontal | landscape | widescreen | letterbox | cinemascope | 16 by 9 | 16x9
      return "16:9";
  }
}

/* ------------------------------------------------------------------ */
/* Model size tables (verified against the live DashScope API)          */
/* ------------------------------------------------------------------ */

const IMAGE_SIZES: Record<Aspect, string> = {
  "16:9": "1344*768",
  "9:16": "768*1344",
  "1:1": "1024*1024",
  "4:3": "1152*864",
  "3:4": "864*1152",
  "4:5": "864*1152",
  "5:4": "1152*864",
  "2:1": "1440*720",
  "1:2": "720*1440",
  "21:9": "1440*720",
};

/* The video model accepts only these three. Other aspects map to the
   closest one — the delivery note always reports the real resolution. */
const VIDEO_SIZES: Record<Aspect, string> = {
  "16:9": "1280*720",
  "21:9": "1280*720",
  "2:1": "1280*720",
  "9:16": "720*1280",
  "1:2": "720*1280",
  "1:1": "960*960",
  "4:3": "960*960",
  "3:4": "960*960",
  "4:5": "960*960",
  "5:4": "960*960",
};

function closestVideoAspect(aspect: Aspect): Aspect {
  return (Object.keys(VIDEO_SIZES) as Aspect[]).includes(aspect)
    ? aspect
    : DEFAULT_ASPECT;
}

/** Image size string ("W*H") for the DashScope text-to-image task. */
export function imageSizeFor(aspect: string): string {
  return IMAGE_SIZES[aspect as Aspect] ?? IMAGE_SIZES[DEFAULT_ASPECT];
}

/** Video size string ("W*H") for the DashScope video-synthesis task. */
export function videoSizeFor(aspect: string): string {
  return VIDEO_SIZES[aspect as Aspect] ?? VIDEO_SIZES[DEFAULT_ASPECT];
}

/** Video size as "WxH" for the z-ai sandbox SDK. */
export function videoSdkSizeFor(aspect: string): string {
  return videoSizeFor(aspect).replace("*", "x");
}

/** ffmpeg pad/scale target as [width, height]. */
export function ffmpegTargetFor(aspect: string): { width: number; height: number } {
  const a = closestVideoAspect((aspect as Aspect) ?? DEFAULT_ASPECT);
  const size = VIDEO_SIZES[a].split("*").map(Number) as [number, number];
  return { width: size[0], height: size[1] };
}
