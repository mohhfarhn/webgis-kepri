import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppError } from "../utils/AppError";
import { isPrismaError } from "../utils/prisma";
import { PrismaErrorCode } from "../constants/prismaErrors";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error(error);

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }

  if (isPrismaError(error)) {
    if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT) {
      res.status(400).json({ success: false, message: "Slug sudah digunakan, gunakan slug yang berbeda" });
      return;
    }
    if (error.code === PrismaErrorCode.NOT_FOUND) {
      res.status(404).json({ success: false, message: "Data tidak ditemukan" });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ success: false, message: "Data yang dikirim tidak valid" });
    return;
  }

  res.status(500).json({ success: false, message: "Internal Server Error" });
};
