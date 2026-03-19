import fs from "fs";

function cleanupUploadedFiles(req) {
  const uploadedFiles = Array.isArray(req.files)
    ? req.files
    : req.file
      ? [req.file]
      : [];

  uploadedFiles.forEach((file) => {
    if (!file?.path || !fs.existsSync(file.path)) {
      return;
    }

    try {
      fs.unlinkSync(file.path);
    } catch {
      // Ignore cleanup failures so the original error can still be returned.
    }
  });
}

// Centralized error handling middleware
export const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (req.path === "/api/upload") {
    cleanupUploadedFiles(req);
  }

  // Handle Sequelize unique constraint errors
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ error: "Email already exists" });
  }

  // Handle Sequelize validation errors
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // Handle custom errors with status codes
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  // Default server error
  return res.status(500).json({
    error: err.message || "Internal server error"
  });
};
