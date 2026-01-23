// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err);

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
