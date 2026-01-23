/**
 * Response mapping utilities for consistent API responses.
 * Centralizes the transformation of database models to API response formats.
 */

import { METADATA_FIELDS } from "./metadataFields.js";

/**
 * Maps a metadata database record to API response format.
 * @param {Object|null} metadatum - Sequelize metadata instance
 * @returns {Object|null} Mapped metadata object or null
 */
export function mapMetadata(metadatum) {
  if (!metadatum) return null;

  return METADATA_FIELDS.reduce((acc, field) => {
    acc[field] = metadatum[field];
    return acc;
  }, {});
}

/**
 * Maps an audio file with its metadata to API response format.
 * Used by getMetadata endpoint.
 * @param {Object} file - Sequelize audioFile instance with included metadatum
 * @returns {Object} Mapped response object
 */
export function mapAudioFileResponse(file) {
  return {
    file_id: file.file_id,
    original_filename: file.original_filename,
    upload_date: file.upload_date,
    metadata: mapMetadata(file.metadatum),
  };
}

/**
 * Maps an uploaded file with extracted metadata to API response format.
 * Used by sendUploadResponse endpoint.
 * @param {Object} file - Uploaded file info object
 * @param {Object|null} metadataResult - Extracted metadata result
 * @returns {Object} Mapped response object
 */
export function mapUploadedFileResponse(file, metadataResult) {
  return {
    file_id: file.file_id,
    filename: file.filename,
    original_filename: file.original_filename,
    metadata: metadataResult?.metadata || null,
  };
}
