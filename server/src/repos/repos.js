import { metadata } from "../models/metadata.js";
import { METADATA_FIELDS } from "../utils/metadataFields.js";
import { removeEmptyFields } from "../utils/objectHelpers.js";

/**
 * Creates or updates metadata records for audio files.
 * Accepts a single record or an array of records.
 * @param {Object|Object[]} payload - Record(s) with file_id and optional metadata fields
 * @throws {Error} If any record is missing file_id
 */
export async function upsertMetadata(payload) {
  const items = Array.isArray(payload) ? payload : [payload];

  for (const track of items) {
    if (!track || track.file_id === undefined) {
      throw new Error("file_id is required");
    }

    const updateFields = { file_id: track.file_id };
    for (const field of METADATA_FIELDS) {
      updateFields[field] = track[field];
    }

    await metadata.upsert(removeEmptyFields(updateFields));
  }
}
