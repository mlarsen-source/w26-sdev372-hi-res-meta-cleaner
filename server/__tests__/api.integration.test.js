import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import express from "express";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword } from "../src/utils/hashPassword.js";

process.env.JWT_ACCESS_SECRET = "test-access-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES_IN = "1h";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.NODE_ENV = "test";

const mockValues = vi.hoisted(() => {
  const state = {
    nextUserId: 1,
    nextFileId: 1,
    users: [],
    files: [],
    metadataByFileId: new Map(),
  };

  const user = {
    create: vi.fn(async (payload) => {
      const createdUser = {
        user_id: state.nextUserId++,
        ...payload,
      };
      state.users.push(createdUser);
      return createdUser;
    }),
    findOne: vi.fn(async ({ where: { email } }) => {
      return state.users.find((entry) => entry.email === email) ?? null;
    }),
  };

  const audioFile = {
    findOne: vi.fn(async ({ where: { user_id, original_filename } }) => {
      return (
        state.files.find(
          (entry) =>
            entry.user_id === user_id &&
            entry.original_filename === original_filename
        ) ?? null
      );
    }),
    create: vi.fn(async (payload) => {
      const createdFile = {
        file_id: state.nextFileId++,
        upload_date: "2026-03-15T00:00:00.000Z",
        ...payload,
      };
      state.files.push(createdFile);
      return createdFile;
    }),
    findAll: vi.fn(async ({ where }) => {
      const fileIds =
        where.file_id && Array.isArray(Object.values(where.file_id)[0])
          ? Object.values(where.file_id)[0]
          : null;

      const matchingFiles = state.files.filter((entry) => {
        if (where.user_id !== undefined && entry.user_id !== where.user_id) {
          return false;
        }
        if (fileIds) {
          return fileIds.includes(entry.file_id);
        }
        return true;
      });

      return matchingFiles.map((entry) => ({
        ...entry,
        metadatum: state.metadataByFileId.get(entry.file_id) ?? null,
      }));
    }),
    update: vi.fn(async (values, { where: { file_id } }) => {
      const existingFile = state.files.find(
        (entry) => entry.file_id === file_id
      );
      if (existingFile) {
        Object.assign(existingFile, values);
        return [1];
      }
      return [0];
    }),
  };

  const metadata = {
    upsert: vi.fn(async (payload) => {
      const current = state.metadataByFileId.get(payload.file_id) ?? {};
      state.metadataByFileId.set(payload.file_id, {
        ...current,
        ...payload,
      });
      return [payload, true];
    }),
  };

  return {
    state,
    user,
    audioFile,
    metadata,
    parseFile: vi.fn(),
    prepareFilesForDownload: vi.fn(),
    streamFilesAsZip: vi.fn(),
  };
});

const {
  state,
  user,
  audioFile,
  metadata,
  parseFile,
  prepareFilesForDownload,
  streamFilesAsZip,
} = mockValues;

vi.mock("../src/models/User.js", () => ({ user: mockValues.user }));
vi.mock("../src/models/AudioFile.js", () => ({
  audioFile: mockValues.audioFile,
}));
vi.mock("../src/models/Metadata.js", () => ({
  metadata: mockValues.metadata,
}));
vi.mock("music-metadata", () => ({ parseFile: mockValues.parseFile }));
vi.mock("../src/services/downloadService.js", () => ({
  prepareFilesForDownload: mockValues.prepareFilesForDownload,
  streamFilesAsZip: mockValues.streamFilesAsZip,
}));

import apiRouter from "../src/routes/routes.js";
import { errorHandler } from "../src/middleware/errorHandler.js";
import { generateAccessToken } from "../src/utils/jwt.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");
const uploadsDir = path.join(serverRoot, "uploads");
const tempDir = path.join(serverRoot, "temp");

let currentServer;

function resetState() {
  state.nextUserId = 1;
  state.nextFileId = 1;
  state.users = [];
  state.files = [];
  state.metadataByFileId = new Map();
  parseFile.mockReset();
  prepareFilesForDownload.mockReset();
  streamFilesAsZip.mockReset();
  user.create.mockClear();
  user.findOne.mockClear();
  audioFile.findOne.mockClear();
  audioFile.create.mockClear();
  audioFile.findAll.mockClear();
  audioFile.update.mockClear();
  metadata.upsert.mockClear();
}

function cleanupDirectory(targetDir) {
  if (!fs.existsSync(targetDir)) {
    return;
  }

  for (const entry of fs.readdirSync(targetDir)) {
    fs.rmSync(path.join(targetDir, entry), { recursive: true, force: true });
  }
}

async function startServer() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use("/", apiRouter);
  app.use(errorHandler);

  return await new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function stopServer(server) {
  if (!server) {
    return;
  }

  await new Promise((resolve) => {
    server.close(() => resolve());
  });
}

function authCookie(userId = 1) {
  return `accessToken=${generateAccessToken(userId)}`;
}

