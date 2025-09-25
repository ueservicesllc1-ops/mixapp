/**
 * SongLibrary - Component for displaying user's song library
 */

import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Download, Trash2, Edit3, RefreshCw } from 'lucide-react';
import firestoreService from '../services/firestoreService';
import { Song } from '../types';

interface SongLibraryProps {
  userId: string;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ userId }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSong, setPlayingSong] = useState<string | null>(null);

  useEffect(() => {
    loadUserLibrary();
  }, [userId]);

  const loadUserLibrary = async () => {
    try {
      setLoading(true);
      console.log('Loading library for user:', userId);
      const userSongs = await firestoreService.getUserLibrary(userId);
      console.log('Retrieved songs:', userSongs);
      setSongs(userSongs);
    } catch (error) {
      console.error('Error loading user library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPause = (songId: string) => {
    if (playingSong === songId) {
      setPlayingSong(null);
    } else {
      setPlayingSong(songId);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta canción?')) {
      try {
        // Note: You'll need to implement deleteSong in firestoreService
        // await firestoreService.deleteSong(songId);
        console.log('Delete song:', songId);
        // Reload songs after deletion
        loadUserLibrary();
      } catch (error) {
        console.error('Error deleting song:', error);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-dark-400">Cargando biblioteca...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Library Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Music className="h-5 w-5 mr-2" />
          Mi Biblioteca ({songs.length} canciones)
        </h3>
        <button
          onClick={loadUserLibrary}
          disabled={loading}
          className="bg-dark-600 hover:bg-dark-500 disabled:bg-dark-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Cargando...' : 'Actualizar'}</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 text-dark-600 mx-auto mb-4 animate-spin" />
          <p className="text-dark-400">Cargando biblioteca...</p>
        </div>
      ) : songs.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-12 w-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Tu biblioteca está vacía</p>
          <p className="text-sm text-dark-500 mt-2">
            Sube algunas canciones para comenzar a crear tu biblioteca
          </p>
        </div>
      ) : (
          <div className="space-y-2">
            {songs.map((song) => (
              <div key={song.id} className="card hover:bg-dark-700 transition-colors duration-200">
                <div className="flex items-center space-x-4">
                  {/* Play/Pause Button */}
                  <button
                    onClick={() => handlePlayPause(song.id)}
                    className="flex-shrink-0 w-10 h-10 bg-primary-600 hover:bg-primary-700 rounded-full flex items-center justify-center transition-colors duration-200"
                  >
                    {playingSong === song.id ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 text-white ml-1" />
                    )}
                  </button>

                  {/* Song Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">{song.title}</h4>
                    <p className="text-dark-400 text-sm">{song.artist}</p>
                    <div className="flex items-center space-x-4 text-xs text-dark-500 mt-1">
                      <span>{song.bpm} BPM</span>
                      <span>Key: {song.key}</span>
                      {song.timeSignature && <span>{song.timeSignature}</span>}
                      {song.duration && <span>{formatDuration(song.duration)}</span>}
                      {song.fileSize && <span>{formatFileSize(song.fileSize)}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {song.audioFile && (
                      <a
                        href={song.audioFile}
                        download
                        className="p-2 text-dark-400 hover:text-white transition-colors duration-200"
                        title="Descargar"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteSong(song.id)}
                      className="p-2 text-dark-400 hover:text-red-400 transition-colors duration-200"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
};

export default SongLibrary;
