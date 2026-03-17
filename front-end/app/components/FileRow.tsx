import { AudioFile } from '../types/audio';
import { splitFilenameAndExtension } from '../lib/fileNameUtils';
import styles from './CollectionTable.module.css';

interface FileRowProps {
  file: AudioFile;
  index: number;
  selectedFiles: Set<number>;
  onSelectionChange: (fileId: number, checked: boolean) => void;
  onFilenameChange: (index: number, newName: string) => void;
  onFieldChange: (index: number, field: keyof AudioFile, value: string) => void;
  onDownload: boolean;
  onRemove?: (index: number) => void;
  readOnly?: boolean;
  showSelectionCheckbox?: boolean;
  isDuplicate?: boolean;
}

export function FileRow({
  file,
  index,
  selectedFiles,
  onSelectionChange,
  onFilenameChange,
  onFieldChange,
  onDownload,
  onRemove,
  readOnly = false,
  showSelectionCheckbox = false,
  isDuplicate = false,
}: FileRowProps) {
  const { fileNameWithoutExt, fileExtension } = splitFilenameAndExtension(file.filename);

  return (
    <tr className={isDuplicate ? styles.duplicateRow : undefined}>
      {showSelectionCheckbox && (
        <td>
          <label>
              <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={(event) => onSelectionChange(file.id, event.target.checked)}
              />
          </label>
        </td>
      )}
      <td>
        <div className={styles.filenameInput}>
          <input
            value={fileNameWithoutExt}
            onChange={(event) => onFilenameChange(index, event.target.value)}
            readOnly={readOnly}
            className={styles.inputFull}
          />
          <span className={styles.filenameExt}>{fileExtension}</span>
        </div>
      </td>
      <td>
        <input
          value={file.artist}
          onChange={(event) => onFieldChange(index, 'artist', event.target.value)}
          readOnly={readOnly}
          className={styles.inputFull}
        />
      </td>
      <td>
        <input
          value={file.title}
          onChange={(event) => onFieldChange(index, 'title', event.target.value)}
          readOnly={readOnly}
          className={styles.inputFull}
        />
      </td>
      <td>
        <input
          value={file.album}
          onChange={(event) => onFieldChange(index, 'album', event.target.value)}
          readOnly={readOnly}
          className={styles.inputFull}
        />
      </td>
      <td>
        <input
          value={file.year}
          onChange={(event) => onFieldChange(index, 'year', event.target.value)}
          readOnly={readOnly}
          className={styles.inputYear}
        />
      </td>
      <td>
        {file.type}
      </td>
      <td>
        {file.size}
      </td>
      {onDownload && (
        <td>
          <input
            type="checkbox"
            title={`Select ${file.filename}`}
            checked={selectedFiles.has(file.id)}
            onChange={(event) => onSelectionChange(file.id, event.target.checked)}
          />
        </td>
      )}
      {onRemove && (
        <td>
          <button
            type="button"
            className={styles.removeButton}
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        </td>
      )}
    </tr>
  );
}
