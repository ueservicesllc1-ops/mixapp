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

  // Subir imagen para LED Screen
  async uploadLEDImage(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `led-images/${userId}/${Date.now()}_${file.name}`;
      
      if (onProgress) {
        onProgress({
          file,
          progress: 10,
          status: 'uploading'
        });
      }

      if (onProgress) {
        onProgress({
          file,
          progress: 50,
          status: 'uploading'
        });
      }

      // Subir usando proxy backend
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'completed'
        });
      }

      // URL de descarga desde la respuesta del proxy
      const downloadUrl = result.downloadUrl;
      console.log('LED Image uploaded successfully:', downloadUrl);
      
      return downloadUrl;

    } catch (error) {
      console.error('B2 S3 LED Image Upload error:', error);
      
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

  // Validar archivo de imagen
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB.'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado. Use JPG, PNG, GIF, WebP o SVG.'
      };
    }

    return { valid: true };
  }

  // Obtener dimensiones de imagen
  getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export default new B2S3Service();
