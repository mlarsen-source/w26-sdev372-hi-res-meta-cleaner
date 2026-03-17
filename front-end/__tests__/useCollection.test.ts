import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollection } from '../app/hooks/useCollection';

const API_URL = 'http://localhost:3001';
const mockValues = vi.hoisted(() => ({
  fetchWithAuth: vi.fn(),
}));
const { fetchWithAuth: mockFetchWithAuth } = mockValues;

vi.mock('../app/components/AuthProvider', () => ({
  useAuth: () => ({ fetchWithAuth: mockFetchWithAuth }),
}));

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
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
    mockFetchWithAuth.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetchCollection loads and normalizes API data', async () => {
    // Arrange
    mockFetchWithAuth.mockResolvedValueOnce({
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
    const file = result.current.uploadedCollection[0];
    expect(file.id).toBe(1);
    expect(file.filename).toBe('song.mp3');
    expect(file.title).toBe('Song Title');
    expect(file.artist).toBe('Artist Name');
    expect(file.year).toBe('2020');
    expect(mockFetchWithAuth).toHaveBeenCalledWith(`${API_URL}/api/metadata`);
  });

  it('handleDownload calls /api/download with the selected file IDs', async () => {
    // Arrange
    mockFetchWithAuth.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['zip'], { type: 'application/zip' }),
    } as Response);

    const { result } = renderHook(() => useCollection(API_URL));
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    act(() => {
      result.current.setSelectedForDownload(new Set([1, 2]));
    });

    // Act
    await act(async () => {
      await result.current.handleDownload();
    });

    // Assert
    expect(mockFetchWithAuth).toHaveBeenCalledWith(
      `${API_URL}/api/download`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ fileIds: [1, 2] }),
      })
    );
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
