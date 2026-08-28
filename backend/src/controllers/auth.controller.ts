import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth.middleware";
import * as authService from "../services/auth.service";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  res.status(200).json({ success: true, message: "Login berhasil", ...result });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getUserById(req.userId);
  res.status(200).json({ success: true, user });
});
