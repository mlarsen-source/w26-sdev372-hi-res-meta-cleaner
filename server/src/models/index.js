import { audioFile } from "./audioFile.js";
import { metadata } from "./metadata.js";
import { user } from "./user.js";

// Users One to Many with AudioFiles
user.hasMany(audioFile, { foreignKey: "user_id" });
audioFile.belongsTo(user, { foreignKey: "user_id" });

// AudioFile One to One with Metadata
audioFile.hasOne(metadata, { foreignKey: "file_id" });
metadata.belongsTo(audioFile, { foreignKey: "file_id" });

export { audioFile, metadata, user };
