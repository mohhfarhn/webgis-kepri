import type { Site } from "../data/sites";

type Status = Site["status"];

const STATUS_TEXT: Record<Status, { light: string; dark: string }> = {
  Ditetapkan: { light: "#16A34A", dark: "#4ADE80" },
  Didaftarkan: { light: "#D97706", dark: "#F59E0B" },
  Usulan: { light: "#475569", dark: "#94A3B8" },
};

const STATUS_BG: Record<Status, { light: string; dark: string }> = {
  Ditetapkan: { light: "rgba(22, 163, 74, 0.1)", dark: "rgba(74, 222, 128, 0.15)" },
  Didaftarkan: { light: "rgba(217, 119, 6, 0.08)", dark: "rgba(245, 158, 11, 0.15)" },
  Usulan: { light: "rgba(71, 85, 105, 0.08)", dark: "rgba(148, 163, 184, 0.15)" },
};

export function getStatusColorText(status: Status, isLight: boolean): string {
  return STATUS_TEXT[status][isLight ? "light" : "dark"];
}

export function getStatusColorBg(status: Status, isLight: boolean): string {
  return STATUS_BG[status][isLight ? "light" : "dark"];
}

export const TINGKAT_LABEL: Record<string, string> = {
  NASIONAL: "Nasional",
  PROVINSI: "Provinsi",
  KABUPATEN: "Kabupaten/Kota",
};
