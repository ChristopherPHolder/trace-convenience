import type { FlameChartCategory } from "./types";

/**
 * The colours the DevTools Performance panel gives each category in its light
 * theme: the `--app-color-*` tokens of devtools-frontend, resolved to hex.
 */
const CATEGORY_COLORS: Readonly<Record<FlameChartCategory, string>> = {
  loading: "#7cacf8",
  scripting: "#facc15",
  rendering: "#d190ff",
  painting: "#37be5f",
  messaging: "#38b9de",
  system: "#c7c7c7",
  idle: "#e3e3e3",
  async: "#e46962",
};

/** A JavaScript frame whose script has no URL, such as an inline or evaluated script. */
const NO_URL_COLOR = "#f2ecdc";

export function categoryColor(category: FlameChartCategory): string {
  return CATEGORY_COLORS[category];
}

const scriptColors = new Map<string, string>();

/**
 * The colour of a JavaScript frame. DevTools hashes the script URL, so every
 * frame from one file shares a pastel colour and neighbouring files differ.
 */
export function scriptColor(url: string): string {
  if (url === "") return NO_URL_COLOR;

  let color = scriptColors.get(url);
  if (color === undefined) {
    const hash = hashCode(url);
    const hue = 30 + Math.floor(((hash % 300) / 299) * 300);
    const saturation = 50 + Math.floor((((hash >> 8) % 3) / 2) * 30);
    color = hslToHex(hue, saturation, 85);
    scriptColors.set(url, color);
  }
  return color;
}

/** The string hash DevTools uses (`Platform.StringUtilities.hashCode`), so colours match. */
export function hashCode(text: string): number {
  if (text === "") return 0;
  const p = (1 << 30) * 4 - 5; // prime: 2^32 - 5
  const z = 0x5033d967;
  const z2 = 0x59d2f15d;
  let s = 0;
  let zi = 1;
  for (let i = 0; i < text.length; i++) {
    const xi = text.charCodeAt(i) * z2;
    s = (s + zi * xi) % p;
    zi = (zi * z) % p;
  }
  s = (s + zi * (p - 1)) % p;
  return Math.abs(s | 0);
}

/** Hex is the one colour syntax every SVG renderer reads. */
function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = s * Math.min(l, 1 - l);
  const channel = (n: number): string => {
    const k = (n + hue / 30) % 12;
    const value = l - chroma * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
