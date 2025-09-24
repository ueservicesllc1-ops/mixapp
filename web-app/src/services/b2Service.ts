/**
 * B2Service - Backblaze B2 Storage operations for MixerCurse Web
 */

import { UploadProgress } from '../types';
import { B2_CONFIG } from '../config/b2Config';

interface B2Config {
  applicationKeyId: string;
  applicationKey: string;
  bucketId: string;
  bucketName: string;
}

class B2Service {
  private config: B2Config;
  private authToken: string | null = null;
  private uploadUrl: string | null = null;
  private uploadAuthToken: string | null = null;

  constructor() {
    // Configuración de B2 desde archivo de configuración
    this.config = B2_CONFIG;
  }

  // Autenticar con B2
  private async authenticate(): Promise<void> {
    if (this.authToken) return;

    try {
      const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${this.config.applicationKeyId}:${this.config.applicationKey}`)}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('B2 Auth response:', response.status, errorText);
        throw new Error(`Failed to authenticate with B2: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      this.authToken = data.authorizationToken;
      console.log('B2 Authentication successful');
    } catch (error) {
      console.error('B2 Authentication error:', error);
      throw error;
    }
  }

  // Obtener URL de upload
  private async getUploadUrl(): Promise<void> {
    if (this.uploadUrl && this.uploadAuthToken) return;

    await this.authenticate();

    try {
      const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_get_upload_url', {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucketId: this.config.bucketId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get upload URL');
      }

      const data = await response.json();
      this.uploadUrl = data.uploadUrl;
      this.uploadAuthToken = data.authorizationToken;
    } catch (error) {
      console.error('B2 Upload URL error:', error);
      throw error;
    }
  }

  // Subir archivo a B2
  async uploadAudioFile(
    file: File,
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      await this.getUploadUrl();

      const fileName = `audio/${userId}/${Date.now()}_${file.name}`;
      
      if (onProgress) {
        onProgress({
          file,
          progress: 10,
          status: 'uploading'
        });
      }

      // Crear FormData para la subida
      const formData = new FormData();
      formData.append('file', file);

      // Headers requeridos por B2
      const headers: Record<string, string> = {
        'Authorization': this.uploadAuthToken!,
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Type': file.type,
        'X-Bz-Content-Sha1': 'do_not_verify' // Para archivos pequeños, puedes usar esto
      };

      if (onProgress) {
        onProgress({
          file,
          progress: 50,
          status: 'uploading'
        });
      }

      // Subir archivo
      const response = await fetch(this.uploadUrl!, {
        method: 'POST',
        headers,
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'completed'
        });
      }

      // Construir URL de descarga usando el endpoint correcto
      const downloadUrl = `https://s3.us-east-005.backblazeb2.com/${this.config.bucketName}/${fileName}`;
      
      return downloadUrl;

    } catch (error) {
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

  // Eliminar archivo de B2
  async deleteAudioFile(fileUrl: string): Promise<void> {
    await this.authenticate();

    // Extraer fileName de la URL
    const fileName = fileUrl.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid file URL');
    }

    try {
      const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_delete_file_version', {
        method: 'POST',
        headers: {
          'Authorization': this.authToken!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileId: fileName, // Necesitarías el fileId real, no el fileName
          fileName: fileName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('B2 Delete error:', error);
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
}

export default new B2Service();
