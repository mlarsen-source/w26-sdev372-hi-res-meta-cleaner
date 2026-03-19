import { useState } from "react";
import { AudioFile } from "../types/audio";
import CollectionTable from "./CollectionTable";
import pageStyles from "../page.module.css";
import styles from "./CollectionView.module.css";
import Loading from "./Loading";

type Props = {
  collection: AudioFile[];
  isLoadingCollection: boolean;
  selectedForDownload: Set<number>;
  onSelectionChange: (selected: Set<number>) => void;
  onDownload: () => void;
  isDownloading: boolean;
};

export default function CollectionView({
  collection,
  isLoadingCollection,
  selectedForDownload,
  onSelectionChange,
  onDownload,
  isDownloading,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const collectionHeading = (
    <h2 className="section-heading">Audio Collection Editor</h2>
  );

  return (
    <div>
      {isLoadingCollection ? (
        <>
          {collectionHeading}
          <Loading message="Loading collection" />
        </>
      ) : collection.length === 0 ? (
        <>
          {collectionHeading}
          <p>No files in your collection.</p>
        </>
      ) : (
        <>
          <div className={styles.collectionHeader}>
            {collectionHeading}
            <div className={styles.collectionControls}>
              <label
                htmlFor="collection-search"
                className={styles.searchLabel}>
                Search collection
              </label>
              <input
                id="collection-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search file, title, artist, album, year"
                className={styles.searchInput}
              />
            </div>
          </div>
          <CollectionTable
            collection={collection}
            showDownload
            selectedFiles={selectedForDownload}
            onSelectionChange={onSelectionChange}
            filterTerm={searchTerm}
            enableSorting
          />
          <button
            type="button"
            className={`submit-button ${pageStyles.downloadButton}`}
            onClick={onDownload}
            disabled={selectedForDownload.size === 0 || isDownloading}>
            {isDownloading
              ? "Downloading..."
              : `Download Selected (${selectedForDownload.size})`}
          </button>
        </>
      )}
    </div>
  );
}
