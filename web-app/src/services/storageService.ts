/**
 * StorageService - File upload operations for MixerCurse Web
 */

import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  UploadTaskSnapshot 
} from 'firebase/storage';
import { storage } from '../config/firebase';
import { UploadProgress } from '../types';

class StorageService {
  // Upload audio file with progress tracking
  async uploadAudioFile(
    file: File, 
    userId: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `audio/${userId}/${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          
          if (onProgress) {
            onProgress({
              file,
              progress,
              status: 'uploading'
            });
          }
        },
        (error) => {
          if (onProgress) {
            onProgress({
              file,
              progress: 0,
              status: 'error',
              error: error.message
            });
          }
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (onProgress) {
              onProgress({
                file,
                progress: 100,
                status: 'completed'
              });
            }
            
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  // Delete audio file
  async deleteAudioFile(fileUrl: string): Promise<void> {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  }

  // Get file metadata
  getFileMetadata(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }

  // Validate audio file
  validateAudioFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/m4a',
      'audio/aac',
      'audio/ogg',
      'audio/flac'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 100MB.'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado. Use MP3, WAV, M4A, AAC, OGG o FLAC.'
      };
    }

    return { valid: true };
  }
}

export default new StorageService();
