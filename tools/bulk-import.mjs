import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

const API = "https://backend-mauve-eight-zxwceotmt3.vercel.app/api";

const KATEGORI_MAP = {
  bangunan: "BANGUNAN",
  building: "BANGUNAN",
  situs: "SITUS",
  site: "SITUS",
  struktur: "STRUKTUR",
  structure: "STRUKTUR",
  kawasan: "KAWASAN",
  area: "KAWASAN",
  benda: "BENDA",
  object: "BENDA",
};

const STATUS_MAP = {
  ditetapkan: "DITETAPKAN",
  tetapkan: "DITETAPKAN",
  didaftarkan: "DIDAFTARKAN",
  daftar: "DIDAFTARKAN",
  terdaftar: "DIDAFTARKAN",
  usulan: "USULAN",
  usul: "USULAN",
};

const TINGKAT_MAP = {
  nasional: "NASIONAL",
  provinsi: "PROVINSI",
  kabupaten: "KABUPATEN",
  kab: "KABUPATEN",
  kota: "KABUPATEN",
};

const ALIASES = {
  nama: ["nama", "name", "namasitus", "native"],
  slug: ["slug"],
  deskripsi: ["deskripsi", "desc", "description", "keterangan"],
  kabupaten: ["kabupaten", "kab", "kota", "kabkota", "kabupatenkota"],
  kecamatan: ["kecamatan", "kec"],
  alamat: ["alamat", "address"],
  latitude: ["latitude", "lat", "garislintang"],
  longitude: ["longitude", "lng", "lon", "garisbujur"],
  kategori: ["kategori", "kat", "jenis", "kategorisitus"],
  status: ["status", "statuscagar"],
  tingkat: ["tingkat", "peringkat"],
  tahun: ["tahun", "year"],
  nomsk: ["nomsk", "nomorsk", "no_sk", "nosk", "sk", "nomor_sk"],
  sumber: ["sumber", "source", "sumberdata"],
  googlemaps: ["googlemaps", "maps", "linkmaps", "google_maps"],
  thumbnail: ["thumbnail", "fotoutama", "fotopokok", "foto_image"],
  gallery: ["gallery", "galeri", "fotogaleri", "gamelanggalery", "images"],
};

const USAGE = `
Bulk import situs cagar budaya ke API WebGIS Kepri dari file CSV.

Cara pakai:
  node tools/bulk-import.mjs <file.csv> [opsi]

Opsi:
  --base <url>        URL API backend (default: ${API})
  --email <email>     Email admin (default: admin@webgis.id)
  --password <pass>   Password admin (default: admin123)
  --delay <ms>        Jeda antar request (default: 200)
  --delimiter <char>  Paksa pemisah kolom (default: deteksi otomatis)
  --no-skip           JANGAN lewati situs yang slug-nya sudah ada (default: lewati)

Situs yang slug-nya sudah ada di database otomatis DILEWATI, sehingga
mengimpor ulang file yang sama tidak akan menghasilkan duplikat.
  --limit <n>         Hanya impor n baris pertama (untuk uji coba)
  --dry-run           Parsing & validasi saja, tanpa mengunggah
  --help              Bantuan ini

Format CSV (baris pertama = header). Kolom wajib:
  nama, slug, deskripsi, kabupaten, latitude, longitude, kategori, status
Kolom opsional:
  kecamatan, alamat, tingkat, tahun, nomorSK, sumber, googleMaps,
  thumbnail (path file gambar lokal), gallery (daftar path foto galeri
  dipisah tanda ";").

Contoh satu baris:
  nama;slug;deskripsi;kabupaten;latitude;longitude;kategori;status;tingkat;tahun;thumbnail
  Makam Raja Haji;makam-raja-haji;Makam pahlawan nasional.;Tanjungpinang;0,9508;104,4561;SITUS;DITETAPKAN;NASIONAL;1800;foto/makam.jpg

Nilai enum (boleh fleksibel): 
  kategori   = BANGUNAN | SITUS | STRUKTUR | KAWASAN | BENDA
  status     = DITETAPKAN | DIDAFTARKAN | USULAN
  tingkat    = NASIONAL | PROVINSI | KABUPATEN
Slug wajib unik (huruf kecil, dipisah tanda "-"); jika kosong akan dibuat otomatis
dari kolom nama. Koordinat boleh pakai koma desimal ("0,925").
`;

function normalizeKey(s) {
  return (s || "").toLowerCase().replace(/[\s_\-/.]/g, "");
}

