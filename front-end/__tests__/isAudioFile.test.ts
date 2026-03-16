import { describe, it, expect } from 'vitest';
import { isAudioFile } from '../app/components/UploadSection';

const makeFile = (name: string, type = '') =>
  new File([''], name, { type });

describe('isAudioFile', () => {
  it('returns true for files with an allowed MIME type', () => {
    // Act / Assert
    expect(isAudioFile(makeFile('song.mp3', 'audio/mpeg'))).toBe(true);
    expect(isAudioFile(makeFile('track.wav', 'audio/wav'))).toBe(true);
    expect(isAudioFile(makeFile('clip.aac', 'audio/aac'))).toBe(true);
  });

  it('returns false for non-audio MIME types', () => {
    // Act / Assert
    expect(isAudioFile(makeFile('photo.png', 'image/png'))).toBe(false);
    expect(isAudioFile(makeFile('doc.pdf', 'application/pdf'))).toBe(false);
  });

  it('returns true by extension when MIME type is empty', () => {
    // Act / Assert
    expect(isAudioFile(makeFile('song.flac'))).toBe(true);
    expect(isAudioFile(makeFile('audio.ogg'))).toBe(true);
    expect(isAudioFile(makeFile('track.m4a'))).toBe(true);
  });

  it('extension check is case-insensitive', () => {
    // Act / Assert
    expect(isAudioFile(makeFile('SONG.MP3'))).toBe(true);
    expect(isAudioFile(makeFile('Track.FLAC'))).toBe(true);
  });

  it('returns false for non-audio extensions with no MIME type', () => {
    // Act / Assert
    expect(isAudioFile(makeFile('photo.jpg'))).toBe(false);
    expect(isAudioFile(makeFile('data.csv'))).toBe(false);
  });
});
