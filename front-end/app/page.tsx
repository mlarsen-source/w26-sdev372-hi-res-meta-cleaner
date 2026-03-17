'use client';

import { useEffect } from 'react';
import { useAuth } from './components/AuthProvider';
import NavBar from './components/NavBar';
import Loading from './components/Loading';
import LoginPrompt from './components/LoginPrompt';
import UploadView from './components/UploadView';
import CollectionView from './components/CollectionView';
import { useUpload } from './hooks/useUpload';
import { useCollection } from './hooks/useCollection';
import { useMounted } from './hooks/useMounted';
import { API_BASE_URL } from './lib/apiBaseUrl';

export default function HomePage() {
  const { user } = useAuth();
  const mounted = useMounted();

  const { fetchCollection, ...collection } = useCollection(API_BASE_URL);
  const upload = useUpload(API_BASE_URL);

  useEffect(() => {
    if (upload.hasSubmitted) fetchCollection();
  }, [upload.hasSubmitted, fetchCollection]);

  if (!mounted) return <div className="page-content" />;

  const navBarProps = {
    setIsUploading: upload.setIsUploading,
    setHasSubmitted: (value: boolean) => {
      if (!value) upload.resetFiles();
      upload.setHasSubmitted(value);
    },
    hasSubmitted: upload.hasSubmitted,
  };

  if (!user) {
    return (
      <>
        <NavBar {...navBarProps} />
        <header className="page-header">
          <h1>Hi-Res Meta Cleaner</h1>
        </header>
        <LoginPrompt />
      </>
    );
  }

  return (
    <>
      <NavBar {...navBarProps} showActive showNavActions />
      <header className="page-header">
        <h1>Hi-Res Meta Cleaner</h1>
      </header>
      <div className="page-content">
        {upload.isUploading ? (
          <Loading message="Uploading files" />
        ) : !upload.hasSubmitted ? (
          <UploadView
            localCollection={upload.localCollection}
            onFilesSelected={upload.handleFilesSelected}
            onRemove={upload.handleRemoveFile}
            onSubmit={upload.handleUpload}
            uploadError={upload.uploadError}
            duplicateFilenames={upload.duplicateFilenames}
            resetKey={upload.resetKey}
          />
        ) : (
          <CollectionView
            collection={collection.uploadedCollection}
            isLoadingCollection={collection.isLoadingCollection}
            selectedForDownload={collection.selectedForDownload}
            onSelectionChange={collection.setSelectedForDownload}
            onDownload={collection.handleDownload}
            isDownloading={collection.isDownloading}
          />
        )}
      </div>
    </>
  );
}
