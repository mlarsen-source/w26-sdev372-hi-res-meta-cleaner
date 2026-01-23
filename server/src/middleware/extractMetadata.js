import { extractAndStoreMetadata } from "../services/metadataService.js";

/**
 * Middleware to extract metadata from uploaded audio files and store in database.
 * Runs after files are uploaded and AudioFile records are created.
 * Expects req.uploadedFiles to contain an array of { file_id, filename } objects.
 * Attaches extraction results to req.extractedMetadata for the response handler.
 */
export async function extractMetadata(req, res, next) {
  try {
    const uploadedFiles = req.uploadedFiles;

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return next();
    }

    const results = [];
    for (const file of uploadedFiles) {
      const result = await extractAndStoreMetadata(file);
      results.push(result);
    }

    req.extractedMetadata = results;
    next();
  } catch (err) {
    next(err);
  }
}
