"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "../../../../../components/admin/AdminLayout";
import { useToast } from "../../../../../components/admin/ToastProvider";
import SiteForm from "../../../../../components/admin/SiteForm";
import SmartImage from "../../../../../components/SmartImage";
import { resolveMediaUrl } from "../../../../../lib/api";
import {
  getSiteById,
  updateSite,
  addGalleryPhoto,
  deleteGalleryPhoto,
  notifyDataChanged,
} from "../../../../../services/adminApi";
import { getErrorMessage } from "../../../../../lib/errors";

interface GalleryItem {
  id: number;
  image: string;
  caption: string | null;
  urutan: number;
}

interface SiteResponse {
  data: {
    nama: string;
    slug: string;
    deskripsi: string;
    kabupaten: string;
    kecamatan?: string | null;
    alamat?: string | null;
    latitude: number;
    longitude: number;
    kategori: string;
    status: string;
    tingkat?: string | null;
    tahun?: number | null;
    nomorSK?: string | null;
    sumber?: string | null;
    googleMaps?: string | null;
    thumbnail?: string | null;
    gallery?: GalleryItem[];
  };
}

export default function EditSitusPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = parseInt(params.id as string);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [originalThumbnail, setOriginalThumbnail] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const loadSite = async () => {
      try {
        const res = (await getSiteById(siteId)) as SiteResponse;
        if (cancelled) return;
        const site = res.data;
        setInitialValues({
          nama: site.nama || "",
          slug: site.slug || "",
          deskripsi: site.deskripsi || "",
          kabupaten: site.kabupaten || "",
          kecamatan: site.kecamatan || "",
          alamat: site.alamat || "",
          latitude: site.latitude ? String(site.latitude) : "",
          longitude: site.longitude ? String(site.longitude) : "",
          kategori: site.kategori || "BANGUNAN",
          status: site.status || "DIDAFTARKAN",
          tingkat: site.tingkat || "",
          tahun: site.tahun ? String(site.tahun) : "",
          nomorSK: site.nomorSK || "",
          sumber: site.sumber || "",
          googleMaps: site.googleMaps || "",
        });
        setGallery(site.gallery || []);
        setOriginalThumbnail(resolveMediaUrl(site.thumbnail) ?? null);
      } catch {
        if (cancelled) return;
        router.replace("/admin/dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadSite();
    return () => {
      cancelled = true;
    };
  }, [siteId, router]);

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setSaving(true);
    try {
      await updateSite(siteId, formData);
      notifyDataChanged();
      showToast("Data situs berhasil diperbarui!");
    } catch (err) {
      setError(getErrorMessage(err) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingGallery(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await addGalleryPhoto(siteId, formData);
      setGallery((prev) => [...prev, res.data]);
      notifyDataChanged();
      showToast("Foto berhasil ditambahkan");
    } catch (err) {
      showToast(getErrorMessage(err) || "Gagal mengunggah foto", "error");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  };

  const handleDeleteGallery = async (galleryId: number) => {
    if (!confirm("Hapus foto ini?")) return;
    try {
      await deleteGalleryPhoto(siteId, galleryId);
      setGallery((prev) => prev.filter((item) => item.id !== galleryId));
      notifyDataChanged();
      showToast("Foto berhasil dihapus");
    } catch (err) {
      showToast(getErrorMessage(err) || "Gagal menghapus foto", "error");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B" }}>
          Memuat data situs...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div style={{ maxWidth: "800px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>
            Edit Situs
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
            {initialValues.nama}
          </p>
        </div>

        <SiteForm
          initialValues={initialValues}
          initialThumbnailUrl={originalThumbnail}
          thumbnailActionLabel="Ubah Thumbnail"
          cancelLabel="Kembali"
          submitLabel="Simpan Perubahan"
          submitting={saving}
          error={error}
          showGallery={false}
          beforeActions={
            <div
              style={{
                background: "#111625",
                borderRadius: "12px",
                padding: "24px",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "14px", fontWeight: 800, color: "#D4AF37", margin: 0 }}>
                  Galeri Foto ({gallery.length})
                </h2>
                <label
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: 700,
                    background: "rgba(212,175,55,0.12)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    color: "#D4AF37",
                    cursor: uploadingGallery ? "not-allowed" : "pointer",
                  }}
                >
                  {uploadingGallery ? "Mengunggah..." : "+ Tambah Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddGallery}
                    style={{ display: "none" }}
                    aria-label="Tambah foto galeri"
                    disabled={uploadingGallery}
                  />
                </label>
              </div>

              {gallery.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "#64748B", fontSize: "13px" }}>
                  Belum ada foto galeri
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "10px",
                  }}
                >
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        position: "relative",
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <SmartImage
                        src={resolveMediaUrl(item.image)}
                        alt={item.caption || ""}
                        width={280}
                        height={200}
                        sizes="150px"
                        style={{
                          display: "block",
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteGallery(item.id)}
                        aria-label={`Hapus foto galeri ${item.image}`}
                        title="Hapus foto"
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "rgba(239,68,68,0.9)",
                          border: "none",
                          color: "#fff",
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          }
          onCancel={() => router.push("/admin/dashboard")}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
