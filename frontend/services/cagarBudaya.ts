import { Category, Site, normalizeKab } from "../data/sites";
import { API_BASE_URL, resolveMediaUrl } from "../lib/api";

type ApiCategory = "BANGUNAN" | "SITUS" | "STRUKTUR" | "KAWASAN" | "BENDA";
type ApiStatus = "DITETAPKAN" | "DIDAFTARKAN" | "USULAN";
type ApiTingkat = "NASIONAL" | "PROVINSI" | "KABUPATEN";

interface GalleryApiItem {
  id: number;
  image: string;
  caption?: string | null;
  urutan: number;
}

interface CagarBudayaApiItem {
  id: number;
  slug: string;
  nama: string;
  deskripsi: string;
  kabupaten: string;
  kecamatan?: string | null;
  alamat?: string | null;
  latitude: number;
  longitude: number;
  kategori: ApiCategory;
  status: ApiStatus;
  tingkat?: ApiTingkat | null;
  tahun?: number | null;
  thumbnail?: string | null;
  nomorSK?: string | null;
  sumber?: string | null;
  googleMaps?: string | null;
  gallery?: GalleryApiItem[];
}

interface CagarBudayaApiResponse {
  success: boolean;
  data: CagarBudayaApiItem[];
}

interface CagarBudayaDetailApiResponse {
  success: boolean;
  data: CagarBudayaApiItem;
}

const categoryMap: Record<ApiCategory, Category> = {
  BANGUNAN: "bangunan",
  SITUS: "situs",
  STRUKTUR: "struktur",
  KAWASAN: "kawasan",
  BENDA: "benda",
};

const statusMap: Record<ApiStatus, Site["status"]> = {
  DITETAPKAN: "Ditetapkan",
  DIDAFTARKAN: "Didaftarkan",
  USULAN: "Usulan",
};

function mapCagarBudayaItems(items: CagarBudayaApiItem[]): Site[] {
  return items.map((item) => ({
    id: String(item.id),
    slug: item.slug,
    name: item.nama,
    kab: normalizeKab(item.kabupaten),
    kat: categoryMap[item.kategori],
    lat: item.latitude,
    lng: item.longitude,
    desc: item.deskripsi,
    kecamatan: item.kecamatan ?? undefined,
    alamat: item.alamat ?? undefined,
    tahun: item.tahun ? String(item.tahun) : undefined,
    status: statusMap[item.status],
    tingkat: item.tingkat ?? undefined,
    nomorSK: item.nomorSK ?? undefined,
    sumber: item.sumber ?? undefined,
    googleMaps: item.googleMaps ?? undefined,
    thumbnail: resolveMediaUrl(item.thumbnail),
    gallery: item.gallery
      ?.map((galleryItem) => ({
        image: resolveMediaUrl(galleryItem.image) ?? "",
        caption: galleryItem.caption ?? undefined,
      }))
      .filter((galleryItem) => galleryItem.image),
  }));
}

export async function getCagarBudayaSites(): Promise<Site[]> {
  const response = await fetch(`${API_BASE_URL}/cagar-budaya`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data cagar budaya");
  }

  const payload = (await response.json()) as CagarBudayaApiResponse;

  if (!payload.success || !Array.isArray(payload.data)) {
    throw new Error("Format data cagar budaya tidak sesuai");
  }

  return mapCagarBudayaItems(payload.data);
}

export async function getCagarBudayaSiteBySlug(slug: string): Promise<Site | null> {
  const response = await fetch(`${API_BASE_URL}/cagar-budaya/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("Gagal mengambil detail cagar budaya");
  }

  const payload = (await response.json()) as CagarBudayaDetailApiResponse;

  if (!payload.success || !payload.data) {
    throw new Error("Format detail cagar budaya tidak sesuai");
  }

  const [site] = mapCagarBudayaItems([payload.data]);
  return site ?? null;
}
