import { verifyAccessToken } from "../utils/jwt.js";

/**
 * Authenticates requests using JWT access token from httpOnly cookie.
 * Attaches user_id to req.user on success.
 * @param {Request} req - Request with accessToken cookie
 * @param {Response} res - Returns 401 if token is missing or invalid
 * @param {Function} next - Passes control to next middleware on success
 */
export default function authenticateUser(req, res, next) {
  try {
    const accessToken = req.cookies?.accessToken;

    if (!accessToken) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = verifyAccessToken(accessToken);
    req.user = { user_id: decoded.user_id };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    return res.status(401).json({ error: "Authentication failed" });
  }
}
