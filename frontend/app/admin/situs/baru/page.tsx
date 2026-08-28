"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "../../../../components/admin/AdminLayout";
import { useToast } from "../../../../components/admin/ToastProvider";
import SiteForm from "../../../../components/admin/SiteForm";
import { createSite, addGalleryPhoto, notifyDataChanged } from "../../../../services/adminApi";
import { getErrorMessage } from "../../../../lib/errors";

export default function TambahSitusPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (formData: FormData, galleryFiles: File[]) => {
    setError("");
    setSaving(true);
    try {
      const res = await createSite(formData);
      const newId = res.data.id;

      for (const file of galleryFiles) {
        const galleryFormData = new FormData();
        galleryFormData.append("image", file);
        await addGalleryPhoto(newId, galleryFormData);
      }

      notifyDataChanged();
      showToast("Situs berhasil ditambahkan");
      router.push("/admin/dashboard");
    } catch (err) {
      setError(getErrorMessage(err) || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: "800px" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#F8FAFC", margin: "0 0 4px" }}>
            Tambah Situs Baru
          </h1>
          <p style={{ fontSize: "13px", color: "#64748B", margin: 0 }}>
            Isi data situs cagar budaya yang akan ditambahkan
          </p>
        </div>

        <SiteForm
          autoSlug
          submitLabel="Simpan Situs"
          submitting={saving}
          error={error}
          onCancel={() => router.back()}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