async function seedUser(overrides = {}) {
  const password = overrides.password ?? "secret123";
  const password_hash = await hashPassword(password);
  const createdUser = {
    user_id: state.nextUserId++,
    email: overrides.email ?? "jane@example.com",
    first_name: overrides.first_name ?? "Jane",
    last_name: overrides.last_name ?? "Doe",
    password_hash,
  };
  state.users.push(createdUser);
  return { ...createdUser, password };
}

function makeAudioUpload(name = "track.mp3", type = "audio/mpeg") {
  const formData = new FormData();
  formData.append("files", new Blob(["fake audio"], { type }), name);
  return formData;
}

describe("API integration", () => {
  beforeEach(() => {
    resetState();
    currentServer = undefined;
    cleanupDirectory(uploadsDir);
    cleanupDirectory(tempDir);
  });

  afterEach(async () => {
    await stopServer(currentServer);
    cleanupDirectory(uploadsDir);
    cleanupDirectory(tempDir);
  });

  it("creates a user", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "secret123",
      }),
    });

    // Assert
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
      last_name: "Doe",
    });
    expect(state.users[0].password_hash).not.toBe("secret123");
  });

  it("logs in and sets auth cookies", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    const existingUser = await seedUser();

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: existingUser.email,
        password: existingUser.password,
      }),
    });

    const cookieHeader = response.headers.get("set-cookie") ?? "";

    // Assert
    expect(response.status).toBe(200);
    expect(cookieHeader).toContain("accessToken=");
    expect(cookieHeader).toContain("refreshToken=");
    expect(await response.json()).toMatchObject({
      user_id: existingUser.user_id,
      email: existingUser.email,
    });
  });

  it("blocks upload without auth", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/upload`, {
      method: "POST",
      body: makeAudioUpload(),
    });

    // Assert
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Authentication required" });
  });

  it("rejects non-audio uploads", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: authCookie() },
      body: makeAudioUpload("notes.txt", "text/plain"),
    });

    // Assert
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "Invalid file type(s): notes.txt. Only audio files are allowed.",
    });
    expect(state.files).toHaveLength(0);
  });

  it("uploads a file and stores extracted metadata", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    parseFile.mockResolvedValueOnce({
      common: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    });

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: authCookie() },
      body: makeAudioUpload("track.mp3", "audio/mpeg"),
    });

    const body = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      file_id: 1,
      original_filename: "track.mp3",
      metadata: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    });
    expect(state.files).toHaveLength(1);
    expect(state.metadataByFileId.get(1)).toMatchObject({
      file_id: 1,
      title: "Track One",
      artist: "Test Artist",
      album: "Test Album",
      year: 2024,
      type: "MP3",
    });
  });

  it("returns 409 for a duplicate upload", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    parseFile.mockResolvedValue({
      common: {},
    });

    // Act
    await fetch(`${appServer.baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: authCookie() },
      body: makeAudioUpload("track.mp3", "audio/mpeg"),
    });

    const response = await fetch(`${appServer.baseUrl}/api/upload`, {
      method: "POST",
      headers: { Cookie: authCookie() },
      body: makeAudioUpload("track.mp3", "audio/mpeg"),
    });

    // Assert
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'File "track.mp3" already exists.',
    });
    expect(state.files).toHaveLength(1);
  });

  it("returns the saved collection for the signed-in user", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    state.files.push({
      file_id: 1,
      user_id: 7,
      filename: "stored-file.mp3",
      original_filename: "track.mp3",
      upload_date: "2026-03-15T00:00:00.000Z",
    });
    state.metadataByFileId.set(1, {
      file_id: 1,
      title: "Track One",
      artist: "Test Artist",
      type: "MP3",
      size: "1.0 MB",
    });

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/metadata`, {
      headers: { Cookie: authCookie(7) },
    });

    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      file_id: 1,
      original_filename: "track.mp3",
      metadata: {
        title: "Track One",
        artist: "Test Artist",
        type: "MP3",
        size: "1.0 MB",
      },
    });
  });

  it("updates a filename and metadata fields", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    state.files.push({
      file_id: 1,
      user_id: 1,
      filename: "stored-file.mp3",
      original_filename: "track.mp3",
      upload_date: "2026-03-15T00:00:00.000Z",
    });

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id: 1,
        filename: "cleaned-track.mp3",
        title: "Cleaned Title",
        artist: "Cleaned Artist",
      }),
    });

    // Assert
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "Metadata updated successfully",
    });
    expect(state.files[0].original_filename).toBe("cleaned-track.mp3");
    expect(state.metadataByFileId.get(1)).toMatchObject({
      file_id: 1,
      title: "Cleaned Title",
      artist: "Cleaned Artist",
    });
  });

  it("returns 404 when download has no matching files", async () => {
    // Arrange
    const appServer = await startServer();
    currentServer = appServer.server;
    prepareFilesForDownload.mockResolvedValueOnce([]);

    // Act
    const response = await fetch(`${appServer.baseUrl}/api/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: authCookie(),
      },
      body: JSON.stringify({ fileIds: [1] }),
    });

    // Assert
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "No audio files found" });
    expect(prepareFilesForDownload).toHaveBeenCalledWith(1, [1]);
    expect(streamFilesAsZip).not.toHaveBeenCalled();
  });
});
