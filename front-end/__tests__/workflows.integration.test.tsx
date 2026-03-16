import type { ReactNode } from "react";
import { useEffect } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockValues = vi.hoisted(() => ({
  routerPush: vi.fn(),
  logout: vi.fn(),
  setUser: vi.fn(),
  parseBlob: vi.fn(),
  authState: {
    user: { user_id: 1, email: "jane@example.com", first_name: "Jane" },
    login: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
    fetchWithAuth: vi.fn(),
  },
}));

const { logout, setUser, parseBlob, authState } = mockValues;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockValues.routerPush }),
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
import { useCollection } from "../app/hooks/useCollection";

function CollectionHarness() {
  const {
    fetchCollection,
    uploadedCollection,
    isLoadingCollection,
    selectedForDownload,
    setSelectedForDownload,
    handleDownload,
    isDownloading,
  } = useCollection("http://localhost:3001");

  useEffect(() => {
    void fetchCollection();
  }, [fetchCollection]);

  return (
    <CollectionView
      collection={uploadedCollection}
      isLoadingCollection={isLoadingCollection}
      selectedForDownload={selectedForDownload}
      onSelectionChange={setSelectedForDownload}
      onDownload={handleDownload}
      isDownloading={isDownloading}
    />
  );
}

describe("main workflows", () => {
  beforeEach(() => {
    authState.user = {
      user_id: 1,
      email: "jane@example.com",
      first_name: "Jane",
    };
    authState.login = vi.fn();
    authState.logout = logout;
    authState.setUser = setUser;
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

  it("downloads the selected files", async () => {
    // Arrange
    vi.mocked(fetch)
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
              size: "5 MB",
            },
          },
        ],
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["zip"], { type: "application/zip" }),
      } as Response);

    // Act
    render(<CollectionHarness />);

    expect(await screen.findByText("Download Selected (0)")).toBeVisible();

    const appendSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation((node) => node);
    const removeSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation((node) => node);
    const clickSpy = vi.fn();
    const createSpy = vi.spyOn(document, "createElement").mockReturnValue({
      href: "",
      download: "",
      click: clickSpy,
    } as unknown as HTMLAnchorElement);

    fireEvent.click(screen.getByTitle("Select track.mp3"));
    fireEvent.click(
      await screen.findByRole("button", { name: "Download Selected (1)" })
    );

    // Assert
    await waitFor(() => {
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "http://localhost:3001/api/download",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ fileIds: [1] }),
        })
      );
    });

    expect(clickSpy).toHaveBeenCalled();

    createSpy.mockRestore();
    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
