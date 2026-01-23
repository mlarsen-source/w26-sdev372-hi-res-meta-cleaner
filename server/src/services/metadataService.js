import * as musicMetadata from "music-metadata";
import path from "path";
import fs from "fs";
import { upsertMetadata } from "../repos/repos.js";
import { formatFileSize } from "../utils/formatters.js";

const UPLOADS_DIR = "uploads";

/**
 * Gets file type and size information for an audio file.
 * Returns null values if file cannot be accessed.
 * @param {string} filePath - Path to the file
 * @param {string} filename - Original filename for extension extraction
 * @returns {{fileType: string|null, fileSize: string|null}}
 */
export function getFileInfo(filePath, filename) {
  const fileType = path.extname(filename).slice(1).toUpperCase() || null;

  let fileSize = null;
  try {
    const stats = fs.statSync(filePath);
    fileSize = formatFileSize(stats.size);
  } catch {
    // File may not exist or be inaccessible
  }

  return { fileType, fileSize };
}

/**
 * Extracts comment text from music-metadata comment array.
 * Comments can be strings or objects with a text property.
 * @param {Array} commentArray - Array of comments from music-metadata
 * @returns {string|null} First comment text or null
 */
export function extractCommentText(commentArray) {
  if (!commentArray || commentArray.length === 0) {
    return null;
  }

  const firstComment = commentArray[0];

  if (typeof firstComment === "string") {
    return firstComment;
  }

  return firstComment?.text || null;
}

/**
 * Builds a metadata record object from parsed audio metadata.
 * @param {number} fileId - Database file ID
 * @param {Object} common - Common metadata from music-metadata parser
 * @param {{fileType: string|null, fileSize: string|null}} fileInfo - File type and size
 * @returns {Object} Metadata record ready for database insertion
 */
export function buildMetadataRecord(fileId, common, fileInfo) {
  return {
    file_id: fileId,
    title: common.title || null,
    artist: common.artist || null,
    album: common.album || null,
    year: common.year || null,
    comment: extractCommentText(common.comment),
    track: common.track?.no || null,
    genre: common.genre?.[0] || null,
    type: fileInfo.fileType,
    size: fileInfo.fileSize,
    album_artist: common.albumartist || null,
    composer: common.composer?.[0] || null,
    discnumber: common.disk?.no || null,
  };
}

/**
 * Extracts metadata from an uploaded audio file and stores it in the database.
 * If metadata extraction fails, stores minimal info (file type and size).
 * @param {Object} file - Uploaded file object with file_id and filename
 * @returns {Promise<{file_id: number, metadata: Object|null, success: boolean, error?: string}>}
 */
export async function extractAndStoreMetadata(file) {
  const filePath = path.join(UPLOADS_DIR, file.filename);
  const fileInfo = getFileInfo(filePath, file.filename);

  try {
    console.log(`Extracting metadata from: ${filePath}`);
    const parsed = await musicMetadata.parseFile(filePath);
    console.log(`Extracted metadata:`, JSON.stringify(parsed.common, null, 2));

    const metadataRecord = buildMetadataRecord(file.file_id, parsed.common, fileInfo);
    await upsertMetadata(metadataRecord);

    return {
      file_id: file.file_id,
      metadata: metadataRecord,
      success: true,
    };
  } catch (parseError) {
    console.warn(
      `Could not extract metadata from ${file.filename}:`,
      parseError.message
    );

    const minimalRecord = {
      file_id: file.file_id,
      type: fileInfo.fileType,
      size: fileInfo.fileSize,
    };
    await upsertMetadata(minimalRecord);

    return {
      file_id: file.file_id,
      metadata: null,
      success: false,
      error: parseError.message,
    };
  }
}
