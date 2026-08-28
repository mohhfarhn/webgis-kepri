import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import { AppError } from "../utils/AppError";
import { isForeignKeyError, isNotFoundError, isUniqueConstraintError } from "../utils/prisma";
import { validateCagarCreate, validateCagarUpdate } from "../utils/validation";

const galleryInclude = {
  gallery: { orderBy: { urutan: "asc" } },
} satisfies Prisma.CagarBudayaInclude;

function withThumbnail(
  data: Record<string, unknown>,
  thumbnail?: string
): Prisma.CagarBudayaCreateInput {
  if (thumbnail) {
    return { ...data, thumbnail } as Prisma.CagarBudayaCreateInput;
  }
  return data as Prisma.CagarBudayaCreateInput;
}

function withThumbnailUpdate(
  data: Record<string, unknown>,
  thumbnail?: string
): Prisma.CagarBudayaUpdateInput {
  if (thumbnail) {
    return { ...data, thumbnail } as Prisma.CagarBudayaUpdateInput;
  }
  return data as Prisma.CagarBudayaUpdateInput;
}

export const getAllCagarBudaya = async () => {
  return prisma.cagarBudaya.findMany({
    include: galleryInclude,
    orderBy: { nama: "asc" },
  });
};

export const getCagarBudayaBySlug = async (slug: string) => {
  return prisma.cagarBudaya.findUnique({
    where: { slug },
    include: galleryInclude,
  });
};

export const getCagarBudayaById = async (id: number) => {
  return prisma.cagarBudaya.findUnique({
    where: { id },
    include: galleryInclude,
  });
};

export const createCagarBudaya = async (body: Record<string, unknown>, thumbnail?: string) => {
  const data = withThumbnail(validateCagarCreate(body), thumbnail);
  try {
    return await prisma.cagarBudaya.create({ data });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AppError("Slug sudah digunakan, gunakan slug yang berbeda", 400);
    }
    throw error;
  }
};

export const updateCagarBudaya = async (
  id: number,
  body: Record<string, unknown>,
  thumbnail?: string
) => {
  const data = withThumbnailUpdate(validateCagarUpdate(body), thumbnail);
  try {
    return await prisma.cagarBudaya.update({
      where: { id },
      data,
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError("Data tidak ditemukan", 404);
    }
    throw error;
  }
};

export const deleteCagarBudaya = async (id: number) => {
  try {
    return await prisma.cagarBudaya.delete({
      where: { id },
      include: { gallery: true },
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError("Data tidak ditemukan", 404);
    }
    throw error;
  }
};

export const addGalleryItem = async (
  cagarId: number,
  image: string,
  caption?: string,
  urutan = 0
) => {
  try {
    return await prisma.gallery.create({
      data: { cagarId, image, caption, urutan },
    });
  } catch (error) {
    if (isForeignKeyError(error)) {
      throw new AppError("Data cagar budaya tidak ditemukan", 404);
    }
    throw error;
  }
};

export const deleteGalleryItem = async (id: number) => {
  try {
    return await prisma.gallery.delete({ where: { id } });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw new AppError("Foto tidak ditemukan", 404);
    }
    throw error;
  }
};
