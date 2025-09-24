/**
 * SongLibrary - Component for displaying uploaded songs
 */

import React, { useState, useEffect } from 'react';
import { Music, Play, Pause, Download, Trash2, Edit3 } from 'lucide-react';
import firestoreService from '../services/firestoreService';
import { Song, Setlist } from '../types';

interface SongLibraryProps {
  userId: string;
}

const SongLibrary: React.FC<SongLibraryProps> = ({ userId }) => {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<string>('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingSong, setPlayingSong] = useState<string | null>(null);

  useEffect(() => {
    loadSetlists();
  }, [userId]);

  useEffect(() => {
    if (selectedSetlist) {
      loadSongs(selectedSetlist);
    }
  }, [selectedSetlist]);

  const loadSetlists = async () => {
    try {
      setLoading(true);
      const userSetlists = await firestoreService.getUserSetlists(userId);
      setSetlists(userSetlists);
      
      if (userSetlists.length > 0 && !selectedSetlist) {
        setSelectedSetlist(userSetlists[0].id);
      }
    } catch (error) {
      console.error('Error loading setlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSongs = async (setlistId: string) => {
    try {
      const setlistSongs = await firestoreService.getSetlistSongs(setlistId);
      setSongs(setlistSongs);
    } catch (error) {
      console.error('Error loading songs:', error);
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
        if (selectedSetlist) {
          loadSongs(selectedSetlist);
        }
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
      {/* Setlist Selector */}
      <div>
        <label htmlFor="setlist" className="block text-sm font-medium text-dark-300 mb-2">
          Seleccionar Setlist
        </label>
        <select
          id="setlist"
          value={selectedSetlist}
          onChange={(e) => setSelectedSetlist(e.target.value)}
          className="input-field w-full"
        >
          {setlists.map((setlist) => (
            <option key={setlist.id} value={setlist.id}>
              {setlist.name}
            </option>
          ))}
        </select>
      </div>

      {/* Songs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Music className="h-5 w-5 mr-2" />
            Canciones ({songs.length})
          </h3>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400">No hay canciones en este setlist</p>
            <p className="text-sm text-dark-500 mt-2">
              Sube algunas canciones para comenzar
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
    </div>
  );
};

export default SongLibrary;
