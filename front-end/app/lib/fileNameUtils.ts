export function splitFilenameAndExtension(filename: string): {
  fileNameWithoutExt: string;
  fileExtension: string;
} {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return { fileNameWithoutExt: filename, fileExtension: '' };
  return {
    fileNameWithoutExt: filename.slice(0, lastDotIndex),
    fileExtension: filename.slice(lastDotIndex),
  };
}
