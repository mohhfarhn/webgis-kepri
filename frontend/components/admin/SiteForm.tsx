"use client";

import { useEffect, useState } from "react";
import {
  KATEGORI_OPTIONS,
  STATUS_OPTIONS,
  TINGKAT_OPTIONS,
  EMPTY_SITE_FORM,
  slugify,
  type SiteFormValues,
} from "../../lib/formOptions";
import SmartImage from "../SmartImage";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "8px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "#F8FAFC",
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  background: "#161D30",
};

const optionStyle: React.CSSProperties = {
  background: "#161D30",
  color: "#F8FAFC",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#94A3B8",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const cardStyle: React.CSSProperties = {
  background: "#111625",
  borderRadius: "12px",
  padding: "24px",
  border: "1px solid rgba(255,255,255,0.06)",
  marginBottom: "16px",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 800,
  color: "#D4AF37",
  margin: "0 0 16px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const bannerStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "8px",
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: "16px",
};

interface SiteFormProps {
  initialValues?: Partial<SiteFormValues>;
  initialThumbnailUrl?: string | null;
  autoSlug?: boolean;
  thumbnailActionLabel?: string;
  cancelLabel?: string;
  submitLabel: string;
  submitting: boolean;
  error?: string | null;
  notice?: string | null;
  showGallery?: boolean;
  beforeActions?: React.ReactNode;
  onCancel: () => void;
  onSubmit: (formData: FormData, galleryFiles: File[]) => Promise<void>;
}

