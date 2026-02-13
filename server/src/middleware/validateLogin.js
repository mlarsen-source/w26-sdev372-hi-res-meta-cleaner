import bcrypt from "bcrypt";
import { user } from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "../utils/jwt.js";

/**
 * Validates user login credentials and issues JWT tokens.
 * Sets httpOnly cookies with access and refresh tokens on success.
 * @param {Request} req - Request with email and password in body
 * @param {Response} res - Returns 200 with user info on success, 400/401 on failure
 */
export default async function validateLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const foundUser = await user.findOne({ where: { email } });

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, foundUser.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(foundUser.user_id);
    const refreshToken = generateRefreshToken(foundUser.user_id);

    // Set httpOnly cookies
    res.cookie("accessToken", accessToken, accessTokenCookieOptions);
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    // Return user info (without password)
    return res.status(200).json({
      user_id: foundUser.user_id,
      email: foundUser.email,
      first_name: foundUser.first_name,
      last_name: foundUser.last_name,
    });
  } catch (err) {
    next(err);
  }
}
