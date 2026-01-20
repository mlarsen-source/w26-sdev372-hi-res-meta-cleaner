'use client';

import { useState } from 'react';
import { AudioFile } from '../types/audio';
import './CollectionTable.css';

type Props = {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
};

export default function CollectionTable({ collection, onRemove }: Props) {
  // Local state for editable collection
  const [files, setFiles] = useState<AudioFile[]>(collection);

  if (files.length === 0) return null;

  const headers = ['File', 'Artist', 'Title', 'Album', 'Year', 'Type', 'Size'];
  if (onRemove) headers.push('');

  // Handler for updating a field
  const handleChange = async (
    index: number,
    field: keyof AudioFile,
    value: string
  ) => {
    const updatedFiles = [...files];
    updatedFiles[index] = { ...updatedFiles[index], [field]: value };
    setFiles(updatedFiles);

    // Call API to update the field
    try {
      await fetch('http://localhost:3001/api/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updatedFiles[index].id,
          field,
          value,
        }),
      });
    } catch (error) {
      console.error('Failed to update field:', error);
    }
  };

  return (
    <section>
      <table className="collection-table">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>

        <tbody>
          {files.map((file, index) => (
            <tr key={file.id ?? `${file.filename}-${index}`}>
              <td>{file.filename ?? '-'}</td>
              <td>
                <input
                  type="text"
                  value={file.artist ?? ''}
                  onChange={(e) => handleChange(index, 'artist', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={file.title ?? ''}
                  onChange={(e) => handleChange(index, 'title', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={file.album ?? ''}
                  onChange={(e) => handleChange(index, 'album', e.target.value)}
                />
              </td>
              <td>
                <input
                  type="text"
                  value={file.year ?? ''}
                  onChange={(e) => handleChange(index, 'year', e.target.value)}
                />
              </td>
              <td>{file.type ?? '-'}</td>
              <td>{file.size ?? '-'}</td>
              {onRemove && (
                <td>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => onRemove(index)}
                  >
                    Remove
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
