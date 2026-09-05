"use client";

import NextImage from "next/image";
import { useState, type CSSProperties } from "react";
import { isOptimizableImageUrl } from "../lib/api";

interface SiteThumbnailProps {
  src?: string | null;
  style?: CSSProperties;
}

// Thumbnail kartu situs — ukuran visual tetap ditentukan pemakai (mis. 68×68).
// Dua tujuan:
//  1. Tidak pernah menampilkan broken image & layout tetap rapi (placeholder
//     netral "Foto tidak tersedia" saat src null/empty/invalid/gagal dimuat).
//  2. Bandwidth hemat: lewat next/image, browser hanya mengunduh varian kecil
//     (intrinsic 136px = 2× box 68×68, crisp di retina) — bukan file asli yang
//     bisa 200+ KB. `loading="lazy"` membuat thumbnail di luar viewport (mis.
//     list mobile yang tersembunyi di bawah sheet / di bawah guliran sidebar)
//     tidak diunduh sampai benar-benar perlu. Box 68×68 di-reserve oleh
//     width/height/style sehingga tidak ada layout shift.
export default function SiteThumbnail({ src, style }: SiteThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !src || failed;
  const optimizable = !!src && !failed && isOptimizableImageUrl(src);
  const visibleSrc = src ?? undefined;

  return (
    <div
      style={{
        ...style,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {showPlaceholder ? (
        <div
          role="img"
          aria-label="Foto tidak tersedia"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "3px",
            padding: "4px",
            textAlign: "center",
            width: "100%",
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }} aria-hidden="true">🏛️</span>
          <span
            style={{
              fontSize: 7.5,
              lineHeight: 1.15,
              opacity: 0.55,
              fontWeight: 600,
              letterSpacing: "0.2px",
            }}
          >
            Foto tidak tersedia
          </span>
        </div>
      ) : optimizable ? (
        <NextImage
          src={visibleSrc as string}
          alt=""
          width={136}
          height={136}
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <img
          src={visibleSrc}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      )}
    </div>
  );
}