import rateLimit from "express-rate-limit";

// Batasi percobaan login untuk mencegah brute-force: maksimal 10 percobaan per
// 15 menit per IP. Response memakai format { success, message } yang sama dengan
// handler lain agar konsisten dengan error.middleware.
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
  },
});
