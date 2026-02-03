import { audioFile } from "../models/audioFile.js";
import { metadata } from "../models/metadata.js";
import { user } from "../models/user.js";
import { hashPassword } from "../utils/hashPassword.js";
import { upsertMetadata } from "../repos/repos.js";
import { mapAudioFileResponse, mapUploadedFileResponse } from "../utils/responseMappers.js";
import { prepareFilesForDownload, streamFilesAsZip } from "../services/downloadService.js";
import {
  generateAccessToken,
  verifyRefreshToken,
  accessTokenCookieOptions,
} from "../utils/jwt.js";

/**
 * Creates a new user account with a hashed password.
 * @param {Request} req - Request with firstName, lastName, email, password in body
 * @param {Response} res - Returns 201 with user details (excluding password)
 */
export async function createNewUser(req, res, next) {
  try {
    const { firstName, lastName, email, password } = req.body;
    const password_hash = await hashPassword(password);

    const newUser = await user.create({
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash,
    });

    res.status(201).json({
      user_id: newUser.user_id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Creates database records for uploaded audio files.
 * Actual file upload is handled by multer middleware.
 * Passes control to extractMetadata middleware after creating records.
 * @param {Request} req - Request with files array from multer and user from auth
 * @param {Response} res - Passes to next middleware
 */
export async function createAudioRecords(req, res, next) {
  try {
    const userId = req.user.user_id;
    const files = req.files;

    const uploaded = await Promise.all(
      files.map(async (file) => {
        const audio = await audioFile.create({
          user_id: userId,
          filename: file.filename,
          original_filename: file.originalname,
        });

        return {
          file_id: audio.file_id,
          filename: audio.filename,
          original_filename: audio.original_filename,
        };
      })
    );

    req.uploadedFiles = uploaded;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Sends the final response after file upload and metadata extraction.
 * Combines uploaded file info with extracted metadata.
 * @param {Request} req - Request with uploadedFiles and extractedMetadata from previous middleware
 * @param {Response} res - Returns 201 with array of file info and metadata
 */
export function sendUploadResponse(req, res) {
  const response = req.uploadedFiles.map((file, index) =>
    mapUploadedFileResponse(file, req.extractedMetadata?.[index])
  );

  res.status(201).json(response);
}

/**
 * Updates metadata for an audio file.
 * Can update both the filename and metadata fields.
 * @param {Request} req - Request with file_id, optional filename, and metadata fields in body
 * @param {Response} res - Returns 200 on success
 */
export async function updateFileMetadata(req, res, next) {
  try {
    const { file_id, filename, ...metadataFields } = req.body;

    if (filename && file_id) {
      await audioFile.update(
        { original_filename: filename },
        { where: { file_id } }
      );
    }

    await upsertMetadata({ file_id, ...metadataFields });

    res.status(200).json({ message: "Metadata updated successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Retrieves all audio files and their metadata for the authenticated user.
 * @param {Request} req - Request with user from auth middleware
 * @param {Response} res - Returns 200 with array of files and metadata
 */
export async function getMetadata(req, res, next) {
  try {
    const userId = req.user.user_id;

    const userFiles = await audioFile.findAll({
      where: { user_id: userId },
      include: { model: metadata, required: false },
    });

    res.status(200).json(userFiles.map(mapAudioFileResponse));
  } catch (err) {
    next(err);
  }
}

/**
 * Downloads requested audio files as a ZIP archive with embedded metadata.
 * Validation of filenames array is handled by validateFilenamesArray middleware.
 * @param {Request} req - Request with user from auth and filenames array in body
 * @param {Response} res - Streams ZIP file response
 */
export async function downloadAudioAsZip(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { filenames } = req.body;

    const files = await prepareFilesForDownload(userId, filenames);

    if (files.length === 0) {
      return res.status(404).json({ error: "No audio files found" });
    }

    await streamFilesAsZip(files, res, next);
  } catch (err) {
    next(err);
  }
}

/**
 * Refreshes the access token using the refresh token from cookies.
 * Issues a new access token if the refresh token is valid.
 * @param {Request} req - Request with refreshToken cookie
 * @param {Response} res - Returns 200 with new access token cookie, or 401 on failure
 */
export function refreshToken(req, res) {
  try {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const decoded = verifyRefreshToken(refreshTokenValue);
    const newAccessToken = generateAccessToken(decoded.user_id);

    res.cookie("accessToken", newAccessToken, accessTokenCookieOptions);
    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Refresh token expired, please login again" });
    }
    return res.status(401).json({ error: "Invalid refresh token" });
  }
}

/**
 * Logs out the user by clearing authentication cookies.
 * @param {Request} req - Request object
 * @param {Response} res - Returns 200 on successful logout
 */
export function logoutUser(req, res) {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json({ message: "Logged out successfully" });
}
