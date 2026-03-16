import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockValues = vi.hoisted(() => ({
  parseBlob: vi.fn(),
  authState: {
    user: { user_id: 1, email: "jane@example.com", first_name: "Jane" },
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    fetchWithAuth: vi.fn(),
  },
}));

const { parseBlob, authState } = mockValues;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("music-metadata", () => ({
  parseBlob: mockValues.parseBlob,
}));

vi.mock("../app/components/AuthProvider", () => ({
  useAuth: () => mockValues.authState,
}));

vi.mock("../app/hooks/useMounted", () => ({
  useMounted: () => true,
}));

import HomePage from "../app/page";
import CollectionTable from "../app/components/CollectionTable";

describe("main workflows", () => {
  beforeEach(() => {
    authState.user = {
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
    };
    authState.login = vi.fn();
    authState.logout = vi.fn();
    authState.setUser = vi.fn();
    authState.fetchWithAuth = vi.fn();
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("alert", vi.fn());
  });

  it("uploads a file and loads the collection", async () => {
    // Arrange
    parseBlob.mockResolvedValueOnce({
      common: {
        title: "Track One",
        artist: "Test Artist",
        album: "Test Album",
        year: 2024,
      },
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            file_id: 1,
            original_filename: "track.mp3",
            metadata: {
              title: "Track One",
              artist: "Test Artist",
              album: "Test Album",
              year: 2024,
              type: "MP3",
              size: "5 B",
            },
          },
        ],
      } as Response);

    // Act
    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("Select audio files"), {
      target: {
        files: [new File(["audio"], "track.mp3", { type: "audio/mpeg" })],
      },
    });

    expect(await screen.findByText("Selected Files")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    // Assert
    expect(await screen.findByText("Audio Collection Editor")).toBeVisible();
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3001/api/upload",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      })
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3001/api/metadata",
      expect.objectContaining({
        credentials: "include",
      })
    );
  });

  it("shows the duplicate upload error", async () => {
    // Arrange
    parseBlob.mockResolvedValueOnce({
      common: {},
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () =>
        JSON.stringify({ error: 'File "track.mp3" already exists.' }),
    } as Response);

    // Act
    render(<HomePage />);

    fireEvent.change(screen.getByLabelText("Select audio files"), {
      target: {
        files: [new File(["audio"], "track.mp3", { type: "audio/mpeg" })],
      },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Submit" }));

    // Assert
    expect(
      await screen.findByText("One or more files have already been uploaded.")
    ).toBeVisible();
  });

  it("saves inline metadata edits", async () => {
    // Act
    render(
      <CollectionTable
        collection={[
          {
            id: 1,
            filename: "track.mp3",
            title: "Old Title",
            artist: "Artist",
            album: "Album",
            year: "2024",
            type: "MP3",
            size: "5 MB",
          },
        ]}
        selectedFiles={new Set()}
        onSelectionChange={() => {}}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Old Title"), {
      target: { value: "New Title" },
    });

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "http://localhost:3001/api/update",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(request?.body as string)).toMatchObject({
      file_id: 1,
      filename: "track.mp3",
      title: "New Title",
    });
  });
});
