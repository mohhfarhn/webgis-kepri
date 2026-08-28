import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { upload, validateUploadedImage } from "../middleware/upload.middleware";
import * as cagarBudayaController from "../controllers/cagarBudaya.controller";

const router = Router();

// Public routes
router.get("/", cagarBudayaController.findAll);
router.get("/:slug", cagarBudayaController.findBySlug);

// Protected routes
router.use(authMiddleware);

router.get("/id/:id", cagarBudayaController.findById);
router.post(
  "/",
  upload.single("thumbnail"),
  validateUploadedImage,
  cagarBudayaController.create
);
router.put(
  "/:id",
  upload.single("thumbnail"),
  validateUploadedImage,
  cagarBudayaController.update
);
router.delete("/:id", cagarBudayaController.remove);

// Gallery routes
router.post(
  "/:id/gallery",
  upload.single("image"),
  validateUploadedImage,
  cagarBudayaController.addGallery
);
router.delete("/:id/gallery/:galleryId", cagarBudayaController.removeGallery);

export default router;
