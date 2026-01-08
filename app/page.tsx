'use client';

import React, { useState } from 'react';

interface AudioFile {
  id: number;
  title: string;
  artist: string;
  album: string;
  year: string;
}

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [collection, setCollection] = useState<AudioFile[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const uploadedFiles = Array.from(e.target.files);
      setFiles(uploadedFiles);

      // For demo purposes, create placeholder metadata
      const newCollection = uploadedFiles.map((file, index) => ({
        id: index,
        title: file.name,
        artist: 'Unknown',
        album: 'Unknown',
        year: 'Unknown',
      }));
      setCollection(newCollection);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <section className="border border-gray-300 rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Upload Audio Files</h2>
        <input
          type="file"
          multiple
          accept="audio/*"
          onChange={handleFileChange}
          className="border p-2 rounded w-full"
        />
      </section>

      {/* Collection Table */}
      <section>
        <h2 className="text-lg font-semibold mb-2">Your Collection</h2>
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">#</th>
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Artist</th>
              <th className="border px-4 py-2">Album</th>
              <th className="border px-4 py-2">Year</th>
            </tr>
          </thead>
          <tbody>
            {collection.map((file) => (
              <tr key={file.id} className="text-center">
                <td className="border px-4 py-2">{file.id + 1}</td>
                <td className="border px-4 py-2">{file.title}</td>
                <td className="border px-4 py-2">{file.artist}</td>
                <td className="border px-4 py-2">{file.album}</td>
                <td className="border px-4 py-2">{file.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
