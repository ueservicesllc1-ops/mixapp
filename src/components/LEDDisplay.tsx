/**
 * LEDDisplay - Display LED Screen for mixer
 * 
 * @format
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useAuth } from './AuthProvider';
import firestoreService, { LEDImage } from '../services/firestoreService';

const { width, height } = Dimensions.get('window');

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

  // Load LED images
  useEffect(() => {
    const loadLEDImages = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        console.log('🔄 Loading LED images for user:', user.uid);
        const images = await firestoreService.getUserLEDImages(user.uid);
        console.log('📸 Loaded LED images:', images.length, images);
        setLedImages(images);
        
        // If there's a selected image by ID, load it
        if (selectedImageId) {
          const image = images.find(img => img.id === selectedImageId);
          if (image) {
            setSelectedImage(image);
            onImageSelect?.(image);
          }
        }
      } catch (error) {
        console.error('❌ Error loading LED images:', error);
        setError('Error al cargar las imágenes');
      } finally {
        setLoading(false);
      }
    };

    loadLEDImages();
  }, [user, selectedImageId, onImageSelect]);

  // Subscribe to real-time updates
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

  const handleDownloadImage = async (image: LEDImage) => {
    try {
      console.log('📥 Descargando imagen:', image.name);
      
      // Usar react-native-fs que ya está instalado
      const RNFS = require('react-native-fs');
      
      // Verificar que la librería esté disponible
      if (!RNFS) {
        throw new Error('react-native-fs no está disponible');
      }
      
      console.log('📦 RNFS cargado:', !!RNFS);
      console.log('📦 RNFS.DocumentDirectoryPath:', !!RNFS.DocumentDirectoryPath);
      
      // Usar una ruta en el almacenamiento externo para que sea visible
      const fileName = `${image.name}_${Date.now()}.jpg`;
      const filePath = RNFS.ExternalStorageDirectoryPath + '/Download/' + fileName;
      
      console.log('📁 Directorio de descarga:', RNFS.ExternalStorageDirectoryPath + '/Download');
      console.log('📄 Archivo:', fileName);
      console.log('📄 Ruta completa:', filePath);
      
      // Descargar la imagen usando fetch nativo
      console.log('🌐 Descargando desde:', image.imageUrl);
      console.log('🔍 URL completa:', image.imageUrl);
      
      // Verificar que la URL sea válida
      if (!image.imageUrl || !image.imageUrl.startsWith('http')) {
        throw new Error('URL de imagen no válida');
      }
      
      // Intentar con diferentes URLs de Backblaze B2
      let response;
      let finalUrl = image.imageUrl;
      
      // Si es una URL de Backblaze B2, intentar con diferentes formatos
      if (image.imageUrl.includes('backblazeb2.com')) {
        console.log('🔄 Intentando con URL alternativa de Backblaze B2...');
        
        // Primero intentar con f005 si tiene f000
        let correctedUrl = image.imageUrl;
        if (image.imageUrl.includes('f000.backblazeb2.com')) {
          correctedUrl = image.imageUrl.replace('f000.backblazeb2.com', 'f005.backblazeb2.com');
          console.log('🔧 URL corregida de f000 a f005:', correctedUrl);
        }
        
        // Intentar con la URL S3 compatible
        const s3Url = correctedUrl.replace('f005.backblazeb2.com/file/', 'mixercur.s3.us-east-005.backblazeb2.com/');
        console.log('🔗 URL S3 alternativa:', s3Url);
        
        try {
          response = await fetch(s3Url);
          if (response.ok) {
            finalUrl = s3Url;
            console.log('✅ URL S3 funcionó');
          } else {
            console.log('❌ URL S3 falló, usando URL corregida');
            response = await fetch(correctedUrl);
            finalUrl = correctedUrl;
          }
        } catch (error) {
          console.log('❌ Error con URL S3, usando URL corregida');
          response = await fetch(correctedUrl);
          finalUrl = correctedUrl;
        }
      } else {
        response = await fetch(image.imageUrl);
      }
      
      console.log('📡 Status de respuesta:', response.status);
      console.log('📡 URL final usada:', finalUrl);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}\nURL: ${finalUrl}`);
      }
      
      // Obtener el contenido como array buffer
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convertir a base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64Data = btoa(binary);
      
      console.log('📊 Tamaño del array buffer:', arrayBuffer.byteLength, 'bytes');
      console.log('📊 Tamaño del base64:', base64Data.length, 'caracteres');
      
      // Guardar el archivo
      await RNFS.writeFile(filePath, base64Data, 'base64');
      
      console.log('✅ Imagen descargada en:', filePath);
      
      // Verificar que el archivo se guardó
      const fileExists = await RNFS.exists(filePath);
      if (fileExists) {
        const fileSize = await RNFS.stat(filePath);
        console.log('📊 Tamaño del archivo:', fileSize.size, 'bytes');
        
        Alert.alert(
          '✅ Descarga Completada',
          `Imagen guardada en:\n${filePath}\n\nTamaño: ${(fileSize.size / 1024).toFixed(1)} KB\n\nPara encontrar la imagen:\n1. Abre "Files" en el emulador\n2. Ve a "Download" o "Descargas"`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('El archivo no se guardó correctamente');
      }
      
    } catch (error) {
      console.error('❌ Error descargando imagen:', error);
      Alert.alert(
        'Error',
        `No se pudo descargar la imagen: ${error.message}\nInténtalo de nuevo.`,
        [{ text: 'OK' }]
      );
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderLEDImage = ({ item }: { item: LEDImage }) => (
    <TouchableOpacity
      style={[
        styles.imageCard,
        selectedImage?.id === item.id && styles.selectedImageCard
      ]}
      onPress={() => handleImageSelect(item)}
    >
      <View style={styles.imageInfo}>
        <Text style={styles.imageName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.songName} numberOfLines={1}>
          🎵 {item.songName}
        </Text>
        <View style={styles.imageMeta}>
          <Text style={styles.metaText}>
            {formatFileSize(item.fileSize)}
          </Text>
          {item.dimensions && (
            <Text style={styles.metaText}>
              {item.dimensions.width}×{item.dimensions.height}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.downloadButtonSmall}
          onPress={() => handleDownloadImage(item)}
        >
          <Text style={styles.downloadButtonTextSmall}>📥 Descargar</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando imágenes LED...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* LED Screen Header */}
      <View style={styles.ledHeader}>
        <View style={styles.ledIndicators}>
          <View style={[styles.ledDot, styles.redLed]} />
          <Text style={styles.ledTitle}>LED SCREEN</Text>
          <View style={[styles.ledDot, styles.greenLed]} />
        </View>
        <Text style={styles.timeText}>
          {new Date().toLocaleTimeString()}
        </Text>
      </View>

      {/* Main LED Display */}
      {selectedImage ? (
        <View style={styles.ledDisplay}>
          <View style={styles.ledContent}>
            <Text style={styles.songTitle}>🎵 {selectedImage.songName}</Text>
            <Text style={styles.imageTitle}>{selectedImage.name}</Text>
            
            {/* Download Button */}
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={() => handleDownloadImage(selectedImage)}
            >
              <Text style={styles.downloadButtonText}>📥 Descargar Imagen</Text>
            </TouchableOpacity>
            
            <View style={styles.ledMeta}>
              {selectedImage.dimensions && (
                <Text style={styles.ledMetaText}>
                  {selectedImage.dimensions.width} × {selectedImage.dimensions.height}px
                </Text>
              )}
              <Text style={styles.ledMetaText}>
                {formatFileSize(selectedImage.fileSize)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.emptyDisplay}>
          <Text style={styles.emptyIcon}>📺</Text>
          <Text style={styles.emptyTitle}>No hay imagen seleccionada</Text>
          <Text style={styles.emptySubtitle}>
            Selecciona una imagen de la lista para descargarla
          </Text>
        </View>
      )}

        {/* Available Images */}
        <View style={styles.imagesSection}>
          <Text style={styles.sectionTitle}>
            Imágenes Disponibles ({ledImages.length})
          </Text>
        
        {ledImages.length === 0 ? (
          <View style={styles.emptyImages}>
            <Text style={styles.emptyImagesIcon}>📷</Text>
            <Text style={styles.emptyImagesText}>No hay imágenes LED</Text>
            <Text style={styles.emptyImagesSubtext}>
              Sube una imagen para mostrarla en la pantalla LED del mixer
            </Text>
          </View>
        ) : (
          <View style={styles.imagesGrid}>
            {ledImages.map((item) => renderLEDImage({ item, key: item.id }))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  ledHeader: {
    backgroundColor: '#1e3a8a',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  ledIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ledDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 8,
  },
  redLed: {
    backgroundColor: '#ef4444',
  },
  greenLed: {
    backgroundColor: '#10b981',
  },
  ledTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  timeText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  ledDisplay: {
    backgroundColor: '#000',
    padding: 16,
    minHeight: 300,
    borderWidth: 2,
    borderColor: '#3b82f6',
    margin: 16,
    borderRadius: 8,
  },
  ledContent: {
    alignItems: 'center',
  },
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  imageTitle: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 16,
    textAlign: 'center',
  },
  downloadButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1d4ed8',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  downloadButtonSmall: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'center',
  },
  downloadButtonTextSmall: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ledMeta: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
  },
  ledMetaText: {
    color: '#6b7280',
    fontSize: 12,
    marginHorizontal: 8,
  },
  emptyDisplay: {
    backgroundColor: '#000',
    padding: 32,
    alignItems: 'center',
    margin: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  imagesSection: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  imagesList: {
    paddingBottom: 16,
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  imageCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#374151',
  },
  selectedImageCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  imageInfo: {
    padding: 12,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  songName: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
  },
  imageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 10,
    color: '#6b7280',
  },
  emptyImages: {
    alignItems: 'center',
    padding: 32,
  },
  emptyImagesIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyImagesText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyImagesSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default LEDDisplay;
