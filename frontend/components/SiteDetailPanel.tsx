"use client";

// components/SiteDetailPanel.tsx
// Panel detail cagar budaya mengambang dengan glassmorphism premium, card-based layout, & animasi geser masuk

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Site, categories } from "../data/sites";
import { getStatusColorBg, getStatusColorText, TINGKAT_LABEL } from "../lib/siteStatus";
import { getThemeColors, ThemeMode } from "../lib/theme";
import SmartImage from "./SmartImage";
import CategoryIcon from "./icons/CategoryIcon";
import Lightbox, { type LightboxItem } from "./Lightbox";
import ShareButton from "./ShareButton";

interface SiteDetailPanelProps {
  site: Site | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  isMobile?: boolean;
}

const InfoRow = ({
  label,
  icon,
  value,
  isLight,
  noBorder = false,
}: {
  label: string;
  icon: string;
  value?: string | number | null;
  isLight: boolean;
  noBorder?: boolean;
}) => {
  if (!value) return null;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        fontSize: "12.5px",
        padding: "10px 0",
        borderBottom: noBorder
          ? "none"
          : isLight
          ? "1px dashed rgba(0, 0, 0, 0.08)"
          : "1px dashed rgba(255, 255, 255, 0.08)",
        gap: "16px",
      }}
    >
      <dt
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: isLight ? "#475569" : "#94A3B8",
          margin: 0,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: "14px" }}>{icon}</span> <span style={{ fontWeight: 600 }}>{label}</span>
      </dt>
      <dd style={{ margin: 0, color: isLight ? "#1E293B" : "#F1F5F9", fontWeight: 500, textAlign: "right" }}>
        {value}
      </dd>
    </div>
  );
};

