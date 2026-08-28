import { Request } from "express";
import { AppError } from "./AppError";

function unwrapParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function getSlugParam(req: Request, name = "slug"): string {
  const slug = unwrapParam(req.params[name]);
  if (!slug) {
    throw new AppError("Parameter slug tidak valid", 400);
  }
  return slug;
}

export function getIntParam(req: Request, name = "id"): number {
  const raw = unwrapParam(req.params[name]);
  const id = Number(raw);
  if (!raw || !Number.isInteger(id)) {
    throw new AppError(`Parameter ${name} tidak valid`, 400);
  }
  return id;
}
