import { DataTypes } from "sequelize";
import sequelize from "../db/sequelize.js";

export const metadata = sequelize.define(
  "metadata",
  {
    metadata_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // one-to-one with AudioFiles
    },

    title: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    artist: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    album: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    track: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    genre: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    size: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    album_artist: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    composer: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    discnumber: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "metadata",
    timestamps: false,
  }
);
