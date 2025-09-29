/**
 * Dashboard - Main dashboard component
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Music, BarChart3, Settings, Monitor } from 'lucide-react';
import Header from './Header';
import FileUpload from './FileUpload';
import SongLibrary from './SongLibrary';
import LEDScreenUpload from './LEDScreenUpload';
import LEDDisplay from './LEDDisplay';
import NewSongUpload from './NewSongUpload';
import NewSongsLibrary from './NewSongsLibrary';
import ZipUpload from './ZipUpload';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'library' | 'songs' | 'newsongs' | 'led-screen' | 'analytics'>('upload');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showNewSongForm, setShowNewSongForm] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [songs, setSongs] = useState<Array<{
    id: string;
    title: string;
    artist: string;
    fileName: string;
    fileSize: number;
    uploadPath: string;
    uploadDate: string;
    folder?: string;
  }>>([]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Generar ID único para la canción
      const songId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Construir la ruta donde se subirá
      const uploadPath = `canciones/${songId}/`;
      const fullPath = `https://mixercur.s3.us-east-005.backblazeb2.com/${uploadPath}`;
      
      console.log(`🎵 Subiendo canción: ${artistName} - ${songTitle}`);
      console.log(`📁 Archivo: ${selectedFile.name} (${(selectedFile.size / 1024 / 1024).toFixed(2)} MB)`);
      console.log(`📁 Ruta de subida: ${fullPath}`);
      console.log(`🆔 ID de canción: ${songId}`);
      
      // Subir archivo directamente a B2
      const AWS = require('aws-sdk');
      
      const s3 = new AWS.S3({
        endpoint: 'https://s3.us-east-005.backblazeb2.com',
        accessKeyId: '005c2b526be0baa0000000011',
        secretAccessKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
        region: 'us-east-005',
        s3ForcePathStyle: true
      });
      
      const fileName = `canciones/${songId}/${selectedFile.name}`;
      
      const uploadParams = {
        Bucket: 'mixercur',
        Key: fileName,
        Body: selectedFile,
        ContentType: selectedFile.type,
        ACL: 'public-read'
      };
      
      console.log('📤 Subiendo directamente a B2...');
      const result = await s3.upload(uploadParams).promise();
      console.log('✅ Archivo subido a B2:', result.Location);
      
      // Mostrar éxito con la ruta real de B2
      alert(
        `✅ Canción Subida Exitosamente a B2\n\nArtista: ${artistName}\nCanción: ${songTitle}\nArchivo: ${selectedFile.name}\nTamaño: ${(selectedFile.size / 1024 / 1024).toFixed(2)} MB\n\n📁 Ruta real en B2:\n${result.Location}\n\n🆔 ID: ${songId}`
      );
      
      // Agregar canción a la biblioteca
      const newSong = {
        id: songId,
        title: songTitle,
        artist: artistName,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        uploadPath: fullPath,
        uploadDate: new Date().toLocaleString()
      };
      
      setSongs(prev => [newSong, ...prev]);
      
      // Limpiar formulario
      setShowUploadForm(false);
      setSongTitle('');
      setArtistName('');
      setSelectedFile(null);
      
    } catch (error) {
      console.error('❌ Error subiendo canción:', error);
      alert('No se pudo subir la canción');
    }
  };

  const tabs = [
    { id: 'upload', label: 'Subir a la nube', icon: Upload },
    { id: 'library', label: 'Biblioteca', icon: Music },
    { id: 'songs', label: 'Mis Canciones', icon: Music },
    { id: 'led-screen', label: 'Pantalla LED', icon: Monitor },
    { id: 'analytics', label: 'Estadísticas', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'upload':
        return <ZipUpload />;
      
      case 'library':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Mi Biblioteca</h2>
              <p className="text-dark-400">
                Todas las canciones que has subido. Úsalas en tu app móvil para crear setlists.
              </p>
            </div>
            <SongLibrary userId={user?.uid || ''} />
          </div>
        );
      
      case 'songs':
        return <NewSongsLibrary />;
      
      
      case 'led-screen':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Pantalla LED del Mixer</h2>
              <p className="text-dark-400">
                Sube y gestiona imágenes para mostrar en la pantalla LED del mixer durante las presentaciones.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LEDScreenUpload 
                onUploadComplete={() => {
                  console.log('LED image upload completed');
                }}
              />
              <LEDDisplay />
            </div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Estadísticas</h2>
              <p className="text-dark-400">
                Visualiza el uso de tu biblioteca de audio
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-600 p-3 rounded-lg">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-dark-400">Canciones totales</p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-3 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0 MB</p>
                    <p className="text-dark-400">Espacio usado</p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-3 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-dark-400">Setlists</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="border-b border-dark-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-400'
                      : 'border-transparent text-dark-400 hover:text-white hover:border-dark-600'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTÓN CENTRAL "YO SÍ SÉ" */}
        <div className="flex justify-center items-center py-12">
          <button
            onClick={() => setShowNewSongForm(true)}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-6 px-12 rounded-lg text-2xl shadow-lg transition-all duration-300 transform hover:scale-105"
          >
            🎵 YO SÍ SÉ 🎵
          </button>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">🎵 Subir Canción</h2>
              <button
                onClick={() => setShowUploadForm(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-white font-bold mb-2">Nombre del Artista:</label>
                <input
                  type="text"
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-white font-bold mb-2">Título de la Canción:</label>
                <input
                  type="text"
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="Ej: Mi Nueva Canción"
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-white font-bold mb-2">Archivo de Audio:</label>
                <input
                  type="file"
                  accept=".wav,.mp3,.m4a,.aac"
                  onChange={handleFileSelect}
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-primary-500 focus:outline-none"
                />
                {selectedFile && (
                  <p className="text-green-400 text-sm mt-2">
                    ✅ Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
              
              <button
                onClick={handleUploadSong}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                🚀 Subir a B2
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Song Upload Modal */}
      <NewSongUpload 
        isOpen={showNewSongForm}
        onClose={() => setShowNewSongForm(false)}
        onUploadComplete={(songData) => {
          // Agregar la nueva canción a la lista local
          setSongs(prev => [songData, ...prev]);
          console.log('Nueva canción agregada:', songData);
        }}
      />
    </div>
  );
};

export default Dashboard;
