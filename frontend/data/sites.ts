

export type Category = 'bangunan' | 'situs' | 'struktur' | 'kawasan' | 'benda';

export interface Site {
  id: string;
  slug?: string;
  name: string;
  kab: string;
  kat: Category;
  lat: number;
  lng: number;
  desc: string;
  kecamatan?: string;
  alamat?: string;
  tahun?: string;
  status: 'Ditetapkan' | 'Didaftarkan' | 'Usulan';
  tingkat?: 'NASIONAL' | 'PROVINSI' | 'KABUPATEN';
  nomorSK?: string;
  sumber?: string;
  googleMaps?: string;
  thumbnail?: string;
  gallery?: {
    image: string;
    caption?: string;
  }[];
}

export const categories: Record<Category, { label: string; color: string; icon: string }> = {
  bangunan: { label: 'Bangunan', color: '#C1622D', icon: '🏛️' },
  situs:    { label: 'Situs',    color: '#3D6B35', icon: '🗿' },
  struktur: { label: 'Struktur', color: '#6B5B95', icon: '🏯' },
  kawasan:  { label: 'Kawasan',  color: '#1B6E8C', icon: '🏞️' },
  benda:    { label: 'Benda',    color: '#8C6A2F', icon: '🏺' },
};

export const kabupatenList = [
  'Tanjungpinang',
  'Batam',
  'Bintan',
  'Karimun',
  'Lingga',
  'Natuna',
  'Anambas',
];

// Menormalkan nama kabupaten dari sumber data (API/backend) agar selalu cocok
// dengan kanonik kabupatenList. Backend bisa mengirim varian seperti "Kota Batam",
// "Kab. Bintan", "Kabupaten Natuna", atau "Tanjug Pinang" — helper ini memetakan
// berdasarkan kata kunci ke bentuk kanonik. Mengembalikan string asli bila tak dikenali.
export function normalizeKab(raw: string): string {
  const value = raw.trim().toLowerCase();
  const contains = (key: string) => value.includes(key.toLowerCase());
  if (contains('tanjungpinang') || contains('tanjung pinang') || contains('tanjug')) return 'Tanjungpinang';
  if (contains('batam')) return 'Batam';
  if (contains('bintan')) return 'Bintan';
  if (contains('karimun')) return 'Karimun';
  if (contains('lingga')) return 'Lingga';
  if (contains('natuna')) return 'Natuna';
  if (contains('anambas') || contains('kepulauan anambas')) return 'Anambas';
  return raw.trim();
}
