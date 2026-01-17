'use client';

type UploadSectionProps = {
  onFilesSelected: (files: File[]) => void;
  onUpload: () => void;
};

export default function UploadSection({
  onFilesSelected,
  onUpload,
}: UploadSectionProps) {
  return (
    <section className="border border-gray-300 rounded p-4 space-y-3">
      <h2 className="text-lg font-semibold">Upload Audio Files</h2>

      <input
        type="file"
        multiple
        accept="audio/*"
        onChange={(e) =>
          e.target.files && onFilesSelected(Array.from(e.target.files))
        }
        className="border p-2 rounded w-full"
      />

      <button
        onClick={onUpload}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit
      </button>
    </section>
  );
}
