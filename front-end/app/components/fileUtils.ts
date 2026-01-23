import { AudioFile } from '../types/audio';

export async function handleFileChange(
  index: number,
  field: keyof AudioFile,
  value: string,
  files: AudioFile[],
  setFiles: React.Dispatch<React.SetStateAction<AudioFile[]>>
) {
  const updatedFiles = [...files];
  const file = updatedFiles[index];

  // Update the field value in the local state
  updatedFiles[index] = { ...file, [field]: value };
  setFiles(updatedFiles);

  // Skip API call if no file ID
  if (!file.id) {
    console.warn('Skipping API call: file ID is missing', file);
    return;
  }

  // Prepare metadata for the API call
  const metadata = {
    file_id: file.id,
    filename: updatedFiles[index].filename ?? '',
    title: updatedFiles[index].title ?? '',
    artist: updatedFiles[index].artist ?? '',
    album: updatedFiles[index].album ?? '',
    year: updatedFiles[index].year ?? '',
    type: file.type,
    size: file.size,
  };

  try {
    await fetch('http://localhost:3001/api/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata),
    });
  } catch (error) {
    console.error('Failed to update metadata:', error);
  }
}
