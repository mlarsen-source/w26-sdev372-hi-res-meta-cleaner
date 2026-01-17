import { Router } from "express";
import multer from "multer";
import path from "path";
import { createNewUser, updateMetadata, uploadAudio, sendUploadResponse, downloadAudio, getMetadata } from "../controllers/controllers.js";
import authenticateUser from "../middleware/authenticateUser.js";
import validateLogin from "../middleware/validateLogin.js";
import { validateCreateUser, validateMetadata } from "../middleware/validateRequest.js";
import { validateFiles } from "../middleware/validateFiles.js";
import { extractMetadata } from "../middleware/extractMetadata.js";

// Initialize Express router
const router = Router();

// Configure multer storage to preserve file extensions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

// Routes
router.post("/api/user", validateCreateUser, createNewUser);
router.post("/api/login", validateLogin);
router.post("/api/upload", authenticateUser, upload.array("files"), validateFiles, uploadAudio, extractMetadata, sendUploadResponse);
router.post("/api/download", authenticateUser, downloadAudio);
router.post("/api/update", validateMetadata, updateMetadata);
router.get("/api/metadata", authenticateUser, getMetadata);

// Export the configured router for use in the main application
export default router;