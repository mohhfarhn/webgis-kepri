import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const TOKEN_EXPIRES_IN = "7d";

export const login = async (email: string, password: string) => {
  if (!email || !password) {
    throw new AppError("Email dan password wajib diisi", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError("Email atau password salah", 401);
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new AppError("Email atau password salah", 401);
  }

  const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: TOKEN_EXPIRES_IN });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
};

export const getUserById = async (id?: number) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    throw new AppError("User tidak ditemukan", 404);
  }

  return user;
};
