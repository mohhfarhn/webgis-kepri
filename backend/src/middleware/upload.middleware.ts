import multer from "multer";
import path from "path";
import { Request, NextFunction } from "express";
import { AppError } from "../utils/AppError";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

const MAGIC_BYTES: { ext: string; test: (buffer: Buffer) => boolean }[] = [
  {
    ext: ".jpg",
    test: (b) =>
      b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: ".png",
    test: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a,
  },
  {
    ext: ".gif",
    test: (b) =>
      b.length >= 4 &&
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38,
  },
  {
    ext: ".webp",
    test: (b) =>
      b.length >= 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
];

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      cb(new AppError("Hanya file gambar (jpg, jpeg, png, webp, gif) yang diperbolehkan", 400));
      return;
    }
    cb(null, true);
  },
});

export const validateUploadedImage = (
  req: Request,
  _res: unknown,
  next: NextFunction
): void => {
  if (!req.file) {
    next();
    return;
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const detector = MAGIC_BYTES.find((m) => m.ext === ext || (ext === ".jpeg" && m.ext === ".jpg"));

  if (!detector) {
    next(new AppError("Format gambar tidak dikenali", 400));
    return;
  }

  if (!req.file.buffer || !detector.test(req.file.buffer)) {
    next(new AppError("File bukan gambar yang valid (konten tidak cocok dengan ekstensi)", 400));
    return;
  }

  next();
};
