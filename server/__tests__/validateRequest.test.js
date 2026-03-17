import { describe, it, expect, vi } from 'vitest';
import { validateCreateUser, validateMetadata, validateFileIdsArray } from '../src/middleware/validateRequest.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('validateCreateUser', () => {
  it('calls next() when all required fields are present', () => {
    // Arrange
    const req = { body: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com', password: 'pass' } };
    const next = vi.fn();

    // Act
    validateCreateUser(req, mockRes(), next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when email is missing', () => {
    // Arrange
    const req = { body: { firstName: 'Jane', lastName: 'Doe', password: 'pass' } };
    const res = mockRes();

    // Act
    validateCreateUser(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when password is missing', () => {
    // Arrange
    const req = { body: { firstName: 'Jane', lastName: 'Doe', email: 'j@test.com' } };
    const res = mockRes();

    // Act
    validateCreateUser(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateFileIdsArray', () => {
  it('calls next() when fileIds is a non-empty array', () => {
    // Arrange
    const req = { body: { fileIds: [1, 2, 3] } };
    const next = vi.fn();

    // Act
    validateFileIdsArray(req, mockRes(), next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when fileIds is empty', () => {
    // Arrange
    const req = { body: { fileIds: [] } };
    const res = mockRes();

    // Act
    validateFileIdsArray(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateMetadata', () => {
  it('calls next() when file_id is present', () => {
    // Arrange
    const req = { body: { file_id: 1, title: 'Song' } };
    const next = vi.fn();

    // Act
    validateMetadata(req, mockRes(), next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when file_id is missing', () => {
    // Arrange
    const req = { body: { title: 'Song' } };
    const res = mockRes();

    // Act
    validateMetadata(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
