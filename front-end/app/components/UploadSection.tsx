'use client';

import './UploadSection.css';

const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/aac',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aiff',
  'audio/x-aiff',
];

const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a', '.aiff'];

function isAudioFile(file: File): boolean {
  const mimeMatch = ALLOWED_AUDIO_TYPES.includes(file.type);
  const extMatch = ALLOWED_EXTENSIONS.some(ext =>
    file.name.toLowerCase().endsWith(ext)
  );
  return mimeMatch || extMatch;
}

type UploadSectionProps = {
  onFilesSelected: (files: File[]) => void;
};

export default function UploadSection({
  onFilesSelected,
}: UploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const allFiles = Array.from(e.target.files);
    const audioFiles = allFiles.filter(isAudioFile);
    const rejectedCount = allFiles.length - audioFiles.length;

    if (rejectedCount > 0) {
      alert(`${rejectedCount} file(s) were not audio files and were skipped.`);
    }

    if (audioFiles.length > 0) {
      onFilesSelected(audioFiles);
    }
  };

  return (
    <section className="upload-section">
      <h2>Upload Audio Files</h2>

      <label htmlFor="audio-upload" className="visually-hidden">
        Select audio files
      </label>
      <input
        id="audio-upload"
        type="file"
        multiple
        accept="audio/*"
        onChange={handleFileChange}
        className="upload-input"
      />
    </section>
  );
}
