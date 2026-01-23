import bcrypt from "bcrypt";

const SALT = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param {string} password - Plaintext password to hash
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, SALT);
}
