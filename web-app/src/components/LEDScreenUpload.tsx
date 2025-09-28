import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import b2S3Service from '../services/b2S3Service';
import firestoreService from '../services/firestoreService';
import { UploadProgress } from '../types';

interface LEDScreenUploadProps {
  onUploadComplete?: () => void;
}

const LEDScreenUpload: React.FC<LEDScreenUploadProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [songName, setSongName] = useState('');
  const [imageName, setImageName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = b2S3Service.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Archivo inválido');
      return;
    }

    setSelectedFile(file);
    setError(null);
    
    // Crear preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Auto-completar nombre si está vacío
    if (!imageName) {
      setImageName(file.name.split('.')[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !songName.trim() || !imageName.trim()) {
      setError('Por favor completa todos los campos y selecciona una imagen');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Obtener dimensiones de la imagen
      const dimensions = await b2S3Service.getImageDimensions(selectedFile);
      
      // Subir imagen a B2
      const imageUrl = await b2S3Service.uploadLEDImage(
        selectedFile,
        user.uid,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Guardar metadatos en Firestore
      await firestoreService.createLEDImage({
        name: imageName,
        songName: songName,
        imageUrl: imageUrl,
        ownerId: user.uid,
        fileSize: selectedFile.size,
        dimensions: dimensions
      });

      // Limpiar formulario
      setSelectedFile(null);
      setSongName('');
      setImageName('');
      setUploadProgress(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete?.();
      
    } catch (error) {
      console.error('Error uploading LED image:', error);
      setError(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setSongName('');
    setImageName('');
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        📺 Subir Imagen para Pantalla LED
      </h2>
      
      <div className="space-y-6">
        {/* Selección de archivo */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Seleccionar Imagen
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            disabled={isUploading}
          />
          <p className="text-xs text-gray-400 mt-1">
            Formatos soportados: JPG, PNG, GIF, WebP, SVG. Máximo 10MB.
          </p>
        </div>

        {/* Preview de imagen */}
        {previewUrl && (
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-medium text-white mb-3">Vista Previa</h3>
            <div className="flex justify-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-h-48 max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        )}

        {/* Campos de texto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de la Canción *
            </label>
            <input
              type="text"
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Ej: Bohemian Rhapsody"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nombre de la Imagen *
            </label>
            <input
              type="text"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="Ej: Queen Logo"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Barra de progreso */}
        {uploadProgress && (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">
                Subiendo: {uploadProgress.file.name}
              </span>
              <span className="text-sm text-gray-300">
                {uploadProgress.progress}%
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            {uploadProgress.status === 'error' && (
              <p className="text-red-400 text-sm mt-2">
                Error: {uploadProgress.error}
              </p>
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile || !songName.trim() || !imageName.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo...' : 'Subir Imagen'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LEDScreenUpload;

