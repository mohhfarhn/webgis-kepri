import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { deleteUpload, saveUpload } from "../services/storage.service";
import { getIntParam, getSlugParam } from "../utils/request";
import * as cagarBudayaService from "../services/cagarBudaya.service";

// ── PUBLIC ──────────────────────────────────────────
export const findAll = asyncHandler(async (_req: Request, res: Response) => {
  const data = await cagarBudayaService.getAllCagarBudaya();
  res.status(200).json({
    success: true,
    message: "Data cagar budaya berhasil diambil",
    total: data.length,
    data,
  });
});

export const findBySlug = asyncHandler(async (req: Request, res: Response) => {
  const data = await cagarBudayaService.getCagarBudayaBySlug(getSlugParam(req));
  if (!data) {
    throw new AppError("Data cagar budaya tidak ditemukan", 404);
  }
  res.status(200).json({
    success: true,
    message: "Detail cagar budaya berhasil diambil",
    data,
  });
});

// ── ADMIN CRUD ──────────────────────────────────────
export const create = asyncHandler(async (req: Request, res: Response) => {
  let storedRef: string | null = null;
  try {
    if (req.file) {
      storedRef = await saveUpload(req.file.buffer, req.file.originalname);
    }
    const data = await cagarBudayaService.createCagarBudaya(req.body, storedRef ?? undefined);
    res.status(201).json({
      success: true,
      message: "Situs cagar budaya berhasil ditambahkan",
      data,
    });
  } catch (error) {
    if (storedRef) await deleteUpload(storedRef);
    throw error;
  }
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const id = getIntParam(req);
  const oldData = await cagarBudayaService.getCagarBudayaById(id);

  let storedRef: string | null = null;
  try {
    if (req.file) {
      storedRef = await saveUpload(req.file.buffer, req.file.originalname);
    }
    const data = await cagarBudayaService.updateCagarBudaya(id, req.body, storedRef ?? undefined);

    if (storedRef && oldData?.thumbnail) {
      await deleteUpload(oldData.thumbnail);
    }

    res.status(200).json({
      success: true,
      message: "Situs cagar budaya berhasil diperbarui",
      data,
    });
  } catch (error) {
    if (storedRef) await deleteUpload(storedRef);
    throw error;
  }
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const id = getIntParam(req);
  const deleted = await cagarBudayaService.deleteCagarBudaya(id);

  await deleteUpload(deleted.thumbnail);
  await Promise.all(deleted.gallery.map((item) => deleteUpload(item.image)));

  res.status(200).json({ success: true, message: "Situs cagar budaya berhasil dihapus" });
});

export const findById = asyncHandler(async (req: Request, res: Response) => {
  const data = await cagarBudayaService.getCagarBudayaById(getIntParam(req));
  if (!data) {
    throw new AppError("Data tidak ditemukan", 404);
  }
  res.status(200).json({ success: true, data });
});

// ── GALLERY ─────────────────────────────────────────
export const addGallery = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("File gambar wajib diupload", 400);
  }

  const cagarId = getIntParam(req);
  let imageRef: string | null = null;
  try {
    imageRef = await saveUpload(req.file.buffer, req.file.originalname);

    const { caption } = req.body;
    const urutan = Number(req.body.urutan) || 0;

    const data = await cagarBudayaService.addGalleryItem(cagarId, imageRef, caption, urutan);
    res.status(201).json({
      success: true,
      message: "Foto galeri berhasil ditambahkan",
      data,
    });
  } catch (error) {
    if (imageRef) await deleteUpload(imageRef);
    throw error;
  }
});

export const removeGallery = asyncHandler(async (req: Request, res: Response) => {
  const galleryId = getIntParam(req, "galleryId");
  const item = await cagarBudayaService.deleteGalleryItem(galleryId);

  await deleteUpload(item.image);

  res.status(200).json({ success: true, message: "Foto galeri berhasil dihapus" });
});
