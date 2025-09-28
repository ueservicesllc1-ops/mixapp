/**
 * B2ImageService - Upload images to Backblaze B2 for LED Screen
 * 
 * @format
 */

import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { B2_CONFIG } from '../config/firebase';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface ImageMetadata {
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

class B2ImageService {
  private config = B2_CONFIG;
  private endpoint = 'https://s3.us-east-005.backblazeb2.com';

  // Upload image to B2
  async uploadLEDImage(
    imagePath: string,
    userId: string,
    metadata: ImageMetadata,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      const fileName = `led-images/${userId}/${Date.now()}_${metadata.name}`;
      
      if (onProgress) {
        onProgress({
          progress: 10,
          status: 'uploading'
        });
      }

      // Read file as base64
      const fileData = await RNFS.readFile(imagePath, 'base64');
      const binaryData = Buffer.from(fileData, 'base64');

      if (onProgress) {
        onProgress({
          progress: 50,
          status: 'uploading'
        });
      }

      // Upload to B2 using fetch
      const response = await fetch(`${this.endpoint}/${this.config.bucketName}/${fileName}`, {
        method: 'PUT',
        body: binaryData,
        headers: {
          'Content-Type': metadata.type,
          'x-amz-acl': 'public-read'
        }
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      if (onProgress) {
        onProgress({
          progress: 100,
          status: 'completed'
        });
      }

      // Return download URL
      const downloadUrl = `${this.endpoint}/${this.config.bucketName}/${fileName}`;
      console.log('LED Image uploaded successfully:', downloadUrl);
      
      return downloadUrl;

    } catch (error) {
      console.error('B2 Image Upload error:', error);
      
      if (onProgress) {
        onProgress({
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
      throw error;
    }
  }

  // Validate image file
  validateImageFile(filePath: string, fileSize: number): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

    if (fileSize > maxSize) {
      return {
        valid: false,
        error: 'El archivo es demasiado grande. Máximo 10MB.'
      };
    }

    const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
    if (!allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Tipo de archivo no soportado. Use JPG, PNG, GIF, WebP o SVG.'
      };
    }

    return { valid: true };
  }

  // Get image dimensions (simplified for React Native)
  async getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
    try {
      // For React Native, we'll use a simplified approach
      // In a real implementation, you might want to use react-native-image-size
      return {
        width: 1920, // Default LED screen width
        height: 1080  // Default LED screen height
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return {
        width: 1920,
        height: 1080
      };
    }
  }

  // Get file metadata
  async getFileMetadata(filePath: string): Promise<ImageMetadata> {
    try {
      const stats = await RNFS.stat(filePath);
      const fileName = filePath.split('/').pop() || 'unknown';
      
      return {
        name: fileName,
        size: stats.size,
        type: this.getMimeType(fileName),
        width: 1920, // Default values
        height: 1080
      };
    } catch (error) {
      console.error('Error getting file metadata:', error);
      return {
        name: 'unknown',
        size: 0,
        type: 'image/jpeg'
      };
    }
  }

  // Get MIME type from file extension
  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    switch (extension) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'image/jpeg';
    }
  }
}

export default new B2ImageService();

