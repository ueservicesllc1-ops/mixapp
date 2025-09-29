/**
 * NewSongsLibrary - Componente para mostrar las canciones de la colección "newsongs"
 */

import React, { useState, useEffect } from 'react';
import { Music, Download, Play, Trash2, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import firestoreService from '../services/firestoreService';

interface NewSong {
  id: string;
  title: string;
  artist: string;
  fileName: string;
  fileSize: number;
  b2Url: string;
  uploadDate: any;
  downloads: number;
  ownerId: string;
  folder: string;
  isPublic: boolean;
  status: string;
}

interface Multitrack {
  id: string;
  songName: string;
  artist: string;
  tempo: number;
  key: string;
  timeSignature: string;
  tracks: Array<{
    name: string;
    originalName: string;
    downloadUrl: string;
    fileSize: number;
  }>;
  folderPath: string;
  ownerId: string;
  createdAt: any;
  type: string;
}

const NewSongsLibrary: React.FC = () => {
  const { user } = useAuth();
  const [newSongs, setNewSongs] = useState<NewSong[]>([]);
  const [multitracks, setMultitracks] = useState<Multitrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadUserMultitracks();
    }
  }, [user?.uid]);

  const loadUserNewSongs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const songs = await firestoreService.getUserNewSongs(user!.uid);
      setNewSongs(songs);
      
      console.log('Canciones nuevas cargadas:', songs);
    } catch (err) {
      console.error('Error cargando canciones nuevas:', err);
      setError('Error al cargar las canciones');
    } finally {
      setLoading(false);
    }
  };

  const loadUserMultitracks = async () => {
    try {
      const multitracks = await firestoreService.getUserMultitracks(user!.uid);
      setMultitracks(multitracks);
      
      console.log('Multitracks cargados:', multitracks);
    } catch (err) {
      console.error('Error cargando multitracks:', err);
    }
  };

  const handleDownload = async (song: NewSong) => {
    try {
      // Incrementar contador de descargas
      await firestoreService.incrementNewSongDownloads(song.id);
      
      // Abrir URL de descarga en nueva pestaña
      window.open(song.b2Url, '_blank');
      
      // Actualizar contador local
      setNewSongs(prev => prev.map(s => 
        s.id === song.id 
          ? { ...s, downloads: s.downloads + 1, lastPlayed: new Date() }
          : s
      ));
      
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar la canción');
    }
  };

  const handleDelete = async (song: NewSong) => {
    const confirmDelete = window.confirm(
      `¿Eliminar "${song.title}" de la colección de nuevas canciones?\n\nEsto eliminará el registro de Firestore pero NO el archivo de B2.`
    );
    
    if (confirmDelete) {
      try {
        await firestoreService.deleteNewSong(song.id);
        setNewSongs(prev => prev.filter(s => s.id !== song.id));
        alert('Canción eliminada de la biblioteca');
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la canción');
      }
    }
  };

  const handleDeleteMultitrack = async (multitrack: Multitrack) => {
    const confirmDelete = window.confirm(
      `¿Eliminar el multitrack "${multitrack.songName}"?\n\nEsto eliminará el registro de Firestore pero NO los archivos de B2.`
    );
    
    if (confirmDelete) {
      try {
        await firestoreService.deleteMultitrack(multitrack.id);
        setMultitracks(prev => prev.filter(m => m.id !== multitrack.id));
        alert('Multitrack eliminado de la biblioteca');
      } catch (error) {
        console.error('Error al eliminar multitrack:', error);
        alert('Error al eliminar el multitrack');
      }
    }
  };

  const handleDownloadMultitrack = async (multitrack: Multitrack) => {
    try {
      // Descargar todos los tracks del multitrack
      multitrack.tracks.forEach((track, index) => {
        setTimeout(() => {
          window.open(track.downloadUrl, '_blank');
        }, index * 500); // Descargar con 500ms de diferencia
      });
    } catch (error) {
      console.error('Error al descargar multitrack:', error);
      alert('Error al descargar el multitrack');
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const formatDate = (date: any) => {
    if (!date) return 'Fecha no disponible';
    
    try {
      if (date.toDate) {
        return date.toDate().toLocaleString();
      } else if (date instanceof Date) {
        return date.toLocaleString();
      } else {
        return new Date(date).toLocaleString();
      }
    } catch (error) {
      return 'Fecha no válida';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando canciones nuevas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">❌ {error}</div>
        <button 
          onClick={loadUserNewSongs}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (multitracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎛️</div>
        <h3 className="text-xl font-bold text-white mb-2">No hay multitracks</h3>
        <p className="text-dark-400 mb-4">Sube tu primer multitrack usando el botón "Subir a la nube"</p>
        <div className="text-sm text-gray-500">
          Los multitracks se guardan en la colección "multitracks" de Firestore
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">🎛️ Mis Multitracks</h3>
          <p className="text-dark-400">Colección "multitracks" de Firestore</p>
        </div>
        <button 
          onClick={loadUserMultitracks}
          className="text-primary-400 hover:text-primary-300 text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {multitracks.map((multitrack) => (
              <div key={multitrack.id} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary-600 p-2 rounded-lg">
                      <Music className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white">{multitrack.songName}</h4>
                      <p className="text-sm text-gray-400">{multitrack.artist}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownloadMultitrack(multitrack)}
                      className="p-2 bg-green-600 hover:bg-green-700 rounded-lg text-white"
                      title="Descargar todos los tracks"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMultitrack(multitrack)}
                      className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
                      title="Eliminar multitrack"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tempo:</span>
                    <span className="text-white">{multitrack.tempo} BPM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tono:</span>
                    <span className="text-white">{multitrack.key}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Compás:</span>
                    <span className="text-white">{multitrack.timeSignature}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Tracks:</span>
                    <span className="text-white">{multitrack.tracks.length}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-semibold text-gray-300 mb-2">Tracks:</h5>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {multitrack.tracks.map((track, index) => (
                      <div key={index} className="text-xs text-gray-400 bg-dark-700 p-2 rounded">
                        {index + 1}. {track.name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-dark-600">
                  <p className="text-xs text-gray-500">
                    🆔 Firestore ID: {multitrack.id}
                  </p>
                  <p className="text-xs text-gray-500">
                    📁 Carpeta: {multitrack.folderPath}
                  </p>
                </div>
              </div>
        ))}
      </div>
    </div>
  );
};

export default NewSongsLibrary;

