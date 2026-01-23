import { audioFile } from "../models/audioFile.js";
import { metadata } from "../models/metadata.js";
import { Op } from "sequelize";
import { writeMetadataToFile } from "../utils/writeMetadata.js";
import archiver from "archiver";
import fs from "fs";
import path from "path";

const TEMP_DIR = "temp";
const UPLOADS_DIR = "uploads";

/**
 * Ensures the temp directory exists for storing processed files.
 */
function ensureTempDirectory() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
}

/**
 * Creates a temp file path with a unique timestamp prefix.
 * @param {string} filename - Original filename
 * @returns {string} Unique temp file path
 */
function createTempFilePath(filename) {
  return path.join(TEMP_DIR, `${Date.now()}-${filename}`);
}

/**
 * Processes a single audio file by copying it to temp directory
 * and writing metadata if available.
 * @param {Object} file - Audio file record with optional metadatum
 * @returns {Object|null} Object with tempPath and originalName, or null if source doesn't exist
 */
async function processFileForDownload(file) {
  const inputPath = path.join(UPLOADS_DIR, file.filename);

  if (!fs.existsSync(inputPath)) {
    return null;
  }

  const tempPath = createTempFilePath(file.filename);

  if (file.metadatum) {
    await writeMetadataToFile(inputPath, tempPath, file.metadatum);
  } else {
    fs.copyFileSync(inputPath, tempPath);
  }

  return { tempPath, originalName: file.original_filename };
}

/**
 * Fetches user's audio files from database and prepares them for download
 * by creating temp copies with embedded metadata.
 * @param {number} userId - The user's ID
 * @param {string[]} filenames - Array of original filenames to download
 * @returns {Promise<Array<{tempPath: string, originalName: string}>>} Prepared files
 */
export async function prepareFilesForDownload(userId, filenames) {
  const userFiles = await audioFile.findAll({
    where: {
      user_id: userId,
      original_filename: { [Op.in]: filenames },
    },
    include: { model: metadata, required: false },
  });

  if (!userFiles || userFiles.length === 0) {
    return [];
  }

  ensureTempDirectory();

  const processedFiles = await Promise.all(
    userFiles.map(processFileForDownload)
  );

  return processedFiles.filter(Boolean);
}

/**
 * Cleans up temp files after download is complete.
 * @param {Array<{tempPath: string}>} files - Files to clean up
 */
function cleanupTempFiles(files) {
  files.forEach(({ tempPath }) => {
    try {
      fs.unlinkSync(tempPath);
    } catch (err) {
      console.error(`Failed to delete temp file: ${tempPath}`, err);
    }
  });
}

/**
 * Streams prepared files as a ZIP archive to the response.
 * Handles setting headers, archiving, and cleanup.
 * @param {Array<{tempPath: string, originalName: string}>} files - Files to include in ZIP
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function for error handling
 */
export async function streamFilesAsZip(files, res, next) {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="audio-files.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("error", (err) => next(err));
  archive.on("end", () => cleanupTempFiles(files));

  archive.pipe(res);

  for (const { tempPath, originalName } of files) {
    archive.file(tempPath, { name: originalName });
  }

  await archive.finalize();
}
