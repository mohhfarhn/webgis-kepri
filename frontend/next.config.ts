import type { NextConfig } from "next";

type MediaPattern = {
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
};

function parseOrigin(rawUrl: string, fallbackPort = ""): MediaPattern | null {
  try {
    const url = new URL(rawUrl);
    return {
      protocol: url.protocol.replace(":", "") === "https" ? "https" : "http",
      hostname: url.hostname,
      port: url.port || fallbackPort,
      pathname: "/**",
    };
  } catch {
    return null;
  }
}

const apiPattern = parseOrigin(
  (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, ""),
  "5000"
);
if (apiPattern) apiPattern.pathname = "/uploads/**";

const mediaPattern =
  process.env.NEXT_PUBLIC_MEDIA_BASE_URL != null && process.env.NEXT_PUBLIC_MEDIA_BASE_URL !== ""
    ? parseOrigin(process.env.NEXT_PUBLIC_MEDIA_BASE_URL)
    : null;
if (mediaPattern) mediaPattern.pathname = "/storage/v1/object/public/**";

const remotePatterns: MediaPattern[] = [apiPattern, mediaPattern].filter(
  (p): p is MediaPattern => p !== null
);

const isLocalHost = remotePatterns.some(
  (p) => p.hostname === "localhost" || p.hostname === "127.0.0.1" || p.hostname === "[::1]"
);

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns,
    dangerouslyAllowLocalIP: isLocalHost,
  },
};

export default nextConfig;