function resolveField(headerKey) {
  for (const [field, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((a) => normalizeKey(a) === headerKey)) return field;
  }
  for (const [field, aliases] of Object.entries(ALIASES)) {
    if (aliases.some((a) => headerKey.includes(normalizeKey(a)))) return field;
  }
  return null;
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

function detectDelimiter(text) {
  const firstNewline = text.indexOf("\n");
  const head = firstNewline === -1 ? text : text.slice(0, firstNewline);
  const semis = (head.match(/;/g) || []).length;
  const commas = (head.match(/,/g) || []).length;
  return semis >= commas ? ";" : ",";
}

function mapEnum(value, map, field) {
  const raw = (value || "").trim();
  if (!raw) return undefined;
  const key = normalizeKey(raw);
  if (map[key]) return map[key];
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  const firstLetter = key.slice(0, 3);
  for (const [k, v] of Object.entries(map)) {
    if (k.startsWith(firstLetter)) return v;
  }
  throw new Error(`${field} tidak dikenal: "${raw}" (boleh: ${Object.keys(map).join(", ")})`);
}

function parseYear(value) {
  const raw = (value || "").trim();
  if (!raw) return undefined;
  const match = raw.match(/\b(1[0-9]{3}|2[0-9]{3})\b/);
  if (match) return Number(match[1]);
  if (/^\d+$/.test(raw)) return Number(raw);
  return undefined;
}

function coord(value, field) {
  const raw = (value || "").trim();
  if (!raw) return "";
  return raw.replace(/,/g, ".").trim();
}

function slugFromName(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || undefined;
}

function listImages(input) {
  if (!input) return [];
  const parts = String(input)
    .split(/[;|]/)
    .map((p) => p.trim())
    .filter(Boolean);
  const found = [];
  for (const p of parts) {
    if (statSync(p, { throwIfNoEntry: false })?.isDirectory()) {
      for (const f of readdirSync(p)) {
        if (/\.(jpe?g|png|webp|gif)$/i.test(f)) found.push(resolve(p, f));
      }
    } else if (existsSync(p)) {
      found.push(resolve(p));
    } else {
      throw new Error(`File tidak ditemukan: ${p}`);
    }
  }
  return found;
}

const args = process.argv.slice(2);
if (args.length === 0 || args.includes("--help")) {
  console.log(USAGE);
  process.exit(args.includes("--help") ? 0 : 1);
}

const opts = { base: API, email: "admin@webgis.id", password: "admin123", delay: 200, skipExisting: true };
let filePath = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  const next = () => args[++i];
  if (a === "--base") opts.base = next().replace(/\/+$/, "");
  else if (a === "--email") opts.email = next();
  else if (a === "--password") opts.password = next();
  else if (a === "--delay") opts.delay = Number(next()) || 0;
  else if (a === "--delimiter") opts.delimiter = next();
  else if (a === "--no-skip") opts.skipExisting = false;
  else if (a === "--limit") opts.limit = Number(next());
  else if (a === "--dry-run") opts.dryRun = true;
  else filePath = a;
}

if (!filePath || !existsSync(filePath)) {
  console.error(`File CSV tidak ditemukan: ${filePath}`);
  process.exit(1);
}

const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
const delimiter = opts.delimiter ?? detectDelimiter(raw);
const rows = parseCsv(raw, delimiter);
if (rows.length === 0) {
  console.error("CSV kosong.");
  process.exit(1);
}

const header = rows[0].map((h) => normalizeKey(h));
const col = header.map((h) => resolveField(h, {}));
if (!col.includes("nama") || !col.includes("kategori") || !col.includes("status")) {
  console.error(
    "Header tidak dikenali. Wajib setidaknya: nama, kabupaten, latitude, longitude, kategori, status.\nKolom yang dikenali: " +
      Object.entries(ALIASES).flatMap(([k, v]) => [k, ...v]).join(", ")
  );
  process.exit(1);
}

let slugUsed = new Set();
const records = [];

for (const [idx, cells] of rows.slice(1).entries()) {
  const get = (field) => {
    const i = col.indexOf(field);
    return i === -1 ? "" : (cells[i] ?? "").trim();
  };

  let nama = get("nama").replace(/\s+/g, " ").trim();
  const kabupaten = get("kabupaten");
  const lat = coord(get("latitude"), "latitude");
  const lng = coord(get("longitude"), "longitude");

  const errors = [];
  if (!nama) errors.push("nama kosong");
  if (!kabupaten) errors.push("kabupaten kosong");
  if (!lat) errors.push("latitude kosong");
  if (!lng) errors.push("longitude kosong");

  let kategori, status;
  try {
    kategori = mapEnum(get("kategori"), KATEGORI_MAP, "kategori");
    if (!kategori) errors.push("kategori kosong");
  } catch (e) {
    errors.push(e.message);
  }
  try {
    status = mapEnum(get("status"), STATUS_MAP, "status");
    if (!status) errors.push("status kosong");
  } catch (e) {
    errors.push(e.message);
  }

  let tingkat;
  try {
    tingkat = mapEnum(get("tingkat"), TINGKAT_MAP, "tingkat");
  } catch (e) {
    errors.push(e.message);
  }

  let slug = get("slug") || slugFromName(nama);
  if (!slug) errors.push("slug kosong & gagal dibuat otomatis");
  else {
    let u = slug;
    let n = 2;
    while (slugUsed.has(u)) u = `${slug}-${n++}`;
    slug = u;
    slugUsed.add(slug);
  }

  const thumbnailPaths = listImages(get("thumbnail"));
  const galleryPaths = listImages(get("gallery"));

  const record = {
    row: idx + 2,
    nama,
    slug,
    deskripsi: get("deskripsi"),
    kabupaten,
    kecamatan: get("kecamatan"),
    alamat: get("alamat"),
    latitude: lat,
    longitude: lng,
    kategori,
    status,
    tingkat,
    tahun: parseYear(get("tahun")),
    nomorSK: get("nomsk"),
    sumber: get("sumber"),
    googleMaps: get("googlemaps"),
    thumbnailPaths,
    galleryPaths,
    errors,
  };
  records.push(record);

  if (record.errors.length > 0) {
    console.error(`baris ${record.row}: LEWAT — ${nama} → ${record.errors.join("; ")}`);
  }
}

