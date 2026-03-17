import { Router } from "express";
import { upload } from "../config/multerConfig.js";
import { createNewUser, updateFileMetadata, createAudioRecords, sendUploadResponse, downloadAudioAsZip, getMetadata, refreshToken, logoutUser } from "../controllers/controllers.js";
import authenticateUser from "../middleware/authenticateUser.js";
import validateLogin from "../middleware/validateLogin.js";
import { validateCreateUser, validateMetadata, validateFileIdsArray } from "../middleware/validateRequest.js";
import { validateFiles } from "../middleware/validateFiles.js";
import { extractMetadata } from "../middleware/extractMetadata.js";

const router = Router();

// Auth routes
router.post("/api/user", validateCreateUser, createNewUser);
router.post("/api/login", validateLogin);
router.post("/api/refresh", refreshToken);
router.post("/api/logout", logoutUser);

// Protected routes
router.post("/api/upload", authenticateUser, upload.array("files"), validateFiles, createAudioRecords, extractMetadata, sendUploadResponse);
router.post("/api/download", authenticateUser, validateFileIdsArray, downloadAudioAsZip);
router.post("/api/update", authenticateUser, validateMetadata, updateFileMetadata);
router.get("/api/metadata", authenticateUser, getMetadata);

export default router;
