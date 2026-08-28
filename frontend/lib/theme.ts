export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  isLight: boolean;
  textColorPrimary: string;
  textColorSecondary: string;
  borderColor: string;
  goldColor: string;
  goldBorder: string;
  goldBorderStrong: string;
  goldBgSoft: string;
  goldBgMedium: string;
  headerBg: string;
  headerBorder: string;
  sidebarBg: string;
  tabSwitcherBg: string;
}

export const LIGHT_COLORS: ThemeColors = {
  isLight: true,
  textColorPrimary: "#0F172A",
  textColorSecondary: "#334155",
  borderColor: "rgba(0, 0, 0, 0.08)",
  goldColor: "#8A6A15",
  goldBorder: "rgba(184, 147, 36, 0.3)",
  goldBorderStrong: "rgba(184, 147, 36, 0.5)",
  goldBgSoft: "rgba(184, 147, 36, 0.08)",
  goldBgMedium: "rgba(184, 147, 36, 0.12)",
  headerBg: "#FFFFFF",
  headerBorder: "rgba(212,175,55,0.4)",
  sidebarBg: "#F8FAFC",
  tabSwitcherBg: "rgba(0, 0, 0, 0.02)",
};

export const DARK_COLORS: ThemeColors = {
  isLight: false,
  textColorPrimary: "#F8FAFC",
  textColorSecondary: "#94A3B8",
  borderColor: "rgba(255, 255, 255, 0.08)",
  goldColor: "#D4AF37",
  goldBorder: "rgba(212, 175, 55, 0.3)",
  goldBorderStrong: "rgba(212, 175, 55, 0.5)",
  goldBgSoft: "rgba(212, 175, 55, 0.12)",
  goldBgMedium: "rgba(212, 175, 55, 0.15)",
  headerBg: "#0B0F19",
  headerBorder: "rgba(212,175,55,0.3)",
  sidebarBg: "#111625",
  tabSwitcherBg: "rgba(255,255,255,0.02)",
};

export function getThemeColors(theme: ThemeMode): ThemeColors {
  return theme === "light" ? LIGHT_COLORS : DARK_COLORS;
}
