// URL router OSRM (format .../route/v1). Default: server demo publik OSRM.
// Untuk memakai instance lokal/self-host, set NEXT_PUBLIC_ROUTING_URL —
// mis. http://localhost:5001/route/v1 (lihat backend/osrm/). Nilai
// NEXT_PUBLIC_* di-bake saat `next build`, jadi ubah di build/restart.
export const ROUTING_URL =
  process.env.NEXT_PUBLIC_ROUTING_URL ?? "https://router.project-osrm.org/route/v1";