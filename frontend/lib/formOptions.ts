export const KATEGORI_OPTIONS = [
  { value: "BANGUNAN", label: "Bangunan" },
  { value: "SITUS", label: "Situs" },
  { value: "STRUKTUR", label: "Struktur" },
  { value: "KAWASAN", label: "Kawasan" },
  { value: "BENDA", label: "Benda" },
] as const;

export const STATUS_OPTIONS = [
  { value: "DITETAPKAN", label: "Ditetapkan" },
  { value: "DIDAFTARKAN", label: "Didaftarkan" },
  { value: "USULAN", label: "Usulan" },
] as const;

export const TINGKAT_OPTIONS = [
  { value: "", label: "— Belum ditentukan —" },
  { value: "NASIONAL", label: "Nasional" },
  { value: "PROVINSI", label: "Provinsi" },
  { value: "KABUPATEN", label: "Kabupaten" },
] as const;

export const KATEGORI_LABEL: Record<string, string> = Object.fromEntries(
  KATEGORI_OPTIONS.map((option) => [option.value, option.label])
);

export interface SiteFormValues {
  nama: string;
  slug: string;
  deskripsi: string;
  kabupaten: string;
  kecamatan: string;
  alamat: string;
  latitude: string;
  longitude: string;
  kategori: string;
  status: string;
  tingkat: string;
  tahun: string;
  nomorSK: string;
  sumber: string;
  googleMaps: string;
}

export const EMPTY_SITE_FORM: SiteFormValues = {
  nama: "",
  slug: "",
  deskripsi: "",
  kabupaten: "",
  kecamatan: "",
  alamat: "",
  latitude: "",
  longitude: "",
  kategori: "BANGUNAN",
  status: "DIDAFTARKAN",
  tingkat: "",
  tahun: "",
  nomorSK: "",
  sumber: "",
  googleMaps: "",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
