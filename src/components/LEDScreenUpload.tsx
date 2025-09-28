/**
 * LEDScreenUpload - Upload images for LED Screen display
 * 
 * @format
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
// import DocumentPicker from 'react-native-document-picker';
import { useAuth } from './AuthProvider';
import b2ImageService from '../services/b2ImageService';
import firestoreService from '../services/firestoreService';
import { UploadProgress } from '../services/b2ImageService';

const { width } = Dimensions.get('window');

interface LEDScreenUploadProps {
  onUploadComplete?: () => void;
}

const LEDScreenUpload: React.FC<LEDScreenUploadProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState<ImagePickerResponse | null>(null);
  const [songName, setSongName] = useState('');
  const [imageName, setImageName] = useState('');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectImageFromGallery = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        // Validate file
        const validation = b2ImageService.validateImageFile(
          asset.uri || '',
          asset.fileSize || 0
        );
        
        if (!validation.valid) {
          Alert.alert('Error', validation.error || 'Archivo inválido');
          return;
        }

        setSelectedImage(response);
        setError(null);
        
        // Auto-complete name if empty
        if (!imageName && asset.fileName) {
          setImageName(asset.fileName.split('.')[0]);
        }
      }
    });
  };

  const selectImageFromPC = () => {
    Alert.prompt(
      'URL de Imagen',
      'Ingresa la URL de la imagen que quieres subir (desde tu PC o internet):',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Cargar', 
          onPress: (url) => {
            if (url && url.trim()) {
              // Validate URL
              try {
                new URL(url);
                
                // Create a mock response for URL
                const mockResponse = {
                  assets: [{
                    uri: url.trim(),
                    fileName: url.split('/').pop() || 'image.jpg',
                    fileSize: 0, // Unknown size for URLs
                    type: 'image/jpeg',
                  }]
                };

                setSelectedImage(mockResponse);
                setError(null);
                
                // Auto-complete name if empty
                if (!imageName) {
                  const fileName = url.split('/').pop() || 'image';
                  setImageName(fileName.split('.')[0]);
                }
              } catch (error) {
                Alert.alert('Error', 'URL inválida');
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const showImageSelectionOptions = () => {
    Alert.alert(
      'Seleccionar Imagen',
      '¿Desde dónde quieres seleccionar la imagen?',
      [
        { text: 'Galería del Dispositivo', onPress: selectImageFromGallery },
        { text: 'URL de Imagen', onPress: selectImageFromPC },
        { text: 'Cancelar', style: 'cancel' }
      ]
    );
  };

  const uploadImage = async () => {
    if (!selectedImage?.assets?.[0] || !user || !songName.trim() || !imageName.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos y selecciona una imagen');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const asset = selectedImage.assets[0];
      
      // Get file metadata
      const metadata = await b2ImageService.getFileMetadata(asset.uri || '');
      
      // Upload image to B2
      const imageUrl = await b2ImageService.uploadLEDImage(
        asset.uri || '',
        user.uid,
        metadata,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Get image dimensions
      const dimensions = await b2ImageService.getImageDimensions(asset.uri || '');

      // Save metadata to Firestore
      await firestoreService.createLEDImage({
        name: imageName,
        songName: songName,
        imageUrl: imageUrl,
        ownerId: user.uid,
        fileSize: asset.fileSize || 0,
        dimensions: dimensions
      });

      // Clear form
      setSelectedImage(null);
      setSongName('');
      setImageName('');
      setUploadProgress(null);

      Alert.alert('Éxito', 'Imagen subida correctamente');
      onUploadComplete?.();
      
    } catch (error) {
      console.error('Error uploading LED image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedImage(null);
    setSongName('');
    setImageName('');
    setError(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📺 Subir Imagen LED</Text>
        <Text style={styles.subtitle}>Para pantalla del mixer</Text>
      </View>

      {/* Image Selection */}
      <View style={styles.section}>
        <Text style={styles.label}>Seleccionar Imagen</Text>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={showImageSelectionOptions}
          disabled={isUploading}
        >
          {selectedImage?.assets?.[0] ? (
            <Image
              source={{ uri: selectedImage.assets[0].uri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubtext}>Toca para seleccionar</Text>
              <Text style={styles.placeholderSubtext2}>Galería o PC</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.helpText}>
          Formatos: JPG, PNG, GIF, WebP, SVG. Máx 10MB
        </Text>
      </View>

      {/* Text Inputs */}
      <View style={styles.section}>
        <Text style={styles.label}>Nombre de la Canción *</Text>
        <TextInput
          style={styles.input}
          value={songName}
          onChangeText={setSongName}
          placeholder="Ej: Bohemian Rhapsody"
          placeholderTextColor="#666"
          editable={!isUploading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Nombre de la Imagen *</Text>
        <TextInput
          style={styles.input}
          value={imageName}
          onChangeText={setImageName}
          placeholder="Ej: Queen Logo"
          placeholderTextColor="#666"
          editable={!isUploading}
        />
      </View>

      {/* Upload Progress */}
      {uploadProgress && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Subiendo: {uploadProgress.progress}%
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${uploadProgress.progress}%` }
              ]}
            />
          </View>
          {uploadProgress.status === 'error' && (
            <Text style={styles.errorText}>
              Error: {uploadProgress.error}
            </Text>
          )}
        </View>
      )}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={cancelUpload}
          disabled={isUploading}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.uploadButton,
            (!selectedImage || !songName.trim() || !imageName.trim() || isUploading) && styles.disabledButton
          ]}
          onPress={uploadImage}
          disabled={isUploading || !selectedImage || !songName.trim() || !imageName.trim()}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadButtonText}>Subir Imagen</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  imageButton: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  placeholderSubtext2: {
    fontSize: 12,
    color: '#666',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  progressContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  progressText: {
    color: '#fff',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
  errorContainer: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
});

export default LEDScreenUpload;
