import { AudioFile } from '../types/audio';
import './CollectionTable.css';

interface FileRowProps {
  file: AudioFile;
  index: number;
  selectedFiles: Set<string>;
  onSelectionChange: (filename: string, checked: boolean) => void;
  onFilenameChange: (index: number, newName: string) => void;
  onFieldChange: (index: number, field: keyof AudioFile, value: string) => void;
  onDownload: boolean;
  onRemove?: (index: number) => void;  // Optional onRemove function
}

export function FileRow({
  file,
  index,
  selectedFiles,
  onSelectionChange,
  onFilenameChange,
  onFieldChange,
  onDownload,
  onRemove,  // Receiving onRemove function
}: FileRowProps) {
  return (
    <tr>
      <td>
        <label>
            <input
                type="checkbox"
                checked={selectedFiles.has(file.filename)}
                onChange={(e) => onSelectionChange(file.filename, e.target.checked)}
            />
        </label>
      </td>
      <td>
        <input
          value={file.filename}
          onChange={(e) => onFilenameChange(index, e.target.value)}
        />
      </td>
      <td>
        <input 
          value={file.artist}
          onChange={(e) => onFieldChange(index, 'artist', e.target.value)}
        />
      </td>
      <td>
        <input 
          value={file.title}
          onChange={(e) => onFieldChange(index, 'title', e.target.value)}
        />
      </td>
      <td>
        <input 
          value={file.album}
          onChange={(e) => onFieldChange(index, 'album', e.target.value)}
        />
      </td>
      <td>
        <input 
          value={file.year}
          onChange={(e) => onFieldChange(index, 'year', e.target.value)}
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
            checked={selectedFiles.has(file.filename)}
            onChange={(e) => onSelectionChange(file.filename, e.target.checked)}
          />
        </td>
      )}
      {/* Conditionally render the "Remove" button */}
      {onRemove && (
        <td>
          <button
            type="button"
            className="remove-button"
            onClick={() => onRemove(index)} // Trigger onRemove function
          >
            Remove
          </button>
        </td>
      )}
    </tr>
  );
}
