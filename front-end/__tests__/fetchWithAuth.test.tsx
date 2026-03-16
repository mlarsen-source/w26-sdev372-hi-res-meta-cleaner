import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from '../app/components/AuthProvider';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

let fetchWithAuthFn: ((input: RequestInfo, init?: RequestInit) => Promise<Response>) | undefined;

function Consumer({ onReady }: { onReady: (fn: (input: RequestInfo, init?: RequestInit) => Promise<Response>) => void }) {
  const { fetchWithAuth } = useAuth();

  useEffect(() => {
    onReady(fetchWithAuth);
  }, [fetchWithAuth, onReady]);

  return null;
}

function renderFetchWithAuth() {
  render(
    <AuthProvider>
      <Consumer onReady={(fn) => {
        fetchWithAuthFn = fn;
      }} />
    </AuthProvider>
  );
}

describe('fetchWithAuth', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.clear();
    fetchWithAuthFn = undefined;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the response normally on a 200', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    let result: Response | undefined;

    // Act
    renderFetchWithAuth();

    await act(async () => {
      result = await fetchWithAuthFn?.('http://localhost:3001/api/metadata');
    });

    // Assert
    expect(result?.status).toBe(200);
  });

  it('calls /api/refresh then retries on 401 with "token expired"', async () => {
    // Arrange
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        clone: () => ({
          json: async () => ({ message: 'Token expired' }),
        }),
    } as unknown as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    // Act
    renderFetchWithAuth();

    await act(async () => {
      await fetchWithAuthFn?.('http://localhost:3001/api/metadata');
    });

    // Assert
    const calls = vi.mocked(fetch).mock.calls.map((c) => c[0]);
    expect(calls.some((url) => String(url).includes('/api/refresh'))).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('does not call /api/refresh on a 401 without "token expired"', async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      clone: () => ({
        json: async () => ({ message: 'Unauthorized' }),
      }),
    } as unknown as Response);

    // Act
    renderFetchWithAuth();

    await act(async () => {
      await fetchWithAuthFn?.('http://localhost:3001/api/metadata');
    });

    // Assert
    const calls = vi.mocked(fetch).mock.calls.map((c) => c[0]);
    expect(calls.some((url) => String(url).includes('/api/refresh'))).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
