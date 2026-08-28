"use client";

import type { Category } from "../../data/sites";

const ICON_PATHS: Record<Category, string> = {
  bangunan:
    `<path d="M3 21h18M5 21V9l7-5 7 5v12M9 10v4M12 10v4M15 10v4"/>`,
  situs:
    `<path d="M12 21.5s-6.5-5.4-6.5-10.4a6.5 6.5 0 1 1 13 0c0 5-6.5 10.4-6.5 10.4z"/><circle cx="12" cy="11" r="2.4"/>`,
  struktur:
    `<path d="M2 20 2 8 6 5 10 8 10 20"/><path d="M6 12 6 20"/><path d="M14 5 18 8 22 8 22 20 18 20"/><path d="M18 12 18 20"/>`,
  kawasan:
    `<circle cx="16.5" cy="6" r="2"/><path d="M2.5 18.5l4.5-6.5 3 4 3.5-5 3.5 4.5 3-4.5M3 21.5h18"/>`,
  benda:
    `<circle cx="12" cy="12" r="8.5"/><rect x="9" y="9" width="6" height="6" rx="1"/>`,
};

export function categoryIconSvg(category: Category, size = 16, color?: string): string {
  const colorAttr = color ? ` color="${color}"` : "";
  return (
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${colorAttr} aria-hidden="true">` +
    ICON_PATHS[category] +
    `</svg>`
  );
}

interface CategoryIconProps {
  category: Category;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CategoryIcon({ category, size = 16, color, className, style }: CategoryIconProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        color,
        flexShrink: 0,
        ...style,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: ICON_PATHS[category] }}
      />
    </span>
  );
}
