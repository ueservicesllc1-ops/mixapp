/**
 * MockB2Service - Simulación de subida a B2 para testing
 * Esta versión simula la subida para que puedas probar la interfaz
 */

import { UploadProgress } from '../types';

class MockB2Service {
  // Simular subida de archivo
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

      // Simular progreso de subida
      for (let progress = 10; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Simular delay
        
        if (onProgress) {
          onProgress({
            file,
            progress,
            status: 'uploading'
          });
        }
      }

      if (onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'completed'
        });
      }

      // Simular URL de descarga
      const downloadUrl = `https://s3.us-east-005.backblazeb2.com/mixercur/${fileName}`;
      console.log('Mock upload completed:', downloadUrl);
      
      return downloadUrl;

    } catch (error) {
      console.error('Mock upload error:', error);
      
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
    console.log('Mock delete file:', fileUrl);
  }
}

export default new MockB2Service();
