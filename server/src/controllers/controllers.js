import { audioFile } from "../models/audioFile.js";
import { metadata } from "../models/metadata.js";
import { user } from "../models/user.js";
import { Op } from "sequelize";
import { hashPassword } from "../utils/hashPassword.js";
import { upsertMetadata } from "../repos/repos.js";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { writeMetadataToFile } from "../utils/writeMetadata.js";

// controller function to create new user
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

    return res.status(201).json({
      user_id: newUser.user_id,
      email: newUser.email,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (err) {
    next(err);
  }
}

// controller function to upload audio files
export async function uploadAudio(req, res, next) {
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

    // Store uploaded files info for metadata extraction middleware
    req.uploadedFiles = uploaded;
    next();
  } catch (err) {
    next(err);
  }
}

// final handler to send upload response after metadata extraction
export function sendUploadResponse(req, res) {
  const response = req.uploadedFiles.map((file, index) => {
    const metadataResult = req.extractedMetadata?.[index];
    return {
      file_id: file.file_id,
      filename: file.filename,
      original_filename: file.original_filename,
      metadata: metadataResult?.metadata || null,
    };
  });

  res.status(201).json(response);
}

// controller function to update db with audio file metadata
export const updateMetadata = async (req, res, next) => {
  try {
    await upsertMetadata(req.body);
    res.status(200).json({ message: "Metadata updated successfully" });
  } catch (err) {
    next(err);
  }
};

// controller function to get metadata for all user's files
export async function getMetadata(req, res, next) {
  try {
    const userId = req.user.user_id;

    const userFiles = await audioFile.findAll({
      where: { user_id: userId },
      include: {
        model: metadata,
        required: false,
      },
    });

    const response = userFiles.map((file) => ({
      file_id: file.file_id,
      original_filename: file.original_filename,
      upload_date: file.upload_date,
      metadata: file.metadatum
        ? {
            title: file.metadatum.title,
            artist: file.metadatum.artist,
            album: file.metadatum.album,
            year: file.metadatum.year,
            comment: file.metadatum.comment,
            track: file.metadatum.track,
            genre: file.metadatum.genre,
            type: file.metadatum.type,
            size: file.metadatum.size,
            album_artist: file.metadatum.album_artist,
            composer: file.metadatum.composer,
            discnumber: file.metadatum.discnumber,
          }
        : null,
    }));

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

// controller function to download all audio files for a user
export async function downloadAudio(req, res, next) {
  try {
    const userId = req.user.user_id;
    const { filenames } = req.body ?? {};

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({
        error: "filenames is required and must be a non-empty array",
      });
    }

    // Get files with metadata
    const userFiles = await audioFile.findAll({
      where: {
        user_id: userId,
        original_filename: { [Op.in]: filenames },
      },
      include: { model: metadata, required: false },
    });

    if (!userFiles || userFiles.length === 0) {
      return res.status(404).json({ error: "No audio files found" });
    }

    // Create temp directory
    const tempDir = "temp";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Process files - write metadata to temp copies
    const tempFiles = [];
    for (const file of userFiles) {
      const inputPath = path.join("uploads", file.filename);
      if (!fs.existsSync(inputPath)) continue;

      const tempPath = path.join(tempDir, `${Date.now()}-${file.filename}`);

      if (file.metadatum) {
        await writeMetadataToFile(inputPath, tempPath, file.metadatum);
      } else {
        fs.copyFileSync(inputPath, tempPath);
      }

      tempFiles.push({ tempPath, originalName: file.original_filename });
    }

    // Set headers and create ZIP
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="audio-files.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => next(err));
    archive.pipe(res);

    // Add temp files to archive
    for (const { tempPath, originalName } of tempFiles) {
      archive.file(tempPath, { name: originalName });
    }

    // Clean up temp files after archive is done
    archive.on("end", () => {
      tempFiles.forEach(({ tempPath }) => fs.unlinkSync(tempPath));
    });

    await archive.finalize();
  } catch (err) {
    next(err);
  }
}
