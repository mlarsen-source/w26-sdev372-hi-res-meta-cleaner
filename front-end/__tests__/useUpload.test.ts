import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('../app/components/AuthProvider', () => ({
  useAuth: () => ({ setUser: vi.fn() }),
}));

vi.mock('../app/components/useAudioMetadata', () => ({
  extractMetadata: vi.fn().mockImplementation(async (files: File[]) =>
    files.map((f, i) => ({
      id: i,
      filename: f.name,
      title: 'Unknown',
      artist: 'Unknown',
      album: 'Unknown',
      year: 'Unknown',
      type: 'MP3',
      size: '5 MB',
    }))
  ),
}));

import { useUpload } from '../app/hooks/useUpload';

const API_URL = 'http://localhost:3001';

const makeFile = (name: string) => new File(['audio'], name, { type: 'audio/mpeg' });

describe('useUpload', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('alert', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('handleRemoveFile removes the file at the given index', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);

    const { result } = renderHook(() => useUpload(API_URL));

    // Act
    await act(async () => {
      await result.current.handleFilesSelected([makeFile('a.mp3'), makeFile('b.mp3')]);
    });

    act(() => {
      result.current.handleRemoveFile(0);
    });

    // Assert
    expect(result.current.localCollection).toHaveLength(1);
  });

  it('resetFiles clears the local collection and state', async () => {
    // Arrange
    const { result } = renderHook(() => useUpload(API_URL));

    // Act
    await act(async () => {
      await result.current.handleFilesSelected([makeFile('song.mp3')]);
    });

    act(() => {
      result.current.resetFiles();
    });

    // Assert
    expect(result.current.localCollection).toHaveLength(0);
    expect(result.current.uploadError).toBeNull();
  });

  it('handleUpload sets uploadError on a 409 response', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ error: 'File "song.mp3" already exists' }),
    } as Response);

    const { result } = renderHook(() => useUpload(API_URL));

    // Act
    await act(async () => {
      await result.current.handleFilesSelected([makeFile('song.mp3')]);
    });

    await act(async () => {
      await result.current.handleUpload();
    });

    // Assert
    expect(result.current.uploadError).toBeTruthy();
    expect(result.current.duplicateFilenames.has('song.mp3')).toBe(true);
  });
});
