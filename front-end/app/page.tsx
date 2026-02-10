'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './components/AuthProvider';
import UploadSection from './components/UploadSection';
import CollectionTable from './components/CollectionTable';
import Loading from './components/Loading';
import { extractMetadata } from './components/useAudioMetadata';
import { AudioFile } from './types/audio';
import styles from './components/HomePage.module.css';
import NavBar from './components/NavBar';

export default function HomePage() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [hasMounted, setHasMounted] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [localCollection, setLocalCollection] = useState<AudioFile[]>([]);
  const [uploadedCollection, setUploadedCollection] = useState<AudioFile[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoadingCollection, setIsLoadingCollection] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<number>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_LOCAL_SYSVAR || 'http://localhost:3001';
  console.log('Using backend URL:', apiBaseUrl);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const fetchCollection = async () => {
    setIsLoadingCollection(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/metadata`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to load metadata');

      const metadataResponse = await response.json();

      const normalizedAudioFiles: AudioFile[] = metadataResponse.map((fileData: unknown) => {
        const data = fileData as Record<string, unknown>;
        const metadata = data.metadata as Record<string, unknown> | undefined;
        return {
          id: data.file_id as number,
          filename: (data.original_filename as string) ?? 'Unknown',
          title: (metadata?.title as string) ?? 'Unknown',
          artist: (metadata?.artist as string) ?? 'Unknown',
          album: (metadata?.album as string) ?? 'Unknown',
          year: metadata?.year?.toString() ?? 'Unknown',
          type: (metadata?.type as string) ?? ((data.original_filename as string)?.split('.').pop()?.toUpperCase()) ?? 'Unknown',
          size: (metadata?.size as string) ?? '-',
        };
      });

      setUploadedCollection(normalizedAudioFiles);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingCollection(false);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {

    setFiles(selectedFiles);

    const metadata = await extractMetadata(selectedFiles);
    setLocalCollection(metadata);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(`${apiBaseUrl}/api/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);

        if (response.status === 401) {
          setUser(null);
          alert('Your session has expired. Please log in again.');
          router.push('/login');
          return;
        }

        if (response.status === 409) {
          alert('This file has already been uploaded.');
          return;
        }

        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      setHasSubmitted(true);
      await fetchCollection();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Upload failed: ${errorMessage}\n\nMake sure the server is running on port 3001 and you're logged in.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setLocalCollection((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleDownload = async () => {
    if (selectedForDownload.size === 0) return;

    setIsDownloading(true);
    try {
      const selectedFilenames = uploadedCollection
        .filter(file => selectedForDownload.has(file.id))
        .map(file => file.filename);

      const response = await fetch(`${apiBaseUrl}/api/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedFilenames }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Download failed');

      const zipBlob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(zipBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'audio-files.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error(error);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!hasMounted) {
    return <div className="page-content" />;
  }

  if (!user) {
    return (
      <div className={`page-content ${styles.loginPrompt}`}>
        <h2>Welcome to Hi-Res Meta Cleaner</h2>
        <p>Please log in to upload and manage your audio files.</p>
        <button
          type="button"
          className={`submit-button ${styles.loginButton}`}
          onClick={() => router.push('/login')}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="page-content">
      <NavBar
        setIsUploading={setIsUploading}
        setHasSubmitted={setHasSubmitted}
      />
      {isUploading ? (
        <Loading message="Uploading files" />
      ) : !hasSubmitted ? (
        <>
          <UploadSection onFilesSelected={handleFilesSelected} />
          {localCollection.length > 0 && (
            <div className="selected-files-section">
              <h2 className="section-heading">Selected Files</h2>
              <CollectionTable collection={localCollection} onRemove={handleRemoveFile} readOnly />
              <button
                type="button"
                className="submit-button"
                onClick={handleUpload}
              >
                Submit
              </button>
            </div>
          )}
        </>
      ) : (
        <div>
          <h2 className="section-heading">Audio Collection Editor</h2>
          {isLoadingCollection ? (
            <Loading message="Loading collection" />
          ) : (
            <>
              <CollectionTable
                collection={uploadedCollection}
                showDownload
                selectedFiles={selectedForDownload}
                onSelectionChange={setSelectedForDownload}
              />
              <button
                type="button"
                className={`submit-button ${styles.downloadButton}`}
                onClick={handleDownload}
                disabled={selectedForDownload.size === 0 || isDownloading}
              >
                {isDownloading ? 'Downloading...' : `Download Selected (${selectedForDownload.size})`}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
