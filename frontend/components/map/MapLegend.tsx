"use client";

import { useState, type CSSProperties } from "react";
import { categories, Category } from "../../data/sites";

export default function MapLegend() {
  const [legendExpanded, setLegendExpanded] = useState(false);

  return (
    <div className={`map-legend ${legendExpanded ? "open" : ""}`}>
      <button
        type="button"
        onClick={() => setLegendExpanded((v) => !v)}
        aria-expanded={legendExpanded}
        aria-controls="map-legend-items"
        style={{
          fontWeight: 800,
          color: "var(--legend-accent)",
          letterSpacing: "0.1em",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          userSelect: "none",
          width: "100%",
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "inherit",
          fontSize: "inherit",
        }}
      >
        <span>LEGENDA</span>
        <span
          className={`map-legend-chevron ${legendExpanded ? "open" : ""}`}
          style={{ fontSize: "10px", opacity: 0.7 }}
          aria-hidden="true"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      <div id="map-legend-items" className="map-legend-items">
        {(Object.keys(categories) as Category[]).map((key, index) => {
          const item = categories[key];
          return (
            <div
              key={key}
              className="map-legend-item"
              style={{ animationDelay: `${0.05 + index * 0.06}s` }}
            >
              <span
                className="map-legend-pin"
                style={
                  {
                    "--marker-color": item.color,
                    animationDelay: `${0.05 + index * 0.06}s`,
                  } as CSSProperties
                }
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span style={{ color: "var(--legend-text)", fontWeight: 600 }}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
