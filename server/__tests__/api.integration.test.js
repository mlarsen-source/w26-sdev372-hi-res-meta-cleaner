import cookieParser from "cookie-parser";
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../src/utils/hashPassword.js";

vi.mock("../src/models/User.js", () => ({
  user: { create: vi.fn(), findOne: vi.fn() },
}));
vi.mock("../src/models/AudioFile.js", () => ({
  audioFile: {
    findOne: vi.fn(),
    create: vi.fn(),
    findAll: vi.fn(),
    update: vi.fn(),
  },
}));
vi.mock("../src/models/Metadata.js", () => ({
  metadata: { upsert: vi.fn() },
}));
vi.mock("music-metadata", () => ({ parseFile: vi.fn() }));
vi.mock("../src/services/downloadService.js", () => ({
  prepareFilesForDownload: vi.fn(),
  streamFilesAsZip: vi.fn(),
}));

import { user } from "../src/models/User.js";
import { audioFile } from "../src/models/AudioFile.js";
import { metadata } from "../src/models/Metadata.js";
import { parseFile } from "music-metadata";
import {
  prepareFilesForDownload,
  streamFilesAsZip,
} from "../src/services/downloadService.js";
import apiRouter from "../src/routes/routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { generateAccessToken } from "../src/utils/jwt.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.NODE_ENV = "test";

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/", apiRouter);
app.use(errorHandler);

function authCookie(userId = 1) {
  return `accessToken=${generateAccessToken(userId)}`;
}

describe("API routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a user", async () => {
    // Arrange
    user.create.mockResolvedValue({
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
    });

    // Act
    const response = await request(app).post("/api/user").send({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret123",
    });

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
    });
  });

  it("logs in and sets auth cookies", async () => {
    // Arrange
    const password_hash = await hashPassword("secret123");
    const existingUser = {
      user_id: 1,
      email: "jane@example.com",
      password_hash,
    };
    user.findOne.mockResolvedValue(existingUser);

    // Act
    const response = await request(app).post("/api/login").send({
      email: existingUser.email,
      password: "secret123",
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([
        expect.stringContaining("accessToken="),
        expect.stringContaining("refreshToken="),
      ])
    );
    expect(response.body).toMatchObject({
      user_id: existingUser.user_id,
      email: existingUser.email,
    });
  });

  it("blocks upload without auth", async () => {
    // Act
    const response = await request(app)
      .post("/api/upload")
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: "Authentication required" });
  });

  it("rejects non-audio uploads", async () => {
    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake text"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });

    // Assert
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Invalid file type(s): notes.txt. Only audio files are allowed.",
    });
  });

  it("uploads a file and stores extracted metadata", async () => {
    // Arrange
    audioFile.findOne.mockResolvedValue(null);
    audioFile.create.mockResolvedValue({
      file_id: 1,
      user_id: 1,
      filename: "files-1234567890-123.mp3",
      original_filename: "track.mp3",
    });
    parseFile.mockResolvedValue({
      common: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
      format: {
        container: "MPEG",
      },
    });
    metadata.upsert.mockResolvedValue([
      { file_id: 1, title: "Track One" },
      true,
    ]);
    audioFile.findAll.mockResolvedValue([
      {
        file_id: 1,
        original_filename: "track.mp3",
        metadatum: {
          title: "Track One",
          artist: "Test Artist",
          album: "Test Album",
          year: 2024,
        },
      },
    ]);

    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toMatchObject({
      file_id: 1,
      original_filename: "track.mp3",
      metadata: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    });
  });

  it("returns 409 for a duplicate upload", async () => {
    // Arrange
    audioFile.findOne.mockResolvedValue({ file_id: 1 });

    // Act
    const response = await request(app)
      .post("/api/upload")
      .set("Cookie", authCookie())
      .attach("files", Buffer.from("fake audio"), "track.mp3");

    // Assert
    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: 'File "track.mp3" already exists.',
    });
  });

  it("returns the saved collection for the signed-in user", async () => {
    // Arrange
    audioFile.findAll.mockResolvedValue([
      {
        file_id: 1,
        original_filename: "track.mp3",
        metadatum: { title: "Track One", artist: "Test Artist" },
      },
    ]);

    // Act
    const response = await request(app)
      .get("/api/metadata")
      .set("Cookie", authCookie(7));

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].metadata.title).toBe("Track One");
  });

  it("updates a filename and metadata fields", async () => {
    // Arrange
    audioFile.update.mockResolvedValue([1]);
    metadata.upsert.mockResolvedValue([{}, true]);

    // Act
    const response = await request(app).post("/api/update").send({
      file_id: 1,
      filename: "cleaned-track.mp3",
      title: "Cleaned Title",
      artist: "Cleaned Artist",
    });

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Metadata updated successfully",
    });
  });

  it("returns 404 when download has no matching files", async () => {
    // Arrange
    prepareFilesForDownload.mockResolvedValue([]);

    // Act
    const response = await request(app)
      .post("/api/download")
      .set("Cookie", authCookie())
      .send({ fileIds: [1] });

    // Assert
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "No audio files found" });
    expect(prepareFilesForDownload).toHaveBeenCalledWith(1, [1]);
    expect(streamFilesAsZip).not.toHaveBeenCalled();
  });
});
