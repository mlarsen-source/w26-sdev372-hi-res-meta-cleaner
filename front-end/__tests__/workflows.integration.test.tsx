import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
import CollectionView from "../app/components/CollectionView";

describe("main workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.user = {
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
    };
    authState.login = vi.fn();
    authState.logout = vi.fn();
    authState.setUser = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => "",
      } as Response)
    );
    vi.stubGlobal("alert", vi.fn());
    authState.fetchWithAuth = vi.fn((input: RequestInfo, init: RequestInit = {}) =>
      fetch(input, { credentials: "include", ...init })
    );
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
    expect(
      await screen.findByRole("heading", { name: "Audio Collection Editor" })
    ).toBeVisible();
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

  it("filters the collection table by search text", () => {
    // Act
    render(
      <CollectionView
        collection={[
          {
            id: 1,
            filename: "track-one.mp3",
            title: "First Song",
            artist: "Alpha Artist",
            album: "Album One",
            year: "2024",
            type: "MP3",
            size: "5 MB",
          },
          {
            id: 2,
            filename: "track-two.mp3",
            title: "Second Song",
            artist: "Beta Artist",
            album: "Album Two",
            year: "2023",
            type: "MP3",
            size: "6 MB",
          },
        ]}
        isLoadingCollection={false}
        selectedForDownload={new Set()}
        onSelectionChange={() => {}}
        onDownload={() => {}}
        isDownloading={false}
      />
    );

    fireEvent.change(screen.getByLabelText("Search collection"), {
      target: { value: "beta" },
    });

    // Assert
    expect(screen.queryByDisplayValue("First Song")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Second Song")).toBeInTheDocument();
  });

  it("keeps edited metadata visible when filtering after an inline change", async () => {
    // Act
    render(
      <CollectionView
        collection={[
          {
            id: 1,
            filename: "track-one.mp3",
            title: "Old Title",
            artist: "Alpha Artist",
            album: "Album One",
            year: "2024",
            type: "MP3",
            size: "5 MB",
          },
        ]}
        isLoadingCollection={false}
        selectedForDownload={new Set()}
        onSelectionChange={() => {}}
        onDownload={() => {}}
        isDownloading={false}
      />
    );

    fireEvent.change(screen.getByDisplayValue("Old Title"), {
      target: { value: "Updated Title" },
    });
    fireEvent.change(screen.getByLabelText("Search collection"), {
      target: { value: "updated" },
    });

    // Assert
    await waitFor(() => {
      expect(screen.getByDisplayValue("Updated Title")).toBeInTheDocument();
    });
  });

  it("sorts the collection table by title", () => {
    const { container } = render(
      <CollectionView
        collection={[
          {
            id: 1,
            filename: "zulu-track.mp3",
            title: "Zulu Song",
            artist: "Artist Z",
            album: "Album Z",
            year: "2024",
            type: "MP3",
            size: "5 MB",
          },
          {
            id: 2,
            filename: "alpha-track.mp3",
            title: "Alpha Song",
            artist: "Artist A",
            album: "Album A",
            year: "2023",
            type: "MP3",
            size: "6 MB",
          },
        ]}
        isLoadingCollection={false}
        selectedForDownload={new Set()}
        onSelectionChange={() => {}}
        onDownload={() => {}}
        isDownloading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Title" }));

    let rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0] as HTMLElement).getByDisplayValue("Alpha Song")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Title/ }));

    rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0] as HTMLElement).getByDisplayValue("Zulu Song")).toBeInTheDocument();
  });

  it("sorts the collection table by year as numbers", () => {
    const { container } = render(
      <CollectionView
        collection={[
          {
            id: 1,
            filename: "later-track.mp3",
            title: "Later Song",
            artist: "Artist B",
            album: "Album B",
            year: "2024",
            type: "MP3",
            size: "5 MB",
          },
          {
            id: 2,
            filename: "earlier-track.mp3",
            title: "Earlier Song",
            artist: "Artist A",
            album: "Album A",
            year: "1999",
            type: "MP3",
            size: "6 MB",
          },
        ]}
        isLoadingCollection={false}
        selectedForDownload={new Set()}
        onSelectionChange={() => {}}
        onDownload={() => {}}
        isDownloading={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Year" }));

    const rows = container.querySelectorAll("tbody tr");
    expect(within(rows[0] as HTMLElement).getByDisplayValue("1999")).toBeInTheDocument();
  });
});
