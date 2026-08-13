import { buildDefaultDark, buildMidnight, mix, panelGradient, toTheme } from "./theme-utils";

export type Theme = "dark" | "light" | "ash" | "onyx" | "midnight";

export interface ThemeColors {
  bg: string;
  surface: string;
  panel: string;
  elevated: string;
  hover: string;
  active: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentHover: string;
  banner: string;
  online?: string;
  idle?: string;
  dnd?: string;
}

export interface ThemeDefinition {
  id: Theme;
  labelTr: string;
  labelEn: string;
  preview: [string, string];
  colors: ThemeColors;
}

export const THEMES: ThemeDefinition[] = [
  toTheme("midnight", "Midnight", "Midnight", ["#101216", "#16181d"], buildMidnight()),
  toTheme("dark", "Koyu", "Dark", ["#1e1f22", "#313338"], buildDefaultDark()),
  toTheme("light", "Açık", "Light", ["#ffffff", "#e3e5e8"], {
    bg: "#ebedef",
    surface: "#e3e5e8",
    panel: "#f2f3f5",
    elevated: "#dcddde",
    hover: "#d4d7dc",
    active: "#c4c9cf",
    border: "#d1d5db",
    text: "#060607",
    muted: "#5c6370",
    accent: "#5865f2",
    accentHover: "#4752c4",
    banner: "#e8a0b0",
  }),
  toTheme("ash", "Kül", "Ash", ["#3a3d42", "#4a4e56"], {
    bg: "#313338",
    surface: "#2b2d31",
    panel: "#383a40",
    elevated: "#404249",
    hover: "#4a4d55",
    active: "#555860",
    border: "#4e5058",
    text: "#f2f3f5",
    muted: "#b5bac1",
    accent: "#00a8fc",
    accentHover: "#0090d9",
    banner: "#7a8494",
  }),
  toTheme("onyx", "Oniks", "Onyx", ["#050505", "#121212"], {
    bg: "#0a0a0a",
    surface: "#050505",
    panel: "#101010",
    elevated: "#181818",
    hover: "#222222",
    active: "#2c2c2c",
    border: "#1f1f1f",
    text: "#f2f3f5",
    muted: "#8b8b8b",
    accent: "#5865f2",
    accentHover: "#4752c4",
    banner: "#3c3c3c",
  }),
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id: string): ThemeDefinition {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]!;
}

export function isValidTheme(id: string): id is Theme {
  return THEME_IDS.includes(id as Theme);
}

export function applyTheme(themeId: string) {
  const theme = getTheme(themeId);
  const root = document.documentElement;
  root.dataset.theme = theme.id;
  const c = theme.colors;

  root.style.setProperty("--color-hiqu-bg", c.bg);
  root.style.setProperty("--color-hiqu-surface", c.surface);
  root.style.setProperty("--color-hiqu-panel", c.panel);
  root.style.setProperty("--color-hiqu-elevated", c.elevated);
  root.style.setProperty("--color-hiqu-hover", c.hover);
  root.style.setProperty("--color-hiqu-active", c.active);
  root.style.setProperty("--color-hiqu-border", c.border);
  root.style.setProperty("--color-hiqu-text", c.text);
  root.style.setProperty("--color-hiqu-muted", c.muted);
  root.style.setProperty("--color-hiqu-accent", c.accent);
  root.style.setProperty("--color-hiqu-accent-hover", c.accentHover);
  root.style.setProperty("--color-hiqu-banner", c.banner);
  root.style.setProperty("--color-hiqu-online", c.online ?? "#23a559");
  root.style.setProperty("--color-hiqu-idle", c.idle ?? "#f0b232");
  root.style.setProperty("--color-hiqu-dnd", c.dnd ?? "#f23f43");
  root.style.setProperty(
    "--color-hiqu-panel-gradient",
    theme.id === "midnight" ? "none" : panelGradient(c.panel),
  );
  root.style.setProperty("--color-hiqu-input-bg", mix(c.panel, "#000000", 0.25));
  root.style.setProperty("--color-hiqu-main-input", mix(c.bg, "#000000", 0.2));
  root.style.setProperty("--color-hiqu-user-panel", mix(c.panel, "#000000", 0.15));
  root.style.setProperty(
    "--color-hiqu-chat-input-bg",
    theme.id === "midnight" ? "rgba(35, 38, 44, 0.92)" : mix(c.elevated, "#ffffff", 0.04),
  );
  root.style.setProperty(
    "--color-hiqu-chat-input-border",
    theme.id === "midnight" ? "rgba(255, 255, 255, 0.12)" : c.border,
  );
  root.style.setProperty(
    "--color-hiqu-icon-muted",
    theme.id === "midnight" ? "#b4bcc8" : c.muted,
  );
  root.style.setProperty(
    "--color-hiqu-reply-highlight",
    theme.id === "midnight" ? "rgba(90, 163, 201, 0.1)" : "rgba(88, 101, 242, 0.08)",
  );
  root.style.setProperty(
    "--color-hiqu-reply-highlight-hover",
    theme.id === "midnight" ? "rgba(90, 163, 201, 0.14)" : "rgba(88, 101, 242, 0.12)",
  );
  root.style.setProperty("--color-hiqu-message-hover", theme.id === "midnight" ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.03)");
}
