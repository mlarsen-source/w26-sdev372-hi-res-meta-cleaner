/**
 * Allowed MIME types for audio file uploads.
 */
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/x-wav",
  "audio/flac",
  "audio/x-flac",
  "audio/ogg",
  "audio/aac",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aiff",
  "audio/x-aiff",
];

/**
 * Allowed file extensions for audio uploads.
 */
const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".flac", ".ogg", ".aac", ".m4a", ".aiff"];

/**
 * Checks if a file is a valid audio file by MIME type or extension.
 * @param {Object} file - Multer file object
 * @returns {boolean} True if file is a valid audio type
 */
function isAudioFile(file) {
  const mimeMatch = ALLOWED_AUDIO_TYPES.includes(file.mimetype);
  const extMatch = ALLOWED_EXTENSIONS.some((ext) =>
    file.originalname.toLowerCase().endsWith(ext)
  );
  return mimeMatch || extMatch;
}

/**
 * Middleware to validate that uploaded files are audio files.
 * Returns 400 if no files uploaded or if any files are invalid types.
 */
export function validateFiles(req, res, next) {
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  const invalidFiles = files.filter((file) => !isAudioFile(file));
  if (invalidFiles.length > 0) {
    const invalidNames = invalidFiles.map((f) => f.originalname).join(", ");
    return res.status(400).json({
      error: `Invalid file type(s): ${invalidNames}. Only audio files are allowed.`,
    });
  }

  next();
}
