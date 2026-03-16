import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection } from '../app/hooks/useCollection';

const API_URL = 'http://localhost:3001';

const mockApiResponse = [
  {
    file_id: 1,
    original_filename: 'song.mp3',
    metadata: {
      title: 'Song Title',
      artist: 'Artist Name',
      album: 'Album Name',
      year: 2020,
      type: 'MP3',
      size: '5.0 MB',
    },
  },
];

describe('useCollection', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetchCollection populates uploadedCollection from API response', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const { result } = renderHook(() => useCollection(API_URL));

    // Act
    await act(async () => {
      await result.current.fetchCollection();
    });

    // Assert
    expect(result.current.uploadedCollection).toHaveLength(1);
    expect(result.current.uploadedCollection[0].title).toBe('Song Title');
    expect(result.current.uploadedCollection[0].artist).toBe('Artist Name');
  });

  it('fetchCollection normalizes the response shape to AudioFile', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as Response);

    const { result } = renderHook(() => useCollection(API_URL));

    // Act
    await act(async () => {
      await result.current.fetchCollection();
    });

    // Assert
    const file = result.current.uploadedCollection[0];
    expect(file.id).toBe(1);
    expect(file.filename).toBe('song.mp3');
    expect(file.year).toBe('2020');
  });

  it('handleDownload does nothing when no files are selected', async () => {
    // Arrange
    const { result } = renderHook(() => useCollection(API_URL));

    // Act
    await act(async () => {
      await result.current.handleDownload();
    });

    // Assert
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handleDownload calls /api/download with the selected file IDs', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['zip'], { type: 'application/zip' }),
    } as Response);

    const { result } = renderHook(() => useCollection(API_URL));

    act(() => {
      result.current.setSelectedForDownload(new Set([1, 2]));
    });

    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation((el) => el);
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((el) => el);
    const createSpy = vi.spyOn(document, 'createElement').mockReturnValue({
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement);

    // Act
    await act(async () => {
      await result.current.handleDownload();
    });

    // Assert
    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/download`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fileIds: [1, 2] }),
      })
    );

    appendSpy.mockRestore();
    removeSpy.mockRestore();
    createSpy.mockRestore();
  });
});
