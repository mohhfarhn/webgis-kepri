"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
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
        minHeight: "var(--full-height)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "#0B0F19",
        color: "#F8FAFC",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: "rgba(212, 175, 55, 0.12)",
          border: "1px solid rgba(212, 175, 55, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 8,
        }}
        aria-hidden="true"
      >
        🛠️
      </div>
      <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Terjadi Kesalahan</h1>
      <p
        style={{
          fontSize: 13.5,
          color: "#94A3B8",
          maxWidth: 440,
          margin: "8px 0 24px",
          lineHeight: 1.6,
        }}
      >
        Operasi tidak dapat diselesaikan. Silakan coba lagi.
      </p>
      {error.digest && (
        <div
          style={{
            fontSize: 11,
            color: "#64748B",
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
        <Link href="/admin/dashboard" className="btn-gold-outline">
          ← Dashboard
        </Link>
      </div>
    </main>
  );
}
