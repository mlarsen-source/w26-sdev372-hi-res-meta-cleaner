import multer from "multer";
import path from "path";
import fs from "fs";
import { isAudioFile } from "../middleware/validateFiles.js";

const UPLOADS_DIR = "uploads/";

// Ensure the uploads directory exists. Create recursively if missing so multer won't fail.
const uploadsPath = path.resolve(process.cwd(), UPLOADS_DIR);
try {
  fs.mkdirSync(uploadsPath, { recursive: true });
} catch (e) {
  // If creation fails, we still allow multer to attempt and let the error be handled upstream
  // but log for easier debugging.
  console.error("Failed to create uploads directory:", uploadsPath, e);
}

// Saves uploaded files to uploads directory with unique filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

function buildInvalidFileError(file) {
  const error = new Error(
    `Invalid file type(s): ${file.originalname}. Only audio files are allowed.`
  );
  error.status = 400;
  return error;
}

export const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    if (isAudioFile(file)) {
      cb(null, true);
      return;
    }

    cb(buildInvalidFileError(file));
  },
});
