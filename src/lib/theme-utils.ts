import type { ThemeColors, ThemeDefinition, Theme } from "./themes";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function mix(hex1: string, hex2: string, weight: number): string {
  const w = clamp(weight, 0, 1);
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return rgbToHex(r1 + (r2 - r1) * w, g1 + (g2 - g1) * w, b1 + (b2 - b1) * w);
}

const DISCORD = {
  main: "#313338",
  sidebar: "#2b2d31",
  rail: "#1e1f22",
  hover: "#35373c",
  active: "#404249",
  border: "#3f4147",
  elevated: "#383a40",
};

export function buildDefaultDark(accent = "#5865f2", accentHover = "#4752c4"): ThemeColors {
  return {
    bg: DISCORD.main,
    surface: DISCORD.rail,
    panel: DISCORD.sidebar,
    elevated: DISCORD.elevated,
    hover: DISCORD.hover,
    active: DISCORD.active,
    border: DISCORD.border,
    text: "#f2f3f5",
    muted: "#949ba4",
    accent,
    accentHover,
    banner: "#c77d8e",
  };
}

/** refact0r/midnight-discord default palette */
export function buildMidnight(): ThemeColors {
  return {
    bg: "#16181d",
    surface: "#101216",
    panel: "#1c1f24",
    elevated: "#23262c",
    hover: "#252930",
    active: "#2a2e36",
    border: "rgba(88, 98, 112, 0.35)",
    text: "#eef1f7",
    muted: "#8a939f",
    accent: "#5aa3c9",
    accentHover: "#4a93b9",
    banner: "#6eb5d9",
    online: "#52b89a",
    idle: "#d4b86a",
    dnd: "#e07070",
  };
}

export function panelGradient(panel: string): string {
  const top = mix(panel, "#ffffff", 0.025);
  const bottom = mix(panel, "#000000", 0.06);
  return `linear-gradient(180deg, ${top} 0%, ${panel} 45%, ${bottom} 100%)`;
}

export function toTheme(
  id: Theme,
  labelTr: string,
  labelEn: string,
  preview: [string, string],
  colors: ThemeColors,
): ThemeDefinition {
  return { id, labelTr, labelEn, preview, colors };
}
