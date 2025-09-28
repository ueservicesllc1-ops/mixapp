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

const NewSongsLibrary: React.FC = () => {
  const { user } = useAuth();
  const [newSongs, setNewSongs] = useState<NewSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      loadUserNewSongs();
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

  if (newSongs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <h3 className="text-xl font-bold text-white mb-2">No hay canciones nuevas</h3>
        <p className="text-dark-400 mb-4">Sube tu primera canción usando el botón "YO SÍ SÉ"</p>
        <div className="text-sm text-gray-500">
          Las canciones nuevas se guardan en la colección "newsongs" de Firestore
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">🎵 Mis Canciones Nuevas</h3>
          <p className="text-dark-400">Colección "newsongs" de Firestore</p>
        </div>
        <button 
          onClick={loadUserNewSongs}
          className="text-primary-400 hover:text-primary-300 text-sm"
        >
          🔄 Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {newSongs.map((song) => (
          <div key={song.id} className="bg-dark-800 rounded-lg p-6 border border-dark-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-lg font-bold text-white">{song.title}</h4>
                  <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    NEW
                  </span>
                </div>
                <p className="text-primary-400 font-medium">{song.artist}</p>
              </div>
              <div className="text-2xl">🎵</div>
            </div>
            
            <div className="space-y-2 text-sm text-dark-400 mb-4">
              <p><span className="font-medium">Archivo:</span> {song.fileName}</p>
              <p><span className="font-medium">Tamaño:</span> {formatFileSize(song.fileSize)}</p>
              <p><span className="font-medium">Subido:</span> {formatDate(song.uploadDate)}</p>
              <p><span className="font-medium">Descargas:</span> {song.downloads}</p>
              <p><span className="font-medium text-green-400">📂 Carpeta:</span> <span className="text-green-400">{song.folder}</span></p>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={() => handleDownload(song)}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Descargar</span>
              </button>
              
              <button 
                onClick={() => navigator.clipboard.writeText(song.b2Url)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Copiar URL B2</span>
              </button>
              
              <button 
                onClick={() => handleDelete(song)}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Eliminar</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-dark-600">
              <p className="text-xs text-gray-500">
                🆔 Firestore ID: {song.id}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewSongsLibrary;

