import { describe, it, expect } from 'vitest';
import { mapAudioFileResponse } from '../src/utils/responseMappers.js';

const mockMetadatum = {
  title: 'Song Title',
  artist: 'Artist Name',
  album: 'Album Name',
  year: '2020',
  comment: null,
  track: null,
  genre: null,
  type: 'MP3',
  size: '5.0 MB',
  album_artist: null,
  composer: null,
  discnumber: null,
};

describe('mapAudioFileResponse', () => {
  it('maps all file fields correctly including nested metadata', () => {
    // Arrange
    const file = {
      file_id: 1,
      original_filename: 'song.mp3',
      upload_date: '2024-01-01',
      metadatum: mockMetadatum,
    };

    // Act
    const result = mapAudioFileResponse(file);

    // Assert
    expect(result.file_id).toBe(1);
    expect(result.original_filename).toBe('song.mp3');
    expect(result.upload_date).toBe('2024-01-01');
    expect(result.metadata.title).toBe('Song Title');
    expect(result.metadata.artist).toBe('Artist Name');
  });

  it('sets metadata to null when metadatum is null', () => {
    // Arrange
    const file = {
      file_id: 2,
      original_filename: 'track.flac',
      upload_date: '2024-01-01',
      metadatum: null,
    };

    // Act
    const result = mapAudioFileResponse(file);

    // Assert
    expect(result.metadata).toBeNull();
  });
});
