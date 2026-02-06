"use client";

import { useState } from "react";
import { AudioFile } from "../types/audio";
import { FileRow } from "./FileRow";
import { handleFileChange } from "./fileUtils";
import styles from "./CollectionTable.module.css";

interface CollectionTableProps {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
  showDownload?: boolean;
  selectedFiles?: Set<number>;
  onSelectionChange?: (fileIds: Set<number>) => void;
  readOnly?: boolean;
}

export default function CollectionTable({
  collection,
  onRemove,
  showDownload = false,
  selectedFiles = new Set(),
  onSelectionChange,
  readOnly = false,
}: CollectionTableProps) {
  const [files, setFiles] = useState<AudioFile[]>(collection);

  if (files.length === 0) return null;

  const showSelectionCheckbox = !!onSelectionChange && !showDownload;

  const headers = ["File", "Artist", "Title", "Album", "Year", "Type", "Size"];
  if (onRemove) headers.push("");

  const handleCheckboxChange = (fileId: number, checked: boolean) => {
    if (!onSelectionChange) return;
    const newSelection = new Set(selectedFiles);
    if (checked) {
      newSelection.add(fileId);
    } else {
      newSelection.delete(fileId);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(files.map((file) => file.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const splitFilenameAndExtension = (filename: string) => {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex === -1) return { fileNameWithoutExt: filename, fileExtension: "" };
    return {
      fileNameWithoutExt: filename.slice(0, lastDotIndex),
      fileExtension: filename.slice(lastDotIndex),
    };
  };

  const handleFilenameChange = (index: number, newName: string) => {
    const file = files[index];
    const { fileExtension } = splitFilenameAndExtension(file.filename);
    const newFilename = newName + fileExtension;
    handleChange(index, "filename", newFilename);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = files.filter((_, itemIndex) => itemIndex !== index);
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
    <table className={styles.collectionTable}>
      <thead>
        <tr>
          {showSelectionCheckbox && (
            <th>
              <input
                type="checkbox"
                onChange={(event) => handleSelectAll(event.target.checked)}
              />
            </th>
          )}
          {headers.map((header, headerIndex) => (
            <th
              key={headerIndex}
              className={header === 'Year' ? styles.yearHeader : undefined}
            >
              {header}
            </th>
          ))}
          {showDownload && (
            <th className={styles.selectAllHeader}>
              <input
                type="checkbox"
                onChange={(event) => handleSelectAll(event.target.checked)}
                className={styles.selectAllCheckbox}
              />
              Select All
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {files.map((file, index) => (
          <FileRow
            key={file.id ?? `${file.filename}-${index}`}
            file={file}
            index={index}
            selectedFiles={selectedFiles}
            onSelectionChange={handleCheckboxChange}
            onFilenameChange={handleFilenameChange}
            onFieldChange={handleChange}
            onDownload={showDownload}
            onRemove={onRemove ? handleRemoveFile : undefined}
            readOnly={readOnly}
            showSelectionCheckbox={showSelectionCheckbox}
          />
        ))}
      </tbody>
    </table>
  );
}
