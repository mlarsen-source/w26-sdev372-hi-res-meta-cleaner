import { metadata } from "../models/metadata.js";

export async function upsertMetadata(payload) {
  const items = Array.isArray(payload) ? payload : [payload];

  await Promise.all(
    items.map(async (track) => {
      if (!track || track.file_id === undefined) {
        throw new Error("file_id is required");
      }

      return metadata.upsert({
        file_id: track.file_id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        year: track.year,
        comment: track.comment,
        track: track.track,
        genre: track.genre,
        type: track.type,
        size: track.size,
        album_artist: track.album_artist,
        composer: track.composer,
        discnumber: track.discnumber,
      });
    })
  );
}
