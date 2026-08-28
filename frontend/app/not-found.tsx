import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "var(--background)",
        color: "var(--foreground)",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "clamp(72px, 18vw, 140px)",
          fontWeight: 800,
          lineHeight: 1,
          color: "var(--legend-accent)",
          letterSpacing: "-0.02em",
          textShadow: "0 0 40px rgba(212, 175, 55, 0.25)",
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: "clamp(18px, 4vw, 26px)", fontWeight: 800, marginTop: 8, marginBottom: 0 }}>
        Halaman Tidak Ditemukan
      </h1>
      <p
        style={{
          fontSize: 14,
          color: "var(--legend-text)",
          maxWidth: 420,
          margin: "8px 0 28px",
          lineHeight: 1.6,
        }}
      >
        Situs cagar budaya atau halaman yang Anda cari tidak tersedia. Silakan kembali ke peta
        untuk menjelajahi situs lainnya.
      </p>
      <Link href="/" className="btn-gold">
        ← Kembali ke Peta
      </Link>
    </main>
  );
}
