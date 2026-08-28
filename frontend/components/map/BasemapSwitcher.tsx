"use client";

import type { MapTheme } from "../../lib/sitePopup";

interface BasemapSwitcherProps {
  theme: MapTheme;
  onThemeChange: (theme: MapTheme) => void;
}

function SunIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SatelliteIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 7 9 3 5 7l4 4" />
      <path d="m17 11 4 4-4 4-4-4" />
      <path d="m8 12 4 4 6-6-4-4Z" />
      <path d="m16 8 3-3" />
      <path d="M9 21a6 6 0 0 0-6-6" />
    </svg>
  );
}

const BASEMAPS: { value: MapTheme; label: string; icon: (size?: number) => React.ReactNode }[] = [
  { value: "light", label: "Terang", icon: (s) => <SunIcon size={s} /> },
  { value: "dark", label: "Gelap", icon: (s) => <MoonIcon size={s} /> },
  { value: "satellite", label: "Satelit", icon: (s) => <SatelliteIcon size={s} /> },
];

export default function BasemapSwitcher({ theme, onThemeChange }: BasemapSwitcherProps) {
  const isDark = theme === "dark";
  const isSatellite = theme === "satellite";

  const containerBg = isDark
    ? "rgba(11, 15, 25, 0.85)"
    : isSatellite
      ? "rgba(11, 15, 25, 0.7)"
      : "rgba(255, 255, 255, 0.92)";
  const containerBorder = "rgba(212, 175, 55, 0.35)";
  const idleColor = isDark || isSatellite ? "#94A3B8" : "#475569";

  return (
    <div
      style={{
        position: "absolute",
        top: "14px",
        left: "14px",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: containerBg,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: `1px solid ${containerBorder}`,
        borderRadius: "12px",
        padding: "4px",
        boxShadow: "0 6px 24px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255,255,255,0.04) inset",
      }}
    >
      {BASEMAPS.map((basemap) => {
        const isActive = theme === basemap.value;
        return (
          <button
            key={basemap.value}
            onClick={() => onThemeChange(basemap.value)}
            title={`Mode ${basemap.label}`}
            aria-pressed={isActive}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 10px",
              borderRadius: "8px",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.01em",
              cursor: "pointer",
              border: "none",
              background: isActive ? "#D4AF37" : "transparent",
              color: isActive ? "#0B0F19" : idleColor,
              fontFamily: "inherit",
              transition: "background 0.2s ease, color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
              boxShadow: isActive ? "0 2px 10px rgba(212, 175, 55, 0.45)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark || isSatellite ? "rgba(255,255,255,0.1)" : "rgba(184, 147, 36, 0.1)";
                e.currentTarget.style.color = "#D4AF37";
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = idleColor;
              }
            }}
          >
            {basemap.icon(isActive ? 14 : 15)}
            <span style={{ whiteSpace: "nowrap" }}>{basemap.label}</span>
          </button>
        );
      })}
    </div>
  );
}
