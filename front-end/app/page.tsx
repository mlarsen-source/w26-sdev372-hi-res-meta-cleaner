'use client';

import { useState } from 'react';
import UploadSection from '../app/components/UploadSection';
import CollectionTable from '../app/components/CollectionTable';
import Loading from '../app/components/Loading';
import { extractMetadata } from './components/useAudioMetadata';
import { AudioFile } from '../app/types/audio';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collection, setCollection] = useState<AudioFile[]>([]);
  const [metaCollect, setMetaCollect] = useState<AudioFile[]>([]);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const fetchCollection = async () => {
    setLoadingMeta(true);
    try {
      const res = await fetch('http://localhost:3001/api/metadata', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load metadata');

      const rawData = await res.json();

      const normalized: AudioFile[] = rawData.map((row: any) => ({
        id: row.file_id,
        filename: row.original_filename ?? 'Unknown',
        title: row.metadata?.title ?? 'Unknown',
        artist: row.metadata?.artist ?? 'Unknown',
        album: row.metadata?.album ?? 'Unknown',
        year: row.metadata?.year?.toString() ?? 'Unknown',
        type: row.metadata?.type ?? row.original_filename?.split('.').pop()?.toUpperCase() ?? 'Unknown',
        size: row.metadata?.size ?? '-',
      }));

      setMetaCollect(normalized);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeta(false);
    }
  };

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    const metadata = await extractMetadata(selectedFiles);
    setCollection(metadata);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));

      const res = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Upload failed');

      setHasSubmitted(true);
      await fetchCollection();
    } catch (err) {
      console.error(err);
      alert('Upload failed. Make sure the server is running on port 3001.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setCollection((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownload = async () => {
    if (selectedForDownload.size === 0) return;

    setIsDownloading(true);
    try {
      const res = await fetch('http://localhost:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: Array.from(selectedForDownload) }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audio-files.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert('Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="page-content">
      {isUploading ? (
        <Loading message="Uploading files" />
      ) : !hasSubmitted ? (
        <>
          <UploadSection onFilesSelected={handleFilesSelected} />
          {collection.length > 0 && (
            <div className="selected-files-section">
              <h2 className="section-heading">Selected Files</h2>
              <CollectionTable collection={collection} onRemove={handleRemoveFile} readOnly />
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
          <h2 className="section-heading">Your Audio Collection</h2>
          {loadingMeta ? (
            <Loading message="Loading collection" />
          ) : (
            <>
              <CollectionTable
                collection={metaCollect}
                showDownload
                selectedFiles={selectedForDownload}
                onSelectionChange={setSelectedForDownload}
              />
              <button
                type="button"
                className="submit-button"
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
