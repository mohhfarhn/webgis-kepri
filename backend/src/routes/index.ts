import { Router } from "express";

import healthRoutes from "./health.routes";
import cagarBudayaRoutes from "./cagarBudaya.routes";
import authRoutes from "./auth.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/cagar-budaya", cagarBudayaRoutes);

export default router;