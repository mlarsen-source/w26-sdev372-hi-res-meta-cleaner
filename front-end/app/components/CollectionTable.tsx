'use client';

import { useState } from 'react';
import { AudioFile } from '../types/audio';
import { FileRow } from './FileRow';
import { handleFileChange } from './fileUtils';
import './CollectionTable.css';

interface EnableDownload {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
  showDownload?: boolean;
  selectedFiles?: Set<string>;
  onSelectionChange?: (filenames: Set<string>) => void;
};

export default function CollectionTable({
  collection,
  onRemove,
  showDownload = false,
  selectedFiles = new Set(),
  onSelectionChange,
}: EnableDownload) {
  const [files, setFiles] = useState<AudioFile[]>(collection);

  if (files.length === 0) return null;

  const headers = ['File', 'Artist', 'Title', 'Album', 'Year', 'Type', 'Size'];
  if (showDownload) headers.push('Download');
  if (onRemove) headers.push('');

  const handleCheckboxChange = (filename: string, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedFiles);
    if (checked) {
      newSelection.add(filename);
    } else {
      newSelection.delete(filename);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(files.map(f => f.filename)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const getNameAndExt = (filename: string) => {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return { name: filename, ext: '' };
    return {
      name: filename.slice(0, lastDot),
      ext: filename.slice(lastDot),
    };
  };

  const handleFilenameChange = (index: number, newName: string) => {
    const file = files[index];
    const { ext } = getNameAndExt(file.filename);
    const newFilename = newName + ext;
    handleChange(index, 'filename', newFilename);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    setFiles(updatedFiles);
  };

  const handleChange = async (
    index: number,
    field: keyof AudioFile,
    value: string
  ) => {
    await handleFileChange(index, field, value, files, setFiles);
  };

  return (
    <table className="collection-table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          </th>
          {headers.map((header, index) => (
            <th key={index}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {files.map((file, index) => (
          <FileRow
            key={index}
            file={file}
            index={index}
            selectedFiles={selectedFiles}
            onSelectionChange={handleCheckboxChange}
            onFilenameChange={handleFilenameChange}
            onFieldChange={handleChange}
            onDownload={showDownload}
            onRemove={onRemove ? handleRemoveFile : undefined}
          />
        ))}
      </tbody>
    </table>
  );
}
