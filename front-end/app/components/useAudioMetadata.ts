'use client';

import { parseBlob } from 'music-metadata';
import { AudioFile } from '../types/audio';

export async function extractMetadata(files: File[]): Promise<AudioFile[]> {
  return Promise.all(
    files.map(async (file, index) => {
      try {
        const metadata = await parseBlob(file);

        return {
          id: index,
          title: metadata.common.title ?? file.name,
          artist: metadata.common.artist ?? 'Unknown',
          album: metadata.common.album ?? 'Unknown',
          albumartist: metadata.common.albumartist ?? 'Unknown',
          year: metadata.common.year?.toString() ?? 'Unknown',
        };
      } catch (err) {
        console.error(err);
        return {
          id: index,
          title: file.name,
          artist: 'Unknown',
          album: 'Unknown',
          albumartist: 'Unknown',
          year: 'Unknown',
        };
      }
    })
  );
}
