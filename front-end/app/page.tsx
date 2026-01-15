'use client';

import React, { useState } from 'react';
import { parseBlob } from 'music-metadata';

type AudioFile = {
  id: number;
  title: string;
  artist: string;
  album: string;
  albumartist: string;
  year: string;
}

let tempStore;

export default function HomePage() {
  const [collection, setCollection] = useState<AudioFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    setFiles(files);

    const data = await Promise.all(
      files.map(async (file, index) => {
        try {
          const metadata = await parseBlob(file);

          return {
            id: index,
            title: metadata.common.title ?? file.name,
            artist: metadata.common.artist ?? 'Unknown',
            album: metadata.common.album ?? 'Unknown',
            albumartist: metadata.common.albumartist ?? 'Unknown',
            year: metadata.common.year?.toString() ?? 'Unknown',
          };
        } catch (err) {
          console.error(err);
          return {
            id: index,
            title: file.name,
            artist: 'Unknown',
            album: 'Unknown',
            albumartist: 'Unknown',
            year: 'Unknown',
          };
        }
      })
    );
    console.log(data);
    console.log(files);
    setCollection(data);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    await fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData,
    });
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
              <th className="border px-4 py-2">Artist</th>
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Album</th>
              <th className="border px-4 py-2">Album Artist</th>
              <th className="border px-4 py-2">Year</th>
            </tr>
          </thead>
          <tbody>
            {collection.map((file) => (
              <tr key={file.id} className="text-center">
                <td className="border px-4 py-2">{file.id + 1}</td>
                <td className="border px-4 py-2">{file.artist}</td>
                <td className="border px-4 py-2">{file.title}</td>
                <td className="border px-4 py-2">{file.album}</td>
                <td className="border px-4 py-2">{file.albumartist}</td>
                <td className="border px-4 py-2">{file.year}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}