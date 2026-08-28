"use client";

// components/ShareButton.tsx
// Tombol bagikan universal:
// 1. Web Share API (mobile / browser dengan share sheet)
// 2. Fallback: salin tautan ke clipboard + umpan balik "✓ Tautan disalin"
// URL default = halaman saat ini (dibaca saat klik, aman untuk SSR).

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

interface ShareButtonProps {
  title: string;
  text?: string;
  /** URL yang dibagikan; kosong = URL halaman saat ini */
  url?: string;
  label?: string;
  style?: CSSProperties;
  className?: string;
}

type ShareStatus = "idle" | "copied" | "failed";

export default function ShareButton({
  title,
  text,
  url,
  label = "📤 Bagikan",
  style,
  className,
}: ShareButtonProps) {
  const [status, setStatus] = useState<ShareStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan timer feedback saat komponen unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flash = (s: Exclude<ShareStatus, "idle">) => {
    setStatus(s);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setStatus("idle"), 2200);
  };

  const handleShare = async () => {
    const shareUrl =
      url || (typeof window !== "undefined" ? window.location.href : "");
    const nav = typeof navigator !== "undefined" ? navigator : undefined;

    if (nav?.share) {
      try {
        await nav.share({ title, text: text ?? title, url: shareUrl });
        return;
      } catch (err) {
        // Pengguna menutup share sheet — jangan dianggap galat
        if ((err as DOMException)?.name === "AbortError") return;
        // Gagal lain → lanjut ke fallback salin tautan
      }
    }

    try {
      if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(shareUrl);
        flash("copied");
        return;
      }
      throw new Error("clipboard unavailable");
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = shareUrl;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        flash(ok ? "copied" : "failed");
      } catch {
        flash("failed");
      }
    }
  };

  const content =
    status === "copied"
      ? "✓ Tautan disalin"
      : status === "failed"
      ? "⚠ Gagal menyalin"
      : label;

  return (
    <button
      type="button"
      onClick={handleShare}
      className={className}
      aria-live="polite"
      style={{
        cursor: "pointer",
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 12,
        fontWeight: 800,
        textDecoration: "none",
        transition: "all 0.2s",
        ...style,
      }}
    >
      {content}
    </button>
  );
}