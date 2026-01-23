import { Router } from "express";
import { upload } from "../config/multerConfig.js";
import { createNewUser, updateFileMetadata, createAudioRecords, sendUploadResponse, downloadAudioAsZip, getMetadata } from "../controllers/controllers.js";
import authenticateUser from "../middleware/authenticateUser.js";
import validateLogin from "../middleware/validateLogin.js";
import { validateCreateUser, validateMetadata, validateFilenamesArray } from "../middleware/validateRequest.js";
import { validateFiles } from "../middleware/validateFiles.js";
import { extractMetadata } from "../middleware/extractMetadata.js";

const router = Router();

router.post("/api/user", validateCreateUser, createNewUser);
router.post("/api/login", validateLogin);
router.post("/api/upload", authenticateUser, upload.array("files"), validateFiles, createAudioRecords, extractMetadata, sendUploadResponse);
router.post("/api/download", authenticateUser, validateFilenamesArray, downloadAudioAsZip);
router.post("/api/update", validateMetadata, updateFileMetadata);
router.get("/api/metadata", authenticateUser, getMetadata);

export default router;