export default function SiteForm({
  initialValues,
  initialThumbnailUrl = null,
  autoSlug = false,
  thumbnailActionLabel = "Pilih Thumbnail",
  cancelLabel = "Batal",
  submitLabel,
  submitting,
  error,
  notice,
  showGallery = true,
  beforeActions,
  onCancel,
  onSubmit,
}: SiteFormProps) {
  const [values, setValues] = useState<SiteFormValues>({
    ...EMPTY_SITE_FORM,
    ...initialValues,
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialThumbnailUrl ?? null
  );
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const revokeUrl = (url: string | null) => {
    if (url && url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  // Bersihkan semua URL blob saat form dilepas agar tidak membocorkan memori.
  useEffect(() => {
    return () => {
      revokeUrl(thumbnailPreview);
      galleryPreviews.forEach(revokeUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (key: keyof SiteFormValues, value: string) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      if (autoSlug && key === "nama") {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleRemoveThumbnail = () => {
    revokeUrl(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(initialThumbnailUrl ?? null);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...files.map((file) => URL.createObjectURL(file)),
    ]);
  };

  const handleRemoveGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => {
      revokeUrl(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      if (value === "") return;
      // Koordinat: normalisasi koma menjadi titik (locale Indonesia memakai koma)
      // agar nilai tetap tersimpan sebagai desimal yang valid.
      let v = value;
      if ((key === "latitude" || key === "longitude") && v.includes(",")) {
        v = v.replace(/,/g, ".");
      }
      formData.append(key, v);
    });
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    await onSubmit(formData, galleryFiles);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          style={{
            ...bannerStyle,
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#EF4444",
          }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          style={{
            ...bannerStyle,
            background: "rgba(74,222,128,0.1)",
            border: "1px solid rgba(74,222,128,0.3)",
            color: "#4ADE80",
          }}
        >
          {notice}
        </div>
      )}

      {/* Informasi Utama */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Informasi Utama</h2>
        <div style={gridStyle}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Nama Situs *</label>
            <input
              style={inputStyle}
              aria-label="Nama Situs"
              value={values.nama}
              onChange={(e) => handleChange("nama", e.target.value)}
              required
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Slug (URL)</label>
            <input
              style={{ ...inputStyle, color: "#64748B" }}
              aria-label="Slug URL"
              value={values.slug}
              onChange={(e) => handleChange("slug", e.target.value)}
              required
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Deskripsi *</label>
            <textarea
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              aria-label="Deskripsi"
              value={values.deskripsi}
              onChange={(e) => handleChange("deskripsi", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      {/* Lokasi */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Lokasi</h2>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Kabupaten / Kota *</label>
            <input
              style={inputStyle}
              aria-label="Kabupaten / Kota"
              value={values.kabupaten}
              onChange={(e) => handleChange("kabupaten", e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Kecamatan</label>
            <input
              style={inputStyle}
              aria-label="Kecamatan"
              value={values.kecamatan}
              onChange={(e) => handleChange("kecamatan", e.target.value)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Alamat</label>
            <input
              style={inputStyle}
              aria-label="Alamat"
              value={values.alamat}
              onChange={(e) => handleChange("alamat", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Latitude *</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              aria-label="Latitude"
              placeholder="contoh: 0.9255847"
              value={values.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Longitude *</label>
            <input
              style={inputStyle}
              type="text"
              inputMode="decimal"
              aria-label="Longitude"
              placeholder="contoh: 104.444366217"
              value={values.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              required
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={labelStyle}>Google Maps Link</label>
            <input
              style={inputStyle}
              aria-label="Google Maps Link"
              value={values.googleMaps}
              onChange={(e) => handleChange("googleMaps", e.target.value)}
              placeholder="https://maps.google.com/..."
            />
          </div>
        </div>
      </div>

      {/* Klasifikasi */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Klasifikasi</h2>
        <div style={gridStyle}>
          <div>
            <label style={labelStyle}>Kategori *</label>
            <select
              style={selectStyle}
              aria-label="Kategori"
              value={values.kategori}
              onChange={(e) => handleChange("kategori", e.target.value)}
            >
              {KATEGORI_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} style={optionStyle}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status *</label>
            <select
              style={selectStyle}
              aria-label="Status"
              value={values.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} style={optionStyle}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tingkat</label>
            <select
              style={selectStyle}
              aria-label="Tingkat"
              value={values.tingkat}
              onChange={(e) => handleChange("tingkat", e.target.value)}
            >
              {TINGKAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} style={optionStyle}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Tahun Penetapan</label>
            <input
              style={inputStyle}
              type="number"
              aria-label="Tahun Penetapan"
              value={values.tahun}
              onChange={(e) => handleChange("tahun", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Nomor SK</label>
            <input
              style={inputStyle}
              aria-label="Nomor SK"
              value={values.nomorSK}
              onChange={(e) => handleChange("nomorSK", e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Sumber Data</label>
            <input
              style={inputStyle}
              aria-label="Sumber Data"
              value={values.sumber}
              onChange={(e) => handleChange("sumber", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Foto Thumbnail */}
      <div style={cardStyle}>
        <h2 style={cardTitleStyle}>Foto Thumbnail *</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "center" }}>
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "180px",
              height: "120px",
              borderRadius: "10px",
              border: "2px dashed rgba(212,175,55,0.3)",
              background: "rgba(212,175,55,0.02)",
              cursor: "pointer",
              transition: "all 0.2s",
              textAlign: "center",
              padding: "10px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#D4AF37";
              e.currentTarget.style.background = "rgba(212,175,55,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(212,175,55,0.3)";
              e.currentTarget.style.background = "rgba(212,175,55,0.02)";
            }}
          >
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>📸</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#D4AF37" }}>
              {thumbnailActionLabel}
            </span>
            <span style={{ fontSize: "10px", color: "#64748B", marginTop: "4px" }}>
              PNG, JPG sampai 5MB
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
              aria-label="Pilih file gambar untuk foto utama"
            />
          </label>

          {thumbnailPreview && (
            <div
              style={{
                position: "relative",
                width: "180px",
                height: "120px",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <SmartImage
                src={thumbnailPreview}
                alt="Preview thumbnail"
                width={360}
                height={240}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              {thumbnailFile && (
                <button
                  type="button"
                  onClick={handleRemoveThumbnail}
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.9)",
                    border: "none",
                    color: "#fff",
                    fontSize: "12px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Kembalikan ke foto awal"
                  aria-label="Kembalikan ke foto awal"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Galeri Foto */}
      {showGallery && (
        <div style={{ ...cardStyle, marginBottom: "24px" }}>
          <h2 style={cardTitleStyle}>Galeri Foto</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "140px",
                height: "100px",
                borderRadius: "10px",
                border: "2px dashed rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.02)",
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                padding: "10px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,175,55,0.5)";
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <span style={{ fontSize: "20px", marginBottom: "4px" }}>🖼️</span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>
                Tambah Foto
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryChange}
                style={{ display: 'none' }}
                aria-label="Pilih beberapa file gambar untuk galeri"
              />
            </label>

            {galleryPreviews.map((preview, index) => (
              <div
                key={`${preview}-${index}`}
                style={{
                  position: "relative",
                  width: "140px",
                  height: "100px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <SmartImage
                  src={preview}
                  alt={`Preview ${index}`}
                  width={280}
                  height={200}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGalleryFile(index)}
                  aria-label={`Hapus foto galeri ${index + 1}`}
                  title={`Hapus foto galeri ${index + 1}`}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "rgba(239,68,68,0.9)",
                    border: "none",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "11px", color: "#64748B", margin: "10px 0 0" }}>
            * Anda dapat memilih beberapa foto sekaligus untuk dimasukkan ke dalam galeri.
          </p>
        </div>
      )}

      {beforeActions}

      <div style={{ display: "flex", gap: "12px" }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94A3B8",
            cursor: "pointer",
          }}
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 800,
            background: submitting ? "#64748B" : "linear-gradient(135deg, #D4AF37, #B8960C)",
            border: "none",
            color: "#0B0F19",
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Menyimpan..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
