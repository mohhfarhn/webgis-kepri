import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthRequest extends Request {
  userId?: number;
}

const UNAUTHORIZED_MESSAGE = "Token tidak valid atau kadaluarsa";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "Token tidak ditemukan" });
    return;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: UNAUTHORIZED_MESSAGE });
  }
};
