"use client";

// components/DetailGallery.tsx
// Grid galeri foto untuk halaman detail (/cagar-budaya/[slug]) — server
// component tidak bisa memegang state, jadi grid + lightbox dibungkus di sini.

import { useState } from "react";
import SmartImage from "./SmartImage";
import Lightbox, { type LightboxItem } from "./Lightbox";

interface DetailGalleryProps {
  items: LightboxItem[];
  borderColor: string;
  textColorSecondary: string;
}

export default function DetailGallery({ items, borderColor, textColorSecondary }: DetailGalleryProps) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div
        className="detail-page-gallery-grid"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}
      >
        {items.map((item, i) => (
          <figure key={`${item.src}-${i}`} style={{ margin: 0, overflow: "hidden", borderRadius: "8px" }}>
            <button
              type="button"
              className="gallery-thumb-btn"
              aria-label={`Perbesar foto ${i + 1}`}
              onClick={() => setIndex(i)}
            >
              <SmartImage
                src={item.src}
                alt={item.alt}
                className="gallery-image"
                width={640}
                height={480}
                sizes="(min-width: 1080px) 240px, 50vw"
                fallbackBackground="#111625"
                style={{
                  width: "100%",
                  aspectRatio: "4 / 3",
                  objectFit: "cover",
                  display: "block",
                  border: `1px solid ${borderColor}`,
                }}
              />
            </button>
            {item.caption && (
              <figcaption style={{ marginTop: "6px", fontSize: "11px", color: textColorSecondary, lineHeight: 1.4 }}>
                {item.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      <Lightbox items={items} index={index} onClose={() => setIndex(null)} onNavigate={setIndex} />
    </>
  );
}