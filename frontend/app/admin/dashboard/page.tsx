"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../components/admin/AdminLayout";
import { useToast } from "../../../components/admin/ToastProvider";
import { resolveMediaUrl } from "../../../lib/api";
import { KATEGORI_LABEL } from "../../../lib/formOptions";
import { getErrorMessage } from "../../../lib/errors";
import { getAllSites, deleteSite, notifyDataChanged } from "../../../services/adminApi";
import SmartImage from "../../../components/SmartImage";

interface Site {
  id: number;
  nama: string;
  slug: string;
  kabupaten: string;
  kategori: string;
  status: string;
  thumbnail: string | null;
  gallery: { id: number }[];
}

const katColor: Record<string, string> = {
  BANGUNAN: "#D4AF37",
  SITUS: "#4ADE80",
  BENDA: "#F59E0B",
  STRUKTUR: "#60A5FA",
  KAWASAN: "#A78BFA",
};

const statusColor: Record<string, string> = {
  DITETAPKAN: "#4ADE80",
  DIDAFTARKAN: "#F59E0B",
  USULAN: "#94A3B8",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadSites = async () => {
      try {
        const res = await getAllSites();
        if (cancelled) return;
        setSites(res.data);
      } catch {
        if (cancelled) return;
        // Token expired, redirect ke login
        router.replace("/admin/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSites();
    return () => {
      cancelled = true;
    };  }, [router]);

  useEffect(() => {
    if (deleteId === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const close = () => setDeleteId(null);
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteId]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSite(deleteId);
      setSites((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
      notifyDataChanged();
      showToast("Situs berhasil dihapus");
    } catch (err) {
      showToast(getErrorMessage(err) || "Gagal menghapus", "error");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = sites.filter(
    (s) =>
      s.nama.toLowerCase().includes(search.toLowerCase()) ||
      s.kabupaten.toLowerCase().includes(search.toLowerCase())
  );

  // Stats
  const totalSites = sites.length;
  const katCounts: Record<string, number> = {};
  const kabCounts: Record<string, number> = {};
  sites.forEach((s) => {
    katCounts[s.kategori] = (katCounts[s.kategori] || 0) + 1;
    kabCounts[s.kabupaten] = (kabCounts[s.kabupaten] || 0) + 1;
  });

  const statCards = [
    { label: "Total Situs", value: totalSites, color: "#D4AF37" },
    { label: "Kabupaten", value: Object.keys(kabCounts).length, color: "#60A5FA" },
    { label: "Kategori", value: Object.keys(katCounts).length, color: "#4ADE80" },
    { label: "Foto Galeri", value: sites.reduce((sum, s) => sum + s.gallery.length, 0), color: "#F59E0B" },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>
          Dashboard
        </h1>
        <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
          Kelola data cagar budaya Kepulauan Riau
        </p>
      </div>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: "#111625",
              borderRadius: "12px",
              padding: "18px 20px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#64748B",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: "6px",
              }}
            >
              {card.label}
            </div>
            <div style={{ fontSize: "28px", fontWeight: 900, color: card.color }}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          placeholder="Cari situs..."
          aria-label="Cari situs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: "200px",
            padding: "10px 14px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#F8FAFC",
            fontSize: "13px",
            outline: "none",
          }}
        />
        <button
          onClick={() => router.push("/admin/situs/baru")}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #D4AF37, #B8960C)",
            border: "none",
            color: "#0B0F19",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          + Tambah Situs
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
          Memuat data...
        </div>
      ) : (
        <div
          style={{
            background: "#111625",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  {["Situs", "Kabupaten", "Kategori", "Status", "Foto", "Aksi"].map((header) => (
                    <th
                      key={header}
                      style={{
                        padding: "12px 16px",
                        fontSize: "10px",
                        fontWeight: 800,
                        color: "#64748B",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        textAlign: "left",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((site) => (
                  <tr
                    key={site.id}
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(212,175,55,0.04)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {site.thumbnail && (
                          <SmartImage
                            src={resolveMediaUrl(site.thumbnail)}
                            alt=""
                            width={36}
                            height={36}
                            style={{
                              width: "36px",
                              height: "36px",
                              borderRadius: "6px",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#F8FAFC" }}>
                          {site.nama}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#94A3B8" }}>
                      {site.kabupaten}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: `${katColor[site.kategori] || "#94A3B8"}20`,
                          color: katColor[site.kategori] || "#94A3B8",
                        }}
                      >
                        {KATEGORI_LABEL[site.kategori] || site.kategori}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          background: `${statusColor[site.status] || "#94A3B8"}20`,
                          color: statusColor[site.status] || "#94A3B8",
                        }}
                      >
                        {site.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#94A3B8" }}>
                      {site.gallery.length}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => router.push(`/admin/situs/${site.id}/edit`)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "rgba(96,165,250,0.12)",
                            border: "1px solid rgba(96,165,250,0.3)",
                            color: "#60A5FA",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteId(site.id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.3)",
                            color: "#EF4444",
                            cursor: "pointer",
                          }}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: "13px" }}
                    >
                      {search ? "Tidak ada situs yang cocok" : "Belum ada data situs"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#111625",
              borderRadius: "12px",
              padding: "28px",
              border: "1px solid rgba(239,68,68,0.3)",
              maxWidth: "380px",
              width: "100%",
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div id="delete-modal-title" style={{ fontSize: "16px", fontWeight: 800, color: "#F8FAFC", marginBottom: "8px" }}>
              Konfirmasi Hapus
            </div>
            <p style={{ fontSize: "13px", color: "#94A3B8", marginBottom: "20px" }}>
              Apakah Anda yakin ingin menghapus situs ini? Semua foto galeri juga akan ikut
              terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                autoFocus
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  background: deleting ? "#64748B" : "#EF4444",
                  border: "none",
                  color: "#fff",
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
