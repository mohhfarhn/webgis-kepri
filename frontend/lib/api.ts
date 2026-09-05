export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

// Origin media (opsional) selaras dengan NEXT_PUBLIC_MEDIA_BASE_URL yang
// dipakai next.config.ts untuk remotePatterns next/image.
export const MEDIA_ORIGIN = (() => {
  const raw = process.env.NEXT_PUBLIC_MEDIA_BASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? path : `/uploads/${path}`}`;
}

// True jika URL bisa dioptimasi oleh next/image (origin sudah terdaftar di
// remotePatterns next.config). URL di luar daftar tetap boleh tampil lewat
// <img> polos agar tidak ada gambar yang gagal dimuat karena tidak dikenal.
export function isOptimizableImageUrl(src: string): boolean {
  if (!/^https?:\/\//i.test(src)) return false;
  let origin: string;
  try {
    origin = new URL(src).origin;
  } catch {
    return false;
  }
  try {
    if (origin === new URL(API_ORIGIN).origin) return true;
  } catch {
    /* ignore */
  }
  return MEDIA_ORIGIN != null && origin === MEDIA_ORIGIN;
}
