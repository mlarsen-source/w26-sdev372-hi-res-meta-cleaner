'use client';

import { parseBlob } from 'music-metadata';
import { AudioFile } from '../types/audio';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileType(filename: string): string {
  const ext = filename.split('.').pop()?.toUpperCase();
  return ext ?? 'Unknown';
}

export async function extractMetadata(files: File[]): Promise<AudioFile[]> {
  return Promise.all(
    files.map(async (file, index) => {
      try {
        const metadata = await parseBlob(file);

        return {
          id: index,
          filename: file.name,
          title: metadata.common.title ?? 'Unknown',
          artist: metadata.common.artist ?? 'Unknown',
          album: metadata.common.album ?? 'Unknown',
          year: metadata.common.year?.toString() ?? 'Unknown',
          type: getFileType(file.name),
          size: formatFileSize(file.size),
        };
      } catch (err) {
        console.error(err);
        return {
          id: index,
          filename: file.name,
          title: 'Unknown',
          artist: 'Unknown',
          album: 'Unknown',
          year: 'Unknown',
          type: getFileType(file.name),
          size: formatFileSize(file.size),
        };
      }
    })
  );
}
