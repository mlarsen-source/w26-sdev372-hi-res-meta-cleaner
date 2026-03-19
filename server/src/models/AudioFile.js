import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

export const audioFile = sequelize.define(
  "audioFile",
  {
    file_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    original_filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    upload_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audio_files",
    timestamps: false,
  }
);
