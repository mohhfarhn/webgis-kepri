"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      id="main-content"
      style={{
        height: "var(--full-height)",
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
      <div style={{ fontSize: 44, marginBottom: 4 }} aria-hidden="true">🗺️</div>
      <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Terjadi Kesalahan</h1>
      <p
        style={{
          fontSize: 13.5,
          color: "var(--legend-text)",
          maxWidth: 440,
          margin: "8px 0 24px",
          lineHeight: 1.6,
        }}
      >
        Maaf, terjadi kendala saat memuat halaman. Silakan coba lagi.
      </p>
      {error.digest && (
        <div
          style={{
            fontSize: 11,
            color: "var(--legend-text)",
            opacity: 0.7,
            marginBottom: 8,
            fontFamily: "monospace",
          }}
        >
          Kode: {error.digest}
        </div>
      )}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="btn-gold"
          style={{ border: "none", cursor: "pointer" }}
        >
          🔄 Coba Lagi
        </button>
        <Link href="/" className="btn-gold-outline">
          ← Kembali ke Peta
        </Link>
      </div>
    </main>
  );
}
