/**
 * B2S3Service - Backblaze B2 S3-Compatible API operations
 * Usa el endpoint S3 de B2 que tiene mejor soporte CORS
 */

import { UploadProgress } from '../types';
import { B2_CONFIG } from '../config/b2Config';

class B2S3Service {
  private config = B2_CONFIG;
  private endpoint = 'https://s3.us-east-005.backblazeb2.com';

  // Subir archivo usando S3 API
  async uploadAudioFile(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `audio/${userId}/${Date.now()}_${file.name}`;
      
      if (onProgress) {
        onProgress({
          file,
          progress: 10,
          status: 'uploading'
        });
      }

      // Crear FormData
      const formData = new FormData();
      formData.append('file', file);

      if (onProgress) {
        onProgress({
          file,
          progress: 50,
          status: 'uploading'
        });
      }

      // Subir usando S3 endpoint
      const response = await fetch(`${this.endpoint}/${this.config.bucketName}/${fileName}`, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
          'x-amz-acl': 'public-read'
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      if (onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'completed'
        });
      }

      // URL de descarga
      const downloadUrl = `${this.endpoint}/${this.config.bucketName}/${fileName}`;
      console.log('File uploaded successfully:', downloadUrl);
      
      return downloadUrl;

    } catch (error) {
      console.error('B2 S3 Upload error:', error);
      
      if (onProgress) {
        onProgress({
          file,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
      throw error;
    }
  }

  // Validar archivo de audio
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

  // Obtener metadatos del archivo
  getFileMetadata(file: File) {
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    };
  }

  // Eliminar archivo (placeholder)
  async deleteAudioFile(fileUrl: string): Promise<void> {
    console.log('Delete file:', fileUrl);
    // Implementar eliminación si es necesario
  }
}

export default new B2S3Service();
