'use client';

import { useState, useEffect } from 'react';
import UploadSection from '../app/components/UploadSection';
import CollectionTable from '../app/components/CollectionTable';
import { extractMetadata } from '../app/components/useAudioMetadata';
import { AudioFile } from '../app/types/audio';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collection, setCollection] = useState<AudioFile[]>([]);
  const [metaCollect, setMetaCollect] = useState<AudioFile[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
    // 🔹 Fetch DB metadata
  
    useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch('http://localhost:3001/api/metadata', {
          credentials: 'include', // needed if authenticateUser uses cookies
        });
        console.log(res);
        if (!res.ok) throw new Error('Failed to load metadata');

        const rawData = await res.json();

        const normalized: AudioFile[] = rawData.map((row: any) => ({
          id: row.file_id,
          artist: row.metadata.artist,
          title: row.metadata.title,
          album: row.metadata.album,
          albumartist: row.metadata.album_artist,
          year: row.metadata.year,
        }));

        console.log(normalized);
        setMetaCollect(normalized);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMeta(false);
      }
    }

    fetchMetadata();
  }, []);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    const metadata = await extractMetadata(selectedFiles);
    setCollection(metadata);
  };

  const handleUpload = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData,
    });
  };

  return (
    <div className="space-y-8">
      <UploadSection
        onFilesSelected={handleFilesSelected}
        onUpload={handleUpload}
      />
      <h2 className="text-lg font-semibold mb-2">MetaData of File</h2>
      <CollectionTable collection={collection} />
      <h2 className="text-lg font-semibold mb-2">Your Collection</h2>
      <div>
        {loadingMeta ? (
          <p>Loading Collection...</p>
        ) : (
          <CollectionTable collection={metaCollect}/>
        )}
      </div>
    </div>
  );
}
