// Middleware to validate required fields in request body
export const validateCreateUser = (req, res, next) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({
      error: "first name, last name, email, and password are required",
    });
  }

  next();
};

// Middleware to validate metadata update request
export const validateMetadata = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Metadata is required",
    });
  }

  if (req.body.file_id === undefined || req.body.file_id === null) {
    return res.status(400).json({
      error: "file_id is required",
    });
  }

  next();
};

/**
 * Validates that request body contains a non-empty filenames array.
 * Used for download requests that require a list of files to process.
 */
export const validateFileIdsArray = (req, res, next) => {
  const { fileIds } = req.body ?? {};

  if (!Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({
      error: "fileIds is required and must be a non-empty array",
    });
  }

  next();
};
