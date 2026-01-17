'use client';

import { useState } from 'react';
import UploadSection from '../app/components/UploadSection';
import CollectionTable from '../app/components/CollectionTable';
import { extractMetadata } from '../app/components/useAudioMetadata';
import { AudioFile } from '../app/types/audio';

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collection, setCollection] = useState<AudioFile[]>([]);

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
      <CollectionTable collection={collection} />
    </div>
  );
}
