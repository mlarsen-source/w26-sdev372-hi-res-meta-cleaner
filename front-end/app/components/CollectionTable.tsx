'use client';

import { AudioFile } from '../types/audio';

type Props = {
  collection: AudioFile[];
};

export default function CollectionTable({ collection }: Props) {
  if (collection.length === 0) return null;

  return (
    <section>
      <table className="min-w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            {['#', 'Artist', 'Title', 'Album', 'Album Artist', 'Year'].map(
              (h) => (
                <th key={h} className="border px-4 py-2">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {collection.map((file, index) => (
            <tr
              key={file.id ?? `${file.artist}-${file.title}-${index}`}
              className="text-center"
            >
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{file.artist ?? '-'}</td>
              <td className="border px-4 py-2">{file.title ?? '-'}</td>
              <td className="border px-4 py-2">{file.album ?? '-'}</td>
              <td className="border px-4 py-2">{file.albumartist ?? '-'}</td>
              <td className="border px-4 py-2">{file.year ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
