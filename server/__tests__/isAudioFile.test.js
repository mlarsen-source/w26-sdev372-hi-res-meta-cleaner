import { describe, it, expect } from 'vitest';
import { isAudioFile } from '../src/middleware/validateFiles.js';

describe('isAudioFile', () => {
  it('returns true for a valid audio MIME type', () => {
    // Act
    expect(isAudioFile({ mimetype: 'audio/mpeg', originalname: 'song.mp3' })).toBe(true);
  });

  it('returns false for a non-audio MIME type and extension', () => {
    // Act
    expect(isAudioFile({ mimetype: 'image/png', originalname: 'photo.png' })).toBe(false);
  });

  it('returns true by extension when MIME type is not recognized', () => {
    // Act
    expect(isAudioFile({ mimetype: '', originalname: 'track.flac' })).toBe(true);
  });

  it('extension check is case-insensitive', () => {
    // Act
    expect(isAudioFile({ mimetype: '', originalname: 'SONG.MP3' })).toBe(true);
  });
});
