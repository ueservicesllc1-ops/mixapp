import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import firestoreService from '../services/firestoreService';
import { LEDImage } from '../types';

interface LEDDisplayProps {
  selectedImageId?: string;
  onImageSelect?: (image: LEDImage) => void;
}

const LEDDisplay: React.FC<LEDDisplayProps> = ({ selectedImageId, onImageSelect }) => {
  const { user } = useAuth();
  const [ledImages, setLedImages] = useState<LEDImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<LEDImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar imágenes LED del usuario
  useEffect(() => {
    const loadLEDImages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const images = await firestoreService.getUserLEDImages(user.uid);
        setLedImages(images);
        
        // Si hay una imagen seleccionada por ID, cargarla
        if (selectedImageId) {
          const image = images.find(img => img.id === selectedImageId);
          if (image) {
            setSelectedImage(image);
            onImageSelect?.(image);
          }
        }
      } catch (error) {
        console.error('Error loading LED images:', error);
        setError('Error al cargar las imágenes');
      } finally {
        setLoading(false);
      }
    };

    loadLEDImages();
  }, [user, selectedImageId, onImageSelect]);

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestoreService.subscribeToUserLEDImages(
      user.uid,
      (images) => {
        setLedImages(images);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleImageSelect = (image: LEDImage) => {
    setSelectedImage(image);
    onImageSelect?.(image);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Cargando imágenes LED...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden">
      {/* Header de la pantalla LED */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <h2 className="text-xl font-bold text-white">LED SCREEN</h2>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="text-sm text-gray-300">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="p-6">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {ledImages.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              No hay imágenes LED
            </h3>
            <p className="text-gray-400">
              Sube una imagen para mostrarla en la pantalla LED del mixer
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Imagen seleccionada - Pantalla LED principal */}
            {selectedImage && (
              <div className="bg-black rounded-lg p-4 border-2 border-blue-500">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    🎵 {selectedImage.songName}
                  </h3>
                  <p className="text-gray-300">{selectedImage.name}</p>
                </div>
                <div className="flex justify-center">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.name}
                    className="max-h-64 max-w-full rounded-lg object-contain border border-gray-600"
                    style={{
                      filter: 'brightness(1.2) contrast(1.1)',
                      boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                    }}
                  />
                </div>
                <div className="mt-4 text-center text-sm text-gray-400">
                  {selectedImage.dimensions && (
                    <span>{selectedImage.dimensions.width} × {selectedImage.dimensions.height}px</span>
                  )}
                  <span className="mx-2">•</span>
                  <span>{formatFileSize(selectedImage.fileSize)}</span>
                </div>
              </div>
            )}

            {/* Lista de imágenes disponibles */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Imágenes Disponibles ({ledImages.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ledImages.map((image) => (
                  <div
                    key={image.id}
                    onClick={() => handleImageSelect(image)}
                    className={`bg-gray-800 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-gray-700 border-2 ${
                      selectedImage?.id === image.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700'
                    }`}
                  >
                    <div className="aspect-video bg-gray-700 rounded-lg mb-3 overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-medium text-white truncate">
                        {image.name}
                      </h4>
                      <p className="text-sm text-gray-400 truncate">
                        🎵 {image.songName}
                      </p>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{formatFileSize(image.fileSize)}</span>
                        <span>
                          {image.dimensions && 
                            `${image.dimensions.width}×${image.dimensions.height}`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LEDDisplay;

