/**
 * FileUpload - Component for uploading audio files
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Music, CheckCircle, AlertCircle, FileAudio } from 'lucide-react';
import storageService from '../services/storageService';
import firestoreService from '../services/firestoreService';
import { UploadProgress, Song } from '../types';

interface FileUploadProps {
  userId: string;
  onUploadComplete?: (songs: Song[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId, onUploadComplete }) => {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    const newUploads: UploadProgress[] = [];

    // Initialize upload progress for all files
    acceptedFiles.forEach(file => {
      const validation = storageService.validateAudioFile(file);
      if (validation.valid) {
        newUploads.push({
          file,
          progress: 0,
          status: 'uploading'
        });
      } else {
        newUploads.push({
          file,
          progress: 0,
          status: 'error',
          error: validation.error
        });
      }
    });

    setUploads(newUploads);

    // Upload valid files
    const uploadPromises = newUploads
      .filter(upload => upload.status === 'uploading')
      .map(async (upload) => {
        try {
          const downloadURL = await storageService.uploadAudioFile(
            upload.file,
            userId,
            (progress) => {
              setUploads(prev => prev.map(u => 
                u.file === upload.file ? progress : u
              ));
            }
          );

          // Create song record in Firestore
          const songData: Omit<Song, 'id'> = {
            title: upload.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            artist: 'Unknown',
            key: 'C',
            bpm: 120,
            audioFile: downloadURL,
            order: 0,
            duration: 0, // Could be calculated from audio file
            fileSize: upload.file.size,
            uploadDate: new Date()
          };

          // For now, we'll add to a default setlist or create one
          // In a real app, you might want to let users choose the setlist
          const setlistId = await createOrGetDefaultSetlist(userId);
          await firestoreService.addSongToSetlist(setlistId, songData);

          return { ...upload, status: 'completed' as const };
        } catch (error: any) {
          return {
            ...upload,
            status: 'error' as const,
            error: error.message
          };
        }
      });

    await Promise.all(uploadPromises);
    setIsUploading(false);

    // Notify parent component
    if (onUploadComplete) {
      // You might want to fetch the actual songs from Firestore here
      onUploadComplete([]);
    }
  }, [userId, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
    },
    multiple: true
  });

  const removeUpload = (file: File) => {
    setUploads(prev => prev.filter(upload => upload.file !== file));
  };

  const createOrGetDefaultSetlist = async (userId: string): Promise<string> => {
    // Try to get existing setlist first
    const setlists = await firestoreService.getUserSetlists(userId);
    const defaultSetlist = setlists.find(s => s.name === 'Default Setlist');
    
    if (defaultSetlist) {
      return defaultSetlist.id;
    }

    // Create new default setlist
    return await firestoreService.createSetlist({
      name: 'Default Setlist',
      ownerId: userId,
      songs: []
    });
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-dark-600 hover:border-primary-500 hover:bg-primary-500/5'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-4 rounded-full">
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isDragActive ? 'Suelta los archivos aquí' : 'Sube tus archivos de audio'}
            </h3>
            <p className="text-dark-400 mb-4">
              Arrastra y suelta archivos de audio aquí, o haz clic para seleccionar
            </p>
            <p className="text-sm text-dark-500">
              Formatos soportados: MP3, WAV, M4A, AAC, OGG, FLAC (máx. 100MB)
            </p>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center">
            <Music className="h-5 w-5 mr-2" />
            Archivos subiendo
          </h4>
          {uploads.map((upload, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <FileAudio className="h-5 w-5 text-primary-400" />
                  <div>
                    <p className="text-white font-medium">{upload.file.name}</p>
                    <p className="text-sm text-dark-400">
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {upload.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <button
                    onClick={() => removeUpload(upload.file)}
                    className="text-dark-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {upload.status === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">Subiendo...</span>
                    <span className="text-white">{Math.round(upload.progress)}%</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {upload.status === 'completed' && (
                <div className="text-green-400 text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Subida completada
                </div>
              )}

              {upload.status === 'error' && (
                <div className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {upload.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
