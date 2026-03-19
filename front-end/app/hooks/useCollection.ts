import { useState, useCallback } from "react";
import { useAuth } from "../components/AuthProvider";
import { AudioFile } from "../types/audio";

export function useCollection(apiBaseUrl: string) {
  const { fetchWithAuth } = useAuth();
  const [uploadedCollection, setUploadedCollection] = useState<AudioFile[]>([]);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchCollection = useCallback(async () => {
    setIsLoadingCollection(true);
    try {
      const response = await fetchWithAuth(`${apiBaseUrl}/api/metadata`);
      if (response.status === 401) return;
      if (!response.ok) throw new Error("Failed to load metadata");

      const metadataResponse = await response.json();

      const normalizedAudioFiles: AudioFile[] = metadataResponse.map((fileData: unknown) => {
        const data = fileData as Record<string, unknown>;
        const metadata = data.metadata as Record<string, unknown> | undefined;
        return {
          id: data.file_id as number,
          filename: (data.original_filename as string) ?? "Unknown",
          title: (metadata?.title as string) ?? "Unknown",
          artist: (metadata?.artist as string) ?? "Unknown",
          album: (metadata?.album as string) ?? "Unknown",
          year: metadata?.year?.toString() ?? "Unknown",
          type:
            (metadata?.type as string) ??
            ((data.original_filename as string)?.split(".").pop()?.toUpperCase()) ??
            "Unknown",
          size: (metadata?.size as string) ?? "-",
        };
      });

      setUploadedCollection(normalizedAudioFiles);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCollection(false);
    }
  }, [apiBaseUrl, fetchWithAuth]);

  const handleDownload = async () => {
    if (selectedForDownload.size === 0) return;

    setIsDownloading(true);
    try {
      const selectedFileIds = Array.from(selectedForDownload);

      const response = await fetchWithAuth(`${apiBaseUrl}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedFileIds }),
      });

      if (response.status === 401) return;
      if (!response.ok) throw new Error("Download failed");

      const zipBlob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      downloadLink.download = "audio-files.zip";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error(error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    uploadedCollection,
    isLoadingCollection,
    selectedForDownload,
    setSelectedForDownload,
    isDownloading,
    fetchCollection,
    handleDownload,
  };
}
