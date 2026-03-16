import { describe, it, expect, vi } from 'vitest';
import { validateFiles } from '../src/middleware/validateFiles.js';

const mockRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe('validateFiles', () => {
  it('calls next() when all uploaded files are valid audio', () => {
    // Arrange
    const req = { files: [{ mimetype: 'audio/mpeg', originalname: 'song.mp3' }] };
    const next = vi.fn();

    // Act
    validateFiles(req, mockRes(), next);

    // Assert
    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 400 when no files are uploaded', () => {
    // Arrange
    const req = { files: [] };
    const res = mockRes();

    // Act
    validateFiles(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when any file is not a valid audio type', () => {
    // Arrange
    const req = {
      files: [
        { mimetype: 'audio/mpeg', originalname: 'song.mp3' },
        { mimetype: 'image/png', originalname: 'photo.png' },
      ],
    };
    const res = mockRes();

    // Act
    validateFiles(req, res, vi.fn());

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
