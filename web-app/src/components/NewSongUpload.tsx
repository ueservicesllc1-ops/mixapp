/**
 * NewSongUpload - Componente para subir canciones nuevas a la nube
 */

import React, { useState } from 'react';
import { X, Upload, Music } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import firestoreService from '../services/firestoreService';
import realB2Service from '../services/realB2Service';

interface NewSongUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete?: (songData: any) => void;
}

const NewSongUpload: React.FC<NewSongUploadProps> = ({ isOpen, onClose, onUploadComplete }) => {
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Por favor selecciona un archivo de audio válido (MP3, WAV, M4A, AAC, OGG)');
        return;
      }
      
      // Validar tamaño (máximo 100MB)
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 100MB.');
        return;
      }
      
      setSelectedFile(file);
      console.log('Archivo seleccionado:', file.name, file.size, 'bytes');
    }
  };

  const handleUploadSong = async () => {
    try {
      if (!songTitle || !artistName || !selectedFile) {
        alert('Por favor completa todos los campos y selecciona un archivo');
        return;
      }

      if (!user?.uid) {
        alert('Debes estar autenticado para subir a la nube');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Generar ID único para la canción
      const songId = `newsong_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`🎵 Subiendo nueva canción: ${artistName} - ${songTitle}`);
      console.log(`📁 Archivo: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`🆔 ID de canción: ${songId}`);
      
      // Usar el servicio realB2Service que usa el proxy backend para evitar CORS
      const uploadProgressCallback = (progress: any) => {
        console.log('Progreso de subida:', progress.progress);
        setUploadProgress(progress.progress);
      };

      console.log('📤 Subiendo a carpeta newsongs usando proxy backend...');
      
      // Subir archivo usando el proxy backend
      const downloadUrl = await realB2Service.uploadAudioFile(
        selectedFile,
        user.uid,
        uploadProgressCallback,
        songId,
        selectedFile.name // Solo el nombre del archivo, no la ruta completa
      );
      
      setUploadProgress(100);
      
      console.log('✅ Archivo subido a B2:', downloadUrl);
      
      // Guardar información en Firestore
      console.log('💾 Guardando información en Firestore...');
      
      const firestoreSongId = await firestoreService.addNewSong({
        title: songTitle,
        artist: artistName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadPath: `newsongs/${songId}/${selectedFile.name}`,
        ownerId: user.uid,
        folder: 'newsongs',
        b2Url: downloadUrl, // URL completa de B2
        audioFile: downloadUrl // También guardar como audioFile para compatibilidad
      });
      
      console.log('✅ Información guardada en Firestore con ID:', firestoreSongId);
      
      // Datos de la canción subida
      const songData = {
        id: firestoreSongId,
        songId: songId,
        title: songTitle,
        artist: artistName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadPath: downloadUrl,
        uploadDate: new Date().toLocaleString(),
        folder: 'newsongs',
        b2Url: downloadUrl,
        firestoreId: firestoreSongId
      };
      
      // Mostrar éxito
      alert(
        `✅ Nueva Canción Subida Exitosamente!\n\n🎵 Artista: ${artistName}\n🎶 Canción: ${songTitle}\n📁 Archivo: ${selectedFile.name}\n📏 Tamaño: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB\n\n📂 Carpeta: newsongs/\n🔗 URL: ${downloadUrl}\n\n🆔 ID Firestore: ${firestoreSongId}\n🆔 ID B2: ${songId}\n\n💾 Guardado en colección "newsongs" de Firestore`
      );
      
      // Llamar callback si existe
      if (onUploadComplete) {
        onUploadComplete(songData);
      }
      
      // Limpiar formulario
      setSongTitle('');
      setArtistName('');
      setSelectedFile(null);
      setIsUploading(false);
      setUploadProgress(0);
      onClose();
      
    } catch (error) {
      console.error('❌ Error subiendo nueva canción:', error);
      alert(`❌ Error al subir la canción: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSongTitle('');
      setArtistName('');
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Music className="h-6 w-6 text-primary-400" />
            <h2 className="text-xl font-bold text-white">🎵 Nueva Canción</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-white text-2xl disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white font-bold mb-2">🎤 Nombre del Artista:</label>
            <input
              type="text"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              disabled={isUploading}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-white font-bold mb-2">🎶 Título de la Canción:</label>
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              placeholder="Ej: Mi Nueva Canción"
              disabled={isUploading}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          
          <div>
            <label className="block text-white font-bold mb-2">📁 Archivo de Audio:</label>
            <input
              type="file"
              accept=".wav,.mp3,.m4a,.aac,.ogg"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none disabled:opacity-50"
            />
            {selectedFile && (
              <p className="text-green-400 text-sm mt-2">
                ✅ Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {isUploading && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-sm font-medium">Subiendo...</span>
                <span className="text-white text-sm">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <button
            onClick={handleUploadSong}
            disabled={isUploading || !songTitle || !artistName || !selectedFile}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Subiendo...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>🚀 Subir a "newsongs"</span>
              </>
            )}
          </button>

          <div className="text-xs text-gray-400 text-center">
            📂 La canción se subirá a la carpeta <strong>"newsongs"</strong> en tu bucket B2
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewSongUpload;
