export default function Loading() {
  const heroHeight = "min(42vh, 360px)";
  return (
    <main
      style={{
        height: "100vh",
        overflowY: "auto",
        background: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "var(--background)",
          padding: "18px clamp(16px, 4vw, 48px)",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          borderBottom: "1px solid rgba(212, 175, 55, 0.2)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="skeleton" style={{ width: 130, height: 14, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 84, height: 9, borderRadius: 5, opacity: 0.6 }} />
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          width: "100%",
          height: heroHeight,
          overflow: "hidden",
          position: "relative",
          background: "var(--background)",
        }}
      >
        <div className="skeleton" style={{ position: "absolute", inset: 0 }} />
      </div>

      {/* Content grid */}
      <div
        className="detail-loading-grid"
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "28px clamp(16px, 4vw, 36px) 48px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(290px, 0.8fr)",
          gap: 34,
        }}
      >
        <div>
          <div className="skeleton" style={{ width: 96, height: 12, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: "70%", maxWidth: 460, height: 32, borderRadius: 8, marginTop: 14 }} />
          <div className="skeleton" style={{ width: "45%", maxWidth: 260, height: 22, borderRadius: 8, marginTop: 14 }} />
          <div className="skeleton" style={{ width: "100%", height: 13, borderRadius: 6, marginTop: 26 }} />
          <div className="skeleton" style={{ width: "96%", height: 13, borderRadius: 6, marginTop: 10 }} />
          <div className="skeleton" style={{ width: "88%", height: 13, borderRadius: 6, marginTop: 10 }} />
          <div className="skeleton" style={{ width: "100%", height: 13, borderRadius: 6, marginTop: 10 }} />
          <div className="skeleton" style={{ width: "70%", height: 13, borderRadius: 6, marginTop: 10 }} />
          <div className="skeleton" style={{ width: "40%", height: 18, borderRadius: 6, marginTop: 34 }} />
          <div className="skeleton" style={{ width: "100%", height: 160, borderRadius: 10, marginTop: 16 }} />
        </div>

        <aside
          className="detail-loading-aside"
          style={{
            alignSelf: "start",
            borderRadius: 16,
            background: "var(--popup-bg)",
            border: "1px solid var(--popup-border)",
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="skeleton" style={{ width: "50%", height: 12, borderRadius: 6 }} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ width: "100%", height: 15, borderRadius: 6, opacity: 1 - i * 0.12 }} />
          ))}
          <div className="skeleton" style={{ width: "100%", height: 42, borderRadius: 10, marginTop: 6 }} />
        </aside>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, rgba(148,163,184,0.12) 25%, rgba(148,163,184,0.26) 50%, rgba(148,163,184,0.12) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        [data-theme="light"] .skeleton {
          background: linear-gradient(90deg, rgba(15,23,42,0.08) 25%, rgba(15,23,42,0.16) 50%, rgba(15,23,42,0.08) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @media (max-width: 800px) {
          .detail-loading-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </main>
  );
}
