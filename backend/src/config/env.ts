import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value.trim() : undefined;
}

const storageDriver = process.env.STORAGE_DRIVER === "supabase" ? "supabase" : "local";
const supabaseUrl = optionalEnv("SUPABASE_URL");
const supabaseServiceKey = optionalEnv("SUPABASE_SERVICE_ROLE_KEY");

if (storageDriver === "supabase" && (!supabaseUrl || !supabaseServiceKey)) {
  throw new Error(
    "STORAGE_DRIVER=supabase membutuhkan SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY"
  );
}

export const env = {
  port: Number(process.env.PORT) || 5000,
  jwtSecret: requireEnv("JWT_SECRET"),
  allowedOrigins: (process.env.ALLOWED_ORIGIN ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  storageDriver,
  supabaseUrl,
  supabaseServiceKey,
  supabaseBucket: process.env.SUPABASE_BUCKET || "uploads",
} as const;
