import { describe, it, expect, vi, beforeAll } from 'vitest';
import authenticateUser from '../src/middleware/authenticateUser.js';
import { generateAccessToken } from '../src/utils/jwt.js';

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
});

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('authenticateUser', () => {
  it('sets req.user and calls next() for a valid token', () => {
    // Arrange
    const token = generateAccessToken(7);
    const req = { cookies: { accessToken: token } };
    const next = vi.fn();

    // Act
    authenticateUser(req, mockRes(), next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toEqual({ user_id: 7 });
  });

  it('returns 401 when the accessToken cookie is missing', () => {
    // Arrange
    const req = { cookies: {} };
    const res = mockRes();

    // Act
    authenticateUser(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 for an invalid token', () => {
    // Arrange
    const req = { cookies: { accessToken: 'bad.token.value' } };
    const res = mockRes();

    // Act
    authenticateUser(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
  });
});
