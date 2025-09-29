/**
 * FileUpload - Component for uploading audio files to user's library
 */

import React from 'react';
import ZipUpload from './ZipUpload';

interface FileUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId, onUploadComplete }) => {
  return <ZipUpload />;
};

export default FileUpload;