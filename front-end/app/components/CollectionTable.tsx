"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { AudioFile } from "../types/audio";
import { FileRow } from "./FileRow";
import { handleFileChange } from "./fileUtils";
import { splitFilenameAndExtension } from "../lib/fileNameUtils";
import styles from "./CollectionTable.module.css";

interface CollectionTableProps {
  collection: AudioFile[];
  onRemove?: (index: number) => void;
  showDownload?: boolean;
  selectedFiles?: Set<number>;
  onSelectionChange?: (fileIds: Set<number>) => void;
  readOnly?: boolean;
  duplicateFilenames?: Set<string>;
  filterTerm?: string;
  enableSorting?: boolean;
}

type SortField = "filename" | "artist" | "title" | "album" | "year" | "type" | "size";
type SortDirection = "asc" | "desc";

const sortableColumns: Array<{
  label: string;
  field: SortField;
  headerClassName?: string;
}> = [
  { label: "File", field: "filename" },
  { label: "Artist", field: "artist" },
  { label: "Title", field: "title" },
  { label: "Album", field: "album" },
  { label: "Year", field: "year", headerClassName: styles.yearHeader },
  { label: "Type", field: "type" },
  { label: "Size", field: "size" },
];

const compareText = (left: string, right: string) =>
  left.localeCompare(right, undefined, {
    sensitivity: "base",
    numeric: true,
  });

const parseYearValue = (year: string) => {
  const parsedYear = Number.parseInt(year, 10);
  return Number.isNaN(parsedYear) ? null : parsedYear;
};

const parseSizeToBytes = (size: string) => {
  const [valueText, unitText = "B"] = size.trim().split(/\s+/);
  const value = Number.parseFloat(valueText);

  if (Number.isNaN(value)) return 0;

  const unitMultipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const normalizedUnit = unitText.toUpperCase();
  return value * (unitMultipliers[normalizedUnit] ?? 1);
};

const compareFiles = (left: AudioFile, right: AudioFile, field: SortField) => {
  if (field === "year") {
    const leftYear = parseYearValue(left.year);
    const rightYear = parseYearValue(right.year);

    if (leftYear !== null && rightYear !== null) {
      return leftYear - rightYear;
    }

    return compareText(left.year, right.year);
  }

  if (field === "size") {
    return parseSizeToBytes(left.size) - parseSizeToBytes(right.size);
  }

  return compareText(left[field], right[field]);
};

export default function CollectionTable({
  collection,
  onRemove,
  showDownload = false,
  selectedFiles = new Set(),
  onSelectionChange,
  readOnly = false,
  duplicateFilenames,
  filterTerm = "",
  enableSorting = false,
}: CollectionTableProps) {
  const { fetchWithAuth } = useAuth();
  const [files, setFiles] = useState<AudioFile[]>(collection);
  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  } | null>(null);

  useEffect(() => {
    setFiles(collection);
  }, [collection]);

  if (files.length === 0) return null;

  const normalizedFilter = filterTerm.trim().toLowerCase();

  const filteredRows = files
    .map((file, index) => ({ file, index }))
    .filter(({ file }) => {
      if (!normalizedFilter) return true;

      const searchableValues = [
        file.filename,
        file.title,
        file.artist,
        file.album,
        file.year,
        file.type,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedFilter)
      );
    });

  const visibleRows = sortConfig
    ? [...filteredRows].sort((leftRow, rightRow) => {
        const comparison = compareFiles(
          leftRow.file,
          rightRow.file,
          sortConfig.field
        );

        return sortConfig.direction === "asc" ? comparison : -comparison;
      })
    : filteredRows;

  const showSelectionCheckbox = !!onSelectionChange && !showDownload;

  const totalColumnCount =
    sortableColumns.length +
    (onRemove ? 1 : 0) +
    (showSelectionCheckbox ? 1 : 0) +
    (showDownload ? 1 : 0);

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
      onSelectionChange(new Set(visibleRows.map(({ file }) => file.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSort = (field: SortField) => {
    setSortConfig((currentSort) => {
      if (!currentSort || currentSort.field !== field) {
        return { field, direction: "asc" };
      }

      return {
        field,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
      };
    });
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
    onRemove?.(index);
  };

  const handleChange = async (
    index: number,
    field: keyof AudioFile,
    value: string
  ) => {
    await handleFileChange(index, field, value, files, setFiles, fetchWithAuth);
  };

  return (
    <table className={`${styles.collectionTable} ${readOnly ? styles.compact : ""}`}>
      <thead>
        <tr>
          {showSelectionCheckbox && (
            <th>
              <input
                type="checkbox"
                aria-label="Select all files"
                onChange={(event) => handleSelectAll(event.target.checked)}
              />
            </th>
          )}
          {sortableColumns.map((column) => {
            const isSorted = sortConfig?.field === column.field;
            const sortHeaderClassName = [
              column.headerClassName,
              enableSorting ? styles.sortableHeader : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <th
                key={column.field}
                className={sortHeaderClassName}
                aria-sort={
                  enableSorting
                    ? isSorted
                      ? sortConfig.direction === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                    : undefined
                }
              >
                {enableSorting ? (
                  <button
                    type="button"
                    className={styles.sortButton}
                    onClick={() => handleSort(column.field)}
                  >
                    <span>{column.label}</span>
                    <span className={styles.sortIcon} aria-hidden="true">
                      <span
                        className={`${styles.sortArrow} ${styles.sortArrowUp} ${
                          isSorted && sortConfig.direction === "asc"
                            ? styles.sortArrowActive
                            : ""
                        }`}
                      />
                      <span
                        className={`${styles.sortArrow} ${styles.sortArrowDown} ${
                          isSorted && sortConfig.direction === "desc"
                            ? styles.sortArrowActive
                            : ""
                        }`}
                      />
                    </span>
                  </button>
                ) : (
                  column.label
                )}
              </th>
            );
          })}
          {onRemove && <th />}
          {showDownload && (
            <th className={styles.selectAllHeader}>
              <input
                type="checkbox"
                aria-label="Select all files"
                onChange={(event) => handleSelectAll(event.target.checked)}
                className={styles.selectAllCheckbox}
              />
              Select All
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {visibleRows.length === 0 ? (
          <tr>
            <td colSpan={totalColumnCount}>No matching files.</td>
          </tr>
        ) : (
          visibleRows.map(({ file, index }) => (
            <FileRow
              key={file.id || `${file.filename}-${index}`}
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
              isDuplicate={duplicateFilenames?.has(file.filename)}
            />
          ))
        )}
      </tbody>
      <tfoot>
        <tr className={styles.tableFooterRow}>
          <td colSpan={totalColumnCount}>
            {/* spacer footer row for visual balance */}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
