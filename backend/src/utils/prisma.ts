import { Prisma } from "@prisma/client";
import { PrismaErrorCode } from "../constants/prismaErrors";

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isUniqueConstraintError(error: unknown): boolean {
  return isPrismaError(error) && error.code === PrismaErrorCode.UNIQUE_CONSTRAINT;
}

export function isNotFoundError(error: unknown): boolean {
  return isPrismaError(error) && error.code === PrismaErrorCode.NOT_FOUND;
}

export function isForeignKeyError(error: unknown): boolean {
  return isPrismaError(error) && error.code === PrismaErrorCode.FOREIGN_KEY_CONSTRAINT;
}
