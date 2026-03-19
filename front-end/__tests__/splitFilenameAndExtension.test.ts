import { describe, it, expect } from 'vitest';
import { splitFilenameAndExtension } from '../app/lib/fileNameUtils';

describe('splitFilenameAndExtension', () => {
  it('splits a simple filename and extension', () => {
    // Act
    expect(splitFilenameAndExtension('song.mp3')).toEqual({
      fileNameWithoutExt: 'song',
      fileExtension: '.mp3',
    });
  });

  it('splits on the last dot for multi-dot filenames', () => {
    // Act
    expect(splitFilenameAndExtension('my.favorite.track.flac')).toEqual({
      fileNameWithoutExt: 'my.favorite.track',
      fileExtension: '.flac',
    });
  });

  it('returns empty extension when there is no dot', () => {
    // Act
    expect(splitFilenameAndExtension('noextension')).toEqual({
      fileNameWithoutExt: 'noextension',
      fileExtension: '',
    });
  });

  it('preserves the dot in the extension', () => {
    // Act
    const { fileExtension } = splitFilenameAndExtension('track.wav');

    // Assert
    expect(fileExtension).toBe('.wav');
  });
});
