"use client";

// components/Lightbox.tsx
// Galeri foto layar penuh — klik thumbnail untuk memperbesar, navigasi
// prev/next (tombol, keyboard ←/→, swipe di mobile), Esc untuk menutup.
// Dirender via portal ke document.body agar terbebas dari stacking context
// panel detail (transform pada ancestor memaksa fixed jadi relatif).

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import SmartImage from "./SmartImage";

export interface LightboxItem {
  src: string;
  alt: string;
  caption?: string | null;
}

interface LightboxProps {
  items: LightboxItem[];
  /** Index aktif; null = tertutup */
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 3000,
  background: "rgba(4, 8, 16, 0.93)",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overscrollBehavior: "contain",
};

const closeBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: 16,
  right: 16,
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  background: "rgba(13, 19, 33, 0.7)",
  color: "#F1F5F9",
  fontSize: 17,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const navBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 46,
  height: 46,
  borderRadius: "50%",
  border: "1px solid rgba(255, 255, 255, 0.25)",
  background: "rgba(13, 19, 33, 0.7)",
  color: "#F1F5F9",
  fontSize: 24,
  lineHeight: 1,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
};

const figureStyle: React.CSSProperties = {
  margin: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  maxWidth: "94vw",
};

const stageStyle: React.CSSProperties = {
  position: "relative",
  width: "min(92vw, 1200px)",
  height: "min(var(--modal-height), 860px)",
};

const captionStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: "min(92vw, 720px)",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "8px 16px",
  borderRadius: "100px",
  background: "rgba(13, 19, 33, 0.75)",
  border: "1px solid rgba(212, 175, 55, 0.3)",
  color: "#E2E8F0",
  fontSize: 12.5,
  fontWeight: 600,
  textAlign: "center",
  lineHeight: 1.45,
};

const counterStyle: React.CSSProperties = {
  flexShrink: 0,
  padding: "2px 10px",
  borderRadius: "100px",
  background: "rgba(212, 175, 55, 0.15)",
  border: "1px solid rgba(212, 175, 55, 0.35)",
  color: "#D4AF37",
  fontSize: 11,
  fontWeight: 800,
};

export default function Lightbox({ items, index, onClose, onNavigate }: LightboxProps) {
  const isOpen = index !== null && items.length > 0;
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef<number | null>(null);
  const swipeSuppressClick = useRef(false);

  const go = useCallback(
    (delta: number) => {
      if (index === null || items.length === 0) return;
      onNavigate((index + delta + items.length) % items.length);
    },
    [index, items.length, onNavigate]
  );

  useEffect(() => {
    if (!isOpen) return;
    closeBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowRight") {
        go(1);
      } else if (e.key === "ArrowLeft") {
        go(-1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, go]);

  // Preload gambar tetangga agar navigasi terasa instan
  useEffect(() => {
    if (index === null || items.length < 2) return;
    [(index + 1) % items.length, (index - 1 + items.length) % items.length].forEach((i) => {
      const img = new window.Image();
      img.src = items[i].src;
    });
  }, [index, items]);

  if (!isOpen || typeof document === "undefined") return null;

  const active = items[index];

  return createPortal(
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Galeri foto"
      style={overlayStyle}
      onClick={(e) => {
        if (swipeSuppressClick.current) {
          swipeSuppressClick.current = false;
          e.stopPropagation();
          return;
        }
        onClose();
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
        if (Math.abs(dx) > 48) {
          swipeSuppressClick.current = true;
          go(dx < 0 ? 1 : -1);
        }
        touchStartX.current = null;
      }}
    >
      <button
        ref={closeBtnRef}
        type="button"
        className="lightbox-btn"
        aria-label="Tutup galeri"
        onClick={onClose}
        style={closeBtnStyle}
      >
        ✕
      </button>

      <figure className="lightbox-figure" style={figureStyle}>
        <div style={stageStyle}>
          <SmartImage
            key={active.src}
            src={active.src}
            alt={active.alt}
            fill
            sizes="92vw"
            priority
            fallbackBackground="transparent"
            style={{ objectFit: "contain" }}
          />
        </div>
        {(active.caption || items.length > 1) && (
          <figcaption style={captionStyle}>
            {items.length > 1 && (
              <span style={counterStyle}>
                {(index ?? 0) + 1} / {items.length}
              </span>
            )}
            {active.caption && <span>{active.caption}</span>}
          </figcaption>
        )}
      </figure>

      {items.length > 1 && (
        <>
          <button
            type="button"
            className="lightbox-btn"
            aria-label="Foto sebelumnya"
            onClick={(e) => {
              e.stopPropagation();
              go(-1);
            }}
            style={{ ...navBtnStyle, left: 14 }}
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox-btn"
            aria-label="Foto berikutnya"
            onClick={(e) => {
              e.stopPropagation();
              go(1);
            }}
            style={{ ...navBtnStyle, right: 14 }}
          >
            ›
          </button>
        </>
      )}
    </div>,
    document.body
  );
}