import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

ffmpeg.setFfmpegPath(ffmpegStatic);

export function writeMetadataToFile(inputPath, outputPath, metadata) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg(inputPath).outputOption("-c copy");

    if (metadata.title) command.outputOption(`-metadata`, `title=${metadata.title}`);
    if (metadata.artist) command.outputOption(`-metadata`, `artist=${metadata.artist}`);
    if (metadata.album) command.outputOption(`-metadata`, `album=${metadata.album}`);
    if (metadata.year) command.outputOption(`-metadata`, `date=${metadata.year}`);
    if (metadata.comment) command.outputOption(`-metadata`, `comment=${metadata.comment}`);
    if (metadata.track) command.outputOption(`-metadata`, `track=${metadata.track}`);
    if (metadata.genre) command.outputOption(`-metadata`, `genre=${metadata.genre}`);
    if (metadata.album_artist) command.outputOption(`-metadata`, `album_artist=${metadata.album_artist}`);
    if (metadata.composer) command.outputOption(`-metadata`, `composer=${metadata.composer}`);
    if (metadata.discnumber) command.outputOption(`-metadata`, `disc=${metadata.discnumber}`);

    command
      .output(outputPath)
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
}
