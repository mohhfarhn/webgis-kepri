import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { loginRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

router.post("/login", loginRateLimiter, login);
router.get("/me", authMiddleware, me);

export default router;
