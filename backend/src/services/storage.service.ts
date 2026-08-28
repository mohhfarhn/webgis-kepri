import fs from "fs";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { env } from "../config/env";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const supabase: SupabaseClient | null =
  env.storageDriver === "supabase" && env.supabaseUrl && env.supabaseServiceKey
    ? createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

function buildFileName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${unique}${ext}`;
}

export const saveUpload = async (
  buffer: Buffer,
  originalName: string
): Promise<string> => {
  const fileName = buildFileName(originalName);

  if (supabase) {
    const contentType = CONTENT_TYPES[path.extname(originalName).toLowerCase()] ?? "application/octet-stream";
    const { error } = await supabase.storage
      .from(env.supabaseBucket)
      .upload(fileName, buffer, { contentType, upsert: false });
    if (error) {
      throw new Error(`Gagal mengunggah file ke storage: ${error.message}`);
    }
    const { data } = supabase.storage.from(env.supabaseBucket).getPublicUrl(fileName);
    return data.publicUrl;
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
  fs.writeFileSync(path.join(UPLOADS_DIR, fileName), buffer);
  return `/uploads/${fileName}`;
};

export const deleteUpload = async (ref?: string | null): Promise<void> => {
  if (!ref) return;

  if (/^https?:\/\//i.test(ref)) {
    if (!supabase) return;
    const marker = `/storage/v1/object/public/${env.supabaseBucket}/`;
    const idx = ref.indexOf(marker);
    if (idx === -1) return;
    const filePath = decodeURIComponent(ref.slice(idx + marker.length).split("?")[0]);
    const { error } = await supabase.storage.from(env.supabaseBucket).remove([filePath]);
    if (error) {
      console.error("Gagal menghapus file di storage:", error.message);
    }
    return;
  }

  const fileName = ref.replace(/^\/uploads\//, "");
  if (!fileName) return;
  const filePath = path.join(UPLOADS_DIR, fileName);
  try {
    fs.rmSync(filePath, { force: true });
  } catch (error) {
    console.error("Gagal menghapus file:", filePath, error);
  }
};
