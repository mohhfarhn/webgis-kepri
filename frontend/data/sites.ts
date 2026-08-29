

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

export const sites: Site[] = [
  {
    id: 's1',
    name: 'Kompleks Makam Kerkhoff Belanda',
    kab: 'Tanjungpinang',
    kat: 'situs',
    lat: 0.9258576196324168,
    lng: 104.44690814047243,
    desc: 'Pemakaman ini merupakan pemakaman orang Belanda. Berdasarkan inskripsi yang terdapat pada nisan-nisan di perkuburan itu dapat ditarik kesimpulan bahwa makam ini mulai dipergunakan pada abad ke-19 sampai abad ke-20. Angka tahun tertua yang terdapat pada nisan bertarikh tahun 1897, dan angka tahun termuda bertarikh tahun 1962.',
    tahun: 'Abad ke-19',
    status: 'Ditetapkan',
  },
  {
    id: 's2',
    name: 'Masjid Raya Sultan Riau',
    kab: 'Tanjungpinang',
    kat: 'bangunan',
    lat: 0.9461,
    lng: 104.4523,
    desc: 'Masjid bersejarah di Pulau Penyengat yang dibangun pada masa Kesultanan Riau-Lingga. Konon pondasinya dicampur putih telur.',
    tahun: '1844',
    status: 'Ditetapkan',
  },
  {
    id: 's3',
    name: 'Benteng Bukit Kursi',
    kab: 'Lingga',
    kat: 'struktur',
    lat: -0.3781,
    lng: 104.5662,
    desc: 'Benteng pertahanan peninggalan Kesultanan Riau-Lingga yang berdiri menghadap Selat Riau, digunakan untuk pertahanan laut.',
    tahun: 'Abad ke-18',
    status: 'Ditetapkan',
  },
  {
    id: 's4',
    name: 'Makam Raja Haji Fisabilillah',
    kab: 'Tanjungpinang',
    kat: 'situs',
    lat: 0.9508,
    lng: 104.4561,
    desc: 'Kompleks pemakaman pahlawan nasional dan tokoh Kesultanan Riau di Pulau Penyengat. Raja Haji dikenal sebagai Pahlawan Nasional Indonesia.',
    tahun: 'Abad ke-18',
    status: 'Ditetapkan',
  },
  {
    id: 's5',
    name: 'Museum Linggam Cahaya',
    kab: 'Tanjungpinang',
    kat: 'benda',
    lat: 0.9143,
    lng: 104.4451,
    desc: 'Museum daerah yang menyimpan koleksi sejarah dan budaya Melayu Kepulauan Riau, termasuk naskah kuno dan artefak kerajaan.',
    tahun: '2000-an',
    status: 'Ditetapkan',
  },
  {
    id: 's6',
    name: 'Vihara Ksitigarbha Bodhisattva',
    kab: 'Batam',
    kat: 'bangunan',
    lat: 1.1301,
    lng: 104.0529,
    desc: 'Vihara bersejarah dengan akulturasi budaya Tionghoa-Melayu di pesisir Batam, salah satu vihara tertua di Kepulauan Riau.',
    tahun: 'Abad ke-19',
    status: 'Didaftarkan',
  },
  {
    id: 's7',
    name: 'Rumah Kapitan',
    kab: 'Karimun',
    kat: 'bangunan',
    lat: 1.0644,
    lng: 103.4244,
    desc: 'Rumah panggung tua peninggalan era kolonial yang berfungsi sebagai pusat administrasi komunitas Tionghoa di Karimun.',
    tahun: 'Awal abad ke-20',
    status: 'Didaftarkan',
  },
  {
    id: 's8',
    name: 'Benteng Tanjung Berakit',
    kab: 'Bintan',
    kat: 'struktur',
    lat: 1.1907,
    lng: 104.5995,
    desc: 'Sisa-sisa benteng pengawasan jalur pelayaran di ujung utara Pulau Bintan, penting secara strategis di masa kolonial.',
    tahun: 'Abad ke-18',
    status: 'Didaftarkan',
  },
  {
    id: 's9',
    name: 'Makam Engku Putri Raja Hamidah',
    kab: 'Tanjungpinang',
    kat: 'situs',
    lat: 0.9492,
    lng: 104.4538,
    desc: 'Makam permaisuri Kesultanan Riau yang dihormati sebagai tokoh penjaga regalia kerajaan dan simbol kedaulatan Melayu.',
    tahun: 'Abad ke-19',
    status: 'Ditetapkan',
  },
  {
    id: 's10',
    name: 'Klenteng Tua Pasar Bawah',
    kab: 'Tanjungpinang',
    kat: 'bangunan',
    lat: 0.9152,
    lng: 104.4480,
    desc: 'Klenteng tertua di kawasan pecinan Tanjungpinang, masih aktif digunakan dan menjadi pusat kegiatan budaya Tionghoa lokal.',
    tahun: 'Abad ke-19',
    status: 'Didaftarkan',
  },
  {
    id: 's11',
    name: 'Situs Megalitik Pulau Mantang',
    kab: 'Bintan',
    kat: 'situs',
    lat: 0.9763,
    lng: 104.5841,
    desc: 'Temuan struktur batu kuno yang diduga peninggalan masa pra-sejarah pesisir, menunjukkan bukti permukiman awal di Kepulauan Riau.',
    tahun: 'Pra-sejarah',
    status: 'Usulan',
  },
  {
    id: 's12',
    name: 'Museum Sejarah Natuna',
    kab: 'Natuna',
    kat: 'benda',
    lat: 3.6042,
    lng: 108.2122,
    desc: 'Museum yang menampilkan jejak perdagangan maritim dan budaya pesisir Natuna, termasuk koleksi benda-benda dari jalur sutra laut.',
    tahun: '2010-an',
    status: 'Ditetapkan',
  },
  {
    id: 's13',
    name: 'Masjid Jami Pulau Penyengat',
    kab: 'Tanjungpinang',
    kat: 'bangunan',
    lat: 0.9438,
    lng: 104.4502,
    desc: 'Masjid kuno dengan ornamen kuning khas Melayu di Pulau Penyengat. Terkenal dengan kisah pembangunannya menggunakan putih telur.',
    tahun: 'Abad ke-19',
    status: 'Ditetapkan',
  },
  {
    id: 's14',
    name: 'Benteng Pulau Senjulung',
    kab: 'Anambas',
    kat: 'struktur',
    lat: 3.0215,
    lng: 106.2452,
    desc: 'Benteng pengawasan rute pelayaran kuno di gugusan Kepulauan Anambas, sisa kejayaan maritim Kesultanan Riau.',
    tahun: 'Abad ke-18',
    status: 'Usulan',
  },
  {
    id: 's15',
    name: 'Makam Tuan Guru Penyengat',
    kab: 'Tanjungpinang',
    kat: 'situs',
    lat: 0.9479,
    lng: 104.4517,
    desc: 'Makam ulama berpengaruh dalam penyebaran ajaran Islam di Pulau Penyengat dan sekitarnya pada abad ke-19.',
    tahun: 'Abad ke-19',
    status: 'Ditetapkan',
  },
];