const validCount = records.filter((r) => r.errors.length === 0).length;
console.log(
  `\nCSV: ${filePath} (delimiter "${delimiter}") — ${records.length} baris, ${validCount} valid.`
);
if (records.length !== validCount) {
  console.log("Baris dengan kesalahan dilewati. Perbaiki dan jalankan ulang.\n");
}

if (opts.dryRun) {
  for (const r of records.filter((x) => x.errors.length === 0)) {
    console.log(
      `[dry-run] ${r.slug} | ${r.nama} | ${r.kategori}/${r.status}${r.tingkat ? "/" + r.tingkat : ""} | (${r.latitude}, ${r.longitude}) | ${r.thumbnailPaths.length} thumb, ${r.galleryPaths.length} galeri`
    );
  }
  process.exit(0);
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  let token;
  try {
    const loginRes = await fetch(`${opts.base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: opts.email, password: opts.password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (!loginRes.ok || !loginData.token) {
      throw new Error(loginData.message || `Login gagal (HTTP ${loginRes.status}). Cek email/password.`);
    }
    token = loginData.token;
    console.log("Login OK.\n");
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const headers = { Authorization: `Bearer ${token}` };

  let existingSlugs = new Set();
  if (opts.skipExisting) {
    try {
      const listRes = await fetch(`${opts.base}/cagar-budaya`);
      const listData = await listRes.json().catch(() => ({}));
      existingSlugs = new Set((listData.data ?? []).map((s) => s.slug).filter(Boolean));
      console.log(`Skip-duplikat aktif: ${existingSlugs.size} slug sudah ada di DB.`);
    } catch {
      console.log("Tidak dapat mengambil daftar slug, lanjut tanpa skip-duplikat.");
      existingSlugs = new Set();
    }
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of records) {
    if (r.errors.length > 0) {
      failed++;
      continue;
    }
    if (opts.skipExisting && existingSlugs.has(r.slug)) {
      skipped++;
      console.log(`– [${r.row}] ${r.slug} — sudah ada, dilewati`);
      continue;
    }
    try {
      const form = new FormData();
      const fields = {
        nama: r.nama,
        slug: r.slug,
        deskripsi: r.deskripsi,
        kabupaten: r.kabupaten,
        kecamatan: r.kecamatan,
        alamat: r.alamat,
        latitude: r.latitude,
        longitude: r.longitude,
        kategori: r.kategori,
        status: r.status,
        tingkat: r.tingkat,
      };
      if (r.tahun !== undefined) fields.tahun = String(r.tahun);
      if (r.nomorSK) fields.nomorSK = r.nomorSK;
      if (r.sumber) fields.sumber = r.sumber;
      if (r.googleMaps) fields.googleMaps = r.googleMaps;
      for (const [k, v] of Object.entries(fields)) {
        if (v !== undefined && v !== null && v !== "") form.append(k, String(v));
      }

      if (r.thumbnailPaths.length > 0) {
        const p = r.thumbnailPaths[0];
        const buf = readFileSync(p);
        form.append("thumbnail", new Blob([buf], { type: "image/jpeg" }), basename(p));
      }

      const res = await fetch(`${opts.base}/cagar-budaya`, {
        method: "POST",
        headers,
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      const id = data.data?.id;

      const galleryFiles = r.galleryPaths.filter((p) => p !== r.thumbnailPaths[0]);
      for (const p of galleryFiles) {
        const buf = readFileSync(p);
        const gForm = new FormData();
        gForm.append("image", new Blob([buf], { type: "image/jpeg" }), basename(p));
        const gRes = await fetch(`${opts.base}/cagar-budaya/${id}/gallery`, {
          method: "POST",
          headers,
          body: gForm,
        });
        if (!gRes.ok) {
          const gData = await gRes.json().catch(() => ({}));
          console.log(`  ⚠️  galeri ${basename(p)} gagal: ${gData.message || gRes.status}`);
        }
        await sleep(opts.delay);
      }

      success++;
      existingSlugs.add(r.slug);
      console.log(
        `✓ [${r.row}] ${r.slug} — ${r.thumbnailPaths.length > 0 ? `thumb + ${r.galleryPaths.length} foto` : `${r.galleryPaths.length} foto`}`
      );
    } catch (e) {
      failed++;
      console.error(`✗ [${r.row}] ${r.slug} — ${e.message}`);
    }
    await sleep(opts.delay);
  }

  const summary = `\nSelesai: ${success} berhasil, ${failed} gagal${skipped ? `, ${skipped} dilewati (sudah ada)` : ""}.`;
  console.log(summary);
  process.exit(failed > 0 ? 1 : 0);
}

main();