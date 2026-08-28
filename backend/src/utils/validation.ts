import { Category, StatusCagar, TingkatCagar } from "@prisma/client";
import { AppError } from "./AppError";

const CATEGORIES = new Set<string>(Object.values(Category));
const STATUSES = new Set<string>(Object.values(StatusCagar));
const TINGKATS = new Set<string>(Object.values(TingkatCagar));

const REQUIRED_FIELDS = [
  "nama",
  "slug",
  "deskripsi",
  "kabupaten",
  "latitude",
  "longitude",
  "kategori",
  "status",
] as const;

const OPTIONAL_STRING_FIELDS = [
  "kecamatan",
  "alamat",
  "nomorSK",
  "sumber",
  "googleMaps",
] as const;

const KNOWN_FIELDS = new Set<string>([
  ...REQUIRED_FIELDS,
  ...OPTIONAL_STRING_FIELDS,
  "tingkat",
  "tahun",
]);

function fail(message: string): never {
  throw new AppError(message, 400);
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${field} wajib diisi`);
  }
  return value.trim();
}

function optionalString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    fail(`${field} harus berupa teks`);
  }
  return value.trim();
}

function toNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  // Dukung koma sebagai desimal (mis. "0,9255847" dari keyboard/locale Indonesia).
  const normalized = typeof value === "string" ? value.replace(/,/g, ".") : value;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed)) {
    fail(`${field} harus berupa angka`);
  }
  return parsed;
}

function requireNumber(value: unknown, field: string): number {
  const parsed = toNumber(value, field);
  if (parsed === undefined) {
    fail(`${field} wajib diisi`);
  }
  return parsed;
}

function optionalEnum<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>
): T | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string" || !allowed.has(value)) {
    fail(`${field} tidak valid (pilih dari: ${[...allowed].join(", ")})`);
  }
  return value as T;
}

function optionalYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = toNumber(value, "tahun");
  if (parsed === undefined) return undefined;
  if (!Number.isInteger(parsed) || parsed < 1000 || parsed > new Date().getFullYear() + 1) {
    fail("tahun harus berupa tahun yang valid");
  }
  return parsed;
}

function rejectUnknownFields(body: Record<string, unknown>): void {
  for (const key of Object.keys(body)) {
    if (!KNOWN_FIELDS.has(key)) {
      fail(`Field tidak dikenal: ${key}`);
    }
  }
}

function parseCoordinates(
  body: Record<string, unknown>
): { latitude: number; longitude: number } {
  const latitude = requireNumber(body.latitude, "latitude");
  const longitude = requireNumber(body.longitude, "longitude");
  if (latitude < -90 || latitude > 90) {
    fail("latitude harus antara -90 dan 90");
  }
  if (longitude < -180 || longitude > 180) {
    fail("longitude harus antara -180 dan 180");
  }
  return { latitude, longitude };
}

function parseSingleCoordinate(
  value: unknown,
  field: "latitude" | "longitude",
  min: number,
  max: number
): number {
  const parsed = requireNumber(value, field);
  if (parsed < min || parsed > max) {
    fail(`${field} harus antara ${min} dan ${max}`);
  }
  return parsed;
}

export function validateCagarCreate(
  body: Record<string, unknown>
): Record<string, unknown> {
  rejectUnknownFields(body);

  const result: Record<string, unknown> = {};

  for (const field of REQUIRED_FIELDS) {
    if (field === "latitude" || field === "longitude") continue;
    if (field === "kategori" || field === "status") continue;
    result[field] = requireString(body[field], field);
  }

  const { latitude, longitude } = parseCoordinates(body);
  result.latitude = latitude;
  result.longitude = longitude;

  result.kategori = optionalEnum(body.kategori, "kategori", CATEGORIES);
  if (result.kategori === undefined) {
    fail("kategori wajib diisi (pilih dari: BANGUNAN, SITUS, STRUKTUR, KAWASAN, BENDA)");
  }
  result.status = optionalEnum(body.status, "status", STATUSES);
  if (result.status === undefined) {
    fail("status wajib diisi (pilih dari: DITETAPKAN, DIDAFTARKAN, USULAN)");
  }

  for (const field of OPTIONAL_STRING_FIELDS) {
    result[field] = optionalString(body[field], field);
  }

  const tingkat = optionalEnum(body.tingkat, "tingkat", TINGKATS);
  if (tingkat !== undefined) {
    result.tingkat = tingkat;
  }
  const tahun = optionalYear(body.tahun);
  if (tahun !== undefined) {
    result.tahun = tahun;
  }

  return result;
}

export function validateCagarUpdate(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (body === undefined || body === null || Object.keys(body).length === 0) {
    fail("Tidak ada data yang dikirim untuk diperbarui");
  }
  rejectUnknownFields(body);

  const result: Record<string, unknown> = {};

  for (const field of REQUIRED_FIELDS) {
    if (body[field] === undefined) continue;
    if (field === "latitude" || field === "longitude") continue;
    if (field === "kategori" || field === "status") continue;
    result[field] = requireString(body[field], field);
  }

  if (body.latitude !== undefined || body.longitude !== undefined) {
    if (body.latitude !== undefined) {
      result.latitude = parseSingleCoordinate(body.latitude, "latitude", -90, 90);
    }
    if (body.longitude !== undefined) {
      result.longitude = parseSingleCoordinate(body.longitude, "longitude", -180, 180);
    }
  }

  const kategori = optionalEnum(body.kategori, "kategori", CATEGORIES);
  if (kategori !== undefined) result.kategori = kategori;
  const status = optionalEnum(body.status, "status", STATUSES);
  if (status !== undefined) result.status = status;

  for (const field of OPTIONAL_STRING_FIELDS) {
    if (body[field] !== undefined) {
      result[field] = optionalString(body[field], field);
    }
  }

  if (body.tingkat !== undefined) {
    const tingkat = optionalEnum(body.tingkat, "tingkat", TINGKATS);
    if (tingkat !== undefined) result.tingkat = tingkat;
  }
  if (body.tahun !== undefined) {
    const tahun = optionalYear(body.tahun);
    if (tahun !== undefined) result.tahun = tahun;
  }

  return result;
}
