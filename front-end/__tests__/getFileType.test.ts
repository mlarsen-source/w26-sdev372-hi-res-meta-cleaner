import { describe, it, expect, vi } from 'vitest';

vi.mock('music-metadata', () => ({ parseBlob: vi.fn() }));

import { getFileType } from '../app/components/useAudioMetadata';

describe('getFileType', () => {
  it('returns extension in uppercase', () => {
    // Act / Assert
    expect(getFileType('song.mp3')).toBe('MP3');
    expect(getFileType('track.flac')).toBe('FLAC');
    expect(getFileType('audio.wav')).toBe('WAV');
  });

  it('handles already-uppercase extension', () => {
    // Act
    expect(getFileType('track.FLAC')).toBe('FLAC');
  });

  it('returns last segment for multi-dot filenames', () => {
    // Act
    expect(getFileType('my.favorite.track.mp3')).toBe('MP3');
  });

  it('returns the whole name uppercased when there is no dot', () => {
    // Act
    expect(getFileType('noextension')).toBe('NOEXTENSION');
  });
});
