import jwt from "jsonwebtoken";

/**
 * Generates an access token for the given user ID.
 * @param {number} userId - The user's ID
 * @returns {string} JWT access token
 */
export function generateAccessToken(userId) {
  return jwt.sign({ user_id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
  });
}

/**
 * Generates a refresh token for the given user ID.
 * @param {number} userId - The user's ID
 * @returns {string} JWT refresh token
 */
export function generateRefreshToken(userId) {
  return jwt.sign({ user_id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  });
}

/**
 * Verifies an access token and returns the decoded payload.
 * @param {string} token - The JWT access token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

/**
 * Verifies a refresh token and returns the decoded payload.
 * @param {string} token - The JWT refresh token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Cookie options for access token (httpOnly, secure in production)
 */
export const accessTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
};

/**
 * Cookie options for refresh token (httpOnly, secure in production)
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};
