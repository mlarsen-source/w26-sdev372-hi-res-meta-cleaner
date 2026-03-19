import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { extractMetadata } from "../components/useAudioMetadata";
import { AudioFile } from "../types/audio";

export function useUpload(apiBaseUrl: string) {
  const { fetchWithAuth } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [localCollection, setLocalCollection] = useState<AudioFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateFilenames, setDuplicateFilenames] = useState<Set<string>>(new Set());
  const [resetKey, setResetKey] = useState(0);

  const resetFiles = () => {
    setFiles([]);
    setLocalCollection([]);
    setUploadError(null);
    setDuplicateFilenames(new Set());
    setResetKey((k) => k + 1);
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setUploadError(null);
    setDuplicateFilenames(new Set());
    const existingNames = new Set(files.map((f) => f.name));
    const newFiles = selectedFiles.filter((f) => !existingNames.has(f.name));
    if (newFiles.length === 0) return;
    setFiles((prev) => [...prev, ...newFiles]);
    const metadata = await extractMetadata(newFiles);
    setLocalCollection((prev) => [...prev, ...metadata]);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    setIsUploading(true);
    setUploadError(null);
    setDuplicateFilenames(new Set());
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      const response = await fetchWithAuth(`${apiBaseUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 401) {
          alert("Your session has expired. Please log in again.");
          return;
        }

        if (response.status === 409) {
          setUploadError("One or more files have already been uploaded.");
          try {
            const errorData = JSON.parse(errorText);
            const match = (errorData.error as string)?.match(/File "(.+)" already exists/);
            if (match) setDuplicateFilenames(new Set([match[1]]));
          } catch {
            // non-JSON body - no filename to highlight
          }
          return;
        }

        console.error("Upload failed:", response.status, errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      setHasSubmitted(true);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      alert(`Upload failed: ${errorMessage}\n\nMake sure the server is running on port 3001 and you're logged in.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setLocalCollection((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    localCollection,
    isUploading,
    setIsUploading,
    hasSubmitted,
    setHasSubmitted,
    uploadError,
    duplicateFilenames,
    resetKey,
    resetFiles,
    handleFilesSelected,
    handleUpload,
    handleRemoveFile,
  };
}
