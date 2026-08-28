"use client";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="id" data-theme="dark">
      <body>
        <main
          id="main-content"
          style={{
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44, marginBottom: 4 }} aria-hidden="true">⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9", margin: 0 }}>
            Terjadi Kesalahan Aplikasi
          </h1>
          <p
            style={{
              fontSize: 13.5,
              color: "#94A3B8",
              maxWidth: 440,
              margin: "8px 0 24px",
              lineHeight: 1.6,
            }}
          >
            Aplikasi tidak dapat dimuat. Silakan muat ulang halaman atau coba lagi.
          </p>
          {error.digest && (
            <div
              style={{
                fontSize: 11,
                color: "#94A3B8",
                opacity: 0.7,
                marginBottom: 8,
                fontFamily: "monospace",
              }}
            >
              Kode: {error.digest}
            </div>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="btn-gold"
            style={{ border: "none", cursor: "pointer" }}
          >
            🔄 Coba Lagi
          </button>
        </main>
      </body>
    </html>
  );
}
