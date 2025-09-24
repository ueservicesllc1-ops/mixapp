/**
 * FileUpload - Component for uploading audio files to user's library
 */

import React from 'react';
import AudioLibraryUpload from './AudioLibraryUpload';

interface FileUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId, onUploadComplete }) => {
  return (
    <AudioLibraryUpload 
      userId={userId} 
      onUploadComplete={onUploadComplete}
    />
  );
};

export default FileUpload;