// Slider galeri foto panel detail — menampilkan satu gambar dengan tombol
// prev/next dan counter. Index internal di-reset otomatis saat site berubah
// karena parent memberi key={site.id} sehingga komponen di-remount.
function GallerySlider({
  items,
  siteName,
  isLight,
  textColorSecondary,
  onOpenLightbox,
}: {
  items: { image: string; caption?: string }[];
  siteName: string;
  isLight: boolean;
  textColorSecondary: string;
  onOpenLightbox: (index: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const total = items.length;
  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  const arrowBase: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    background: "rgba(10,15,25,0.6)",
    color: "#fff",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="gallery-thumb-btn"
        aria-label={`Perbesar foto ${index + 1} dari ${siteName}`}
        onClick={() => onOpenLightbox(index)}
        style={{ display: "block", width: "100%", padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
      >
        <SmartImage
          src={items[index].image}
          alt={items[index].caption ?? `${siteName} ${index + 1}`}
          className="gallery-main-image"
          width={960}
          height={720}
          sizes="(min-width: 900px) 420px, 92vw"
          fallbackBackground={isLight ? "#E2E8F0" : "#111625"}
          style={{
            width: "100%",
            aspectRatio: "4 / 3",
            objectFit: "cover",
            display: "block",
            borderRadius: "10px",
            border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          }}
        />
      </button>

      {total > 1 && (
        <>
          <button type="button" aria-label="Foto sebelumnya" onClick={() => go(-1)} style={{ ...arrowBase, left: 8 }}>
            ‹
          </button>
          <button type="button" aria-label="Foto berikutnya" onClick={() => go(1)} style={{ ...arrowBase, right: 8 }}>
            ›
          </button>
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              fontSize: "11px",
              fontWeight: 700,
              color: "#fff",
              background: "rgba(10,15,25,0.6)",
              borderRadius: 999,
              padding: "3px 9px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}
          >
            {index + 1} / {total}
          </div>
        </>
      )}

      {items[index].caption && (
        <div style={{ marginTop: "8px", fontSize: "11px", color: textColorSecondary, lineHeight: 1.4, textAlign: "center" }}>
          {items[index].caption}
        </div>
      )}
    </div>
  );
}

export default function SiteDetailPanel({
  site,
  isOpen,
  onClose,
  theme,
  isMobile = false,
}: SiteDetailPanelProps) {
  const cat = site ? categories[site.kat] : null;
  const heroImage = site ? (site.thumbnail ?? site.gallery?.[0]?.image) : null;
  const gallery = site?.gallery?.filter((item) => item.image) ?? [];
  // Saat thumbnail sama dengan foto pertama galeri, foto hero bisa tampil ganda
  // (hero besar + slide pertama galeri). Buang foto pertama dari galeri dalam hal
  // ini agar tidak duplikat, dan biarkan penomoran lightbox tetap konsisten.
  const galleryStart = heroImage && site?.thumbnail && gallery[0]?.image === heroImage ? 1 : 0;
  const displayGallery = gallery.slice(galleryStart);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  // Lightbox menyimpan siteId bersama index — otomatis "tertutup" (derivatif)
  // saat berganti situs atau panel ditutup, tanpa perlu efek/reset manual.
  const [lightboxState, setLightboxState] = useState<{ siteId: string; index: number } | null>(null);
  const lightboxIndex =
    lightboxState && isOpen && site && lightboxState.siteId === site.id ? lightboxState.index : null;

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    // Re-trigger animasi frame saat berpindah situs (tanpa remount DOM),
    // sehingga konten tampak memudar masuk secara halus.
    if (site && isOpen) {
      const el = frameRef.current;
      if (el) {
        el.classList.remove("detail-frame-anim");
        void el.offsetWidth;
        el.classList.add("detail-frame-anim");
      }
    }
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
      panelRef.current?.focus();
    } else {
      returnFocusRef.current?.focus?.();
      returnFocusRef.current = null;
    }
  }, [site?.id, site, isOpen]);

  const handlePanelKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      onClose();
    }
  };

  // Esc juga menutup panel saat fokus berada di luar panel (mis. di peta),
  // konsisten dengan Lightbox yang mendengarkan di level document.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const { isLight, textColorPrimary, textColorSecondary, goldColor, goldBorder, goldBorderStrong, goldBgSoft } =
    getThemeColors(theme);

  const panelClassName = isMobile
    ? `detail-panel-mobile ${isOpen ? "open" : ""}`
    : `detail-panel ${isOpen ? "open" : ""}`;

  const frameStyle: CSSProperties = isMobile
    ? {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: isLight ? "#FFFFFF" : "#0D1220",
        borderTop: `1.5px solid ${goldBorder}`,
        borderRadius: "24px 24px 0 0",
        boxShadow: isLight ? "0 -10px 40px rgba(0, 0, 0, 0.08)" : "0 -10px 40px rgba(0, 0, 0, 0.5)",
        overflow: "hidden",
      }
    : {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: isLight ? "#FFFFFF" : "#0D1220",
        border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.06)"}`,
        borderRadius: "16px",
        boxShadow: isLight ? "0 20px 50px rgba(0, 0, 0, 0.1)" : "0 20px 50px rgba(0, 0, 0, 0.45)",
        overflow: "hidden",
      };

  const sectionCardStyle: CSSProperties = {
    background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.025)",
    padding: "18px",
    borderRadius: "12px",
    border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.05)"}`,
    marginTop: "16px",
    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.01)" : "0 4px 16px rgba(0,0,0,0.1)",
    backdropFilter: "blur(8px)",
  };

  const sectionTitleStyle: CSSProperties = {
    margin: "0 0 14px",
    fontSize: "11.5px",
    fontWeight: 800,
    color: goldColor,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <aside
      ref={panelRef as React.Ref<HTMLElement>}
      role="dialog"
      aria-modal="false"
      aria-labelledby="detail-panel-title"
      tabIndex={-1}
      onKeyDown={handlePanelKeyDown}
      className={panelClassName}
    >
      {!site && <div style={{ width: "100%", height: "100%" }} />}

      {site && cat && (
        <div
          ref={frameRef}
          style={frameStyle}
        >
      {/* Handle bottom sheet di mobile — bisa ditekan untuk menutup panel */}
      {isMobile && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Tutup panel detail"
          onClick={onClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClose();
            }
          }}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            paddingTop: "10px",
            paddingBottom: "2px",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "5px",
              borderRadius: "2px",
              background: isLight ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.2)",
            }}
          />
        </div>
      )}

      {/* Header Banner */}
      <div
        style={{
          background: `linear-gradient(135deg, ${cat.color}, ${cat.color}CC)`,
          color: "#fff",
          padding: "16px 18px",
          display: "flex",
          gap: "12px",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "inset 0 0 10px rgba(255,255,255,0.2)",
            color: cat.color,
          }}
        >
          <CategoryIcon category={site.kat} size={22} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              opacity: 0.9,
            }}
          >
            {cat.label}
          </div>
          <h2 id="detail-panel-title" style={{ margin: "2px 0 0", fontSize: "16px", fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            {site.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup detail"
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            background: "rgba(255, 255, 255, 0.15)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "14px",
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
          }}
        >
          ✕
        </button>
      </div>

      {/* Hero Image */}
      {heroImage && (
        <div style={{ width: "100%", height: "220px", overflow: "hidden", position: "relative" }}>
          <SmartImage
            src={heroImage}
            alt={site.name}
            fill
            priority
            sizes="(min-width: 900px) 450px, 100vw"
            fallbackBackground={isLight ? "#E2E8F0" : "#111625"}
            style={{
              objectFit: "cover",
              background: isLight ? "#E2E8F0" : "#111625",
            }}
          />
          {/* Subtle overlay gradients for depth */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "50px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "60px",
              background: `linear-gradient(to top, ${isLight ? "rgba(255, 255, 255, 1)" : "rgba(13, 18, 32, 1)"}, transparent)`,
            }}
          />
        </div>
      )}

      {/* Scrollable Content — di-remount saat ganti situs (key=site.id) agar
          animasi stagger .detail-content > * diputar ulang setiap perpindahan */}
      <div key={site.id} ref={scrollRef} className="premium-scroll detail-content" style={{ overflowY: "auto", padding: "18px 18px calc(18px + env(safe-area-inset-bottom, 0px))", flex: 1 }}>
        {/* Badges */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span
            style={{
              fontSize: "11px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: getStatusColorBg(site.status, isLight),
              color: getStatusColorText(site.status, isLight),
              fontWeight: 800,
              border: `1px solid ${getStatusColorText(site.status, isLight)}25`,
            }}
          >
            🛡️ {site.status}
          </span>
          {site.tingkat && (
            <span
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                background: goldBgSoft,
                color: goldColor,
                fontWeight: 800,
                border: `1px solid ${goldBorder}`,
              }}
            >
              ⭐ Tingkat {TINGKAT_LABEL[site.tingkat]}
            </span>
          )}
          {site.tahun && (
            <span
              style={{
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "6px",
                background: isLight ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)",
                color: textColorPrimary,
                fontWeight: 800,
                border: `1px solid ${isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.1)"}`,
              }}
            >
              📅 {site.tahun}
            </span>
          )}
        </div>

        {/* Description Card */}
        <p
          style={{
            margin: "0 0 16px",
            color: isLight ? "#334155" : "#CBD5E1",
            fontSize: "14px",
            lineHeight: 1.75,
            textAlign: "justify",
            background: isLight ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.015)",
            padding: "16px",
            borderRadius: "10px",
            border: `1px solid ${isLight ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.04)"}`,
          }}
        >
          {site.desc}
        </p>

        {/* Lokasi Card */}
        <section style={sectionCardStyle}>
          <h3 style={sectionTitleStyle}>
            📍 Detail Lokasi
          </h3>
          <dl style={{ display: "flex", flexDirection: "column", margin: 0 }}>
            <InfoRow label="Kab/Kota" icon="🏙️" value={site.kab} isLight={isLight} />
            <InfoRow label="Kecamatan" icon="🏘️" value={site.kecamatan} isLight={isLight} />
            <InfoRow label="Alamat" icon="📍" value={site.alamat} isLight={isLight} />
            <InfoRow label="Koordinat" icon="🌐" value={`${site.lat.toFixed(6)}, ${site.lng.toFixed(6)}`} isLight={isLight} noBorder />
          </dl>

          {(site.googleMaps || site.slug) && (
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              {site.googleMaps && (
                <a
                  href={site.googleMaps}
                  target="_blank"
                  rel="noreferrer"
                  className="premium-btn-primary"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #1B4F4A, #123632)",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: 800,
                    textDecoration: "none",
                    border: "1px solid rgba(27, 79, 74, 0.4)",
                    boxShadow: "0 4px 14px rgba(27, 79, 74, 0.25)",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                >
                  🗺️ Google Maps
                </a>
              )}
              {site.slug && (
                <a
                  href={`/cagar-budaya/${site.slug}`}
                  className="premium-btn-secondary"
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "11px 16px",
                    borderRadius: "10px",
                    border: `1px solid ${goldBorderStrong}`,
                    background: goldBgSoft,
                    color: goldColor,
                    fontSize: "12px",
                    fontWeight: 800,
                    textDecoration: "none",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    boxShadow: "0 4px 14px rgba(212,175,55,0.08)",
                  }}
                >
                  📄 Info Lengkap
                </a>
              )}
            </div>
          )}

          {/* Bagikan tautan situs (deep link ?site=slug) */}
          <ShareButton
            title={site.name}
            text={`Lihat situs cagar budaya ${site.name} di peta WebGIS Kepri`}
            style={{
              width: "100%",
              marginTop: "10px",
              padding: "11px 16px",
              borderRadius: "10px",
              border: `1px solid ${goldBorderStrong}`,
              background: goldBgSoft,
              color: goldColor,
              boxShadow: "0 4px 14px rgba(212,175,55,0.08)",
            }}
          />
        </section>

        {/* Penetapan Card — disembunyikan bila tidak ada data legalitas sama sekali */}
        {(site.nomorSK || site.sumber) && (
          <section style={sectionCardStyle}>
            <h3 style={sectionTitleStyle}>
              📜 Legalitas & Penetapan
            </h3>
            <dl style={{ display: "flex", flexDirection: "column", margin: 0 }}>
              <InfoRow label="Nomor SK" icon="📜" value={site.nomorSK} isLight={isLight} />
              <InfoRow label="Sumber Data" icon="🗂️" value={site.sumber} isLight={isLight} noBorder />
            </dl>
          </section>
        )}

        {/* Gallery Card */}
        {displayGallery.length > 0 && (
          <section style={sectionCardStyle}>
            <h3 style={sectionTitleStyle}>🖼️ Galeri Foto</h3>
            <GallerySlider
              key={site.id}
              items={displayGallery}
              siteName={site.name}
              isLight={isLight}
              textColorSecondary={textColorSecondary}
              onOpenLightbox={(index) => setLightboxState({ siteId: site.id, index })}
            />
          </section>
        )}
      </div>
        </div>
      )}

      {/* Lightbox galeri — portal ke body */}
      {displayGallery.length > 0 && site && (
        <Lightbox
          items={
            displayGallery.map((item, index): LightboxItem => ({
              src: item.image as string,
              alt: item.caption ?? `${site.name} ${index + 1 + galleryStart}`,
              caption: item.caption,
            }))
          }
          index={lightboxIndex}
          onClose={() => setLightboxState(null)}
          onNavigate={(i) => setLightboxState({ siteId: site.id, index: i })}
        />
      )}
    </aside>
  );
}
