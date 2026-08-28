"use client";

import NextImage, { type ImageProps } from "next/image";
import { useEffect, useState, type CSSProperties } from "react";

type SmartImageProps = Omit<ImageProps, "src" | "alt" | "onError"> & {
  src?: string | null;
  alt: string;
  fallbackBackground?: string;
};

// Menahan gambar lama tetap tampil sampai gambar baru selesai dimuat,
// agar tidak terjadi flash/kedip saat berganti konten (mis. pindah situs).
// Memakai next/image (lazy loading + optimasi) dan menampilkan placeholder
// saat gambar gagal dimuat atau src tidak tersedia.
export default function SmartImage({
  src,
  alt,
  className,
  style,
  fallbackBackground,
  fill,
  unoptimized,
  ...rest
}: SmartImageProps) {
  const [displaySrc, setDisplaySrc] = useState<string | null>(src ?? null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!src || src === displaySrc) return;
    const nextImage = new Image();
    nextImage.onload = () => setDisplaySrc(src);
    nextImage.onerror = () => setDisplaySrc(src);
    nextImage.src = src;
  }, [src, displaySrc]);

  if (!src || !displaySrc || failedSrc === displaySrc) {
    const placeholderStyle: CSSProperties = {
      ...(fill
        ? { position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }
        : {}),
      background: fallbackBackground ?? "#E2E8F0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style,
    };
    return (
      <div className={className} style={placeholderStyle} role="img" aria-label={alt}>
        <span style={{ fontSize: "clamp(16px, 5vw, 28px)", opacity: 0.45 }}>🖼️</span>
      </div>
    );
  }

  // URL lokal (object/data URL dari unggahan) tidak bisa dioptimasi oleh server.
  const isLocalPreview = displaySrc.startsWith("blob:") || displaySrc.startsWith("data:");

  return (
    <NextImage
      src={displaySrc}
      alt={alt}
      className={className}
      style={style}
      fill={fill}
      unoptimized={isLocalPreview || unoptimized}
      onError={() => setFailedSrc(displaySrc)}
      {...rest}
    />
  );
}
