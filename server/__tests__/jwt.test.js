import { describe, it, expect, beforeAll } from "vitest";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../src/utils/jwt.js";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = "test-access-secret";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
});

describe("JWT utilities", () => {
  it("generateAccessToken encodes the correct user_id in the payload", () => {
    // Arrange
    const token = generateAccessToken(42);

    // Act
    const payload = verifyAccessToken(token);

    // Assert
    expect(payload.user_id).toBe(42);
  });

  it("verifyAccessToken returns the payload for a valid token", () => {
    // Arrange
    const token = generateAccessToken(5);

    // Act
    const decoded = verifyAccessToken(token);

    // Assert
    expect(decoded.user_id).toBe(5);
  });

  it("verifyAccessToken throws for an invalid token string", () => {
    // Act / Assert
    expect(() => verifyAccessToken("not.a.valid.token")).toThrow();
  });

  it("verifyRefreshToken returns the payload for a valid refresh token", () => {
    // Arrange
    const token = generateRefreshToken(10);

    // Act
    const decoded = verifyRefreshToken(token);

    // Assert
    expect(decoded.user_id).toBe(10);
  });

  it("verifyRefreshToken throws when given an access token (wrong secret)", () => {
    // Arrange
    const accessToken = generateAccessToken(1);

    // Act / Assert
    expect(() => verifyRefreshToken(accessToken)).toThrow();
  });
});
