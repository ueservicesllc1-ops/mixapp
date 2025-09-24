/**
 * AudioLibraryUpload - Component for uploading individual songs to user's library
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Save, X, Edit3 } from 'lucide-react';
import realB2Service from '../services/realB2Service';
import firestoreService from '../services/firestoreService';

interface AudioLibraryUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

interface TrackData {
  file: File;
  title: string;
  artist: string;
  tempo: number;
  key: string;
  timeSignature: string;
  isEditing: boolean;
}

const AudioLibraryUpload: React.FC<AudioLibraryUploadProps> = ({ userId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [tracks, setTracks] = useState<TrackData[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const audioFiles = acceptedFiles.filter(file => 
      file.type.startsWith('audio/') || 
      ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      )
    );

    const newTracks: TrackData[] = audioFiles.map(file => {
      const trackInfo = extractTrackInfo(file.name);
      return {
        file,
        title: trackInfo.title,
        artist: trackInfo.artist,
        tempo: trackInfo.tempo,
        key: trackInfo.key,
        timeSignature: trackInfo.timeSignature,
        isEditing: false
      };
    });

    setTracks(prev => [...prev, ...newTracks]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']
    },
    multiple: true
  });

  const extractTrackInfo = (filename: string) => {
    // Extraer información del nombre del archivo
    // Ejemplo: "Artist - Song Title - 120BPM - C - 4-4.mp3"
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split(' - ');
    
    return {
      title: parts[1] || nameWithoutExt,
      artist: parts[0] || 'Unknown',
      tempo: parseInt(parts[2]?.replace(/[^\d]/g, '') || '120'),
      key: parts[3] || 'C',
      timeSignature: parts[4] || '4/4'
    };
  };

  const updateTrack = (index: number, updates: Partial<TrackData>) => {
    setTracks(prev => prev.map((track, i) => 
      i === index ? { ...track, ...updates } : track
    ));
  };

  const toggleEdit = (index: number) => {
    updateTrack(index, { isEditing: !tracks[index].isEditing });
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const uploadTracks = async () => {
    if (tracks.length === 0) return;

    setIsUploading(true);
    try {
      for (const track of tracks) {
        // Subir archivo a B2
        const downloadURL = await realB2Service.uploadAudioFile(track.file, userId);
        
        // Crear registro en la biblioteca del usuario (colección songs)
        const songData = {
          title: track.title,
          artist: track.artist,
          key: track.key,
          bpm: track.tempo,
          timeSignature: track.timeSignature,
          audioFile: downloadURL,
          order: 0,
          duration: 0, // Se puede calcular después
          fileSize: track.file.size,
          uploadDate: new Date(),
          ownerId: userId
        };

        // Guardar en la colección 'songs' (biblioteca global del usuario)
        await firestoreService.addSongToLibrary(userId, songData);
        console.log('Song added to library:', track.title);
      }

      // Limpiar tracks
      setTracks([]);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
      
    } catch (error) {
      console.error('Error uploading tracks:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-dark-600 hover:border-primary-500 hover:bg-primary-500/5'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-4 rounded-full">
              <Upload className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isDragActive ? 'Suelta los archivos aquí' : 'Sube canciones a tu biblioteca'}
            </h3>
            <p className="text-dark-400 mb-4">
              Arrastra y suelta archivos de audio aquí, o haz clic para seleccionar
            </p>
            <p className="text-sm text-dark-500">
              Formatos soportados: MP3, WAV, M4A, AAC, OGG, FLAC (máx. 100MB por archivo)
            </p>
          </div>
        </div>
      </div>

      {/* Tracks to Upload */}
      {tracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Canciones a Subir ({tracks.length})
            </h4>
            <button
              onClick={uploadTracks}
              disabled={isUploading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isUploading ? 'Subiendo...' : 'Subir a Biblioteca'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {tracks.map((track, index) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Music className="h-5 w-5 text-primary-400" />
                    <div>
                      <p className="text-white font-medium">{track.file.name}</p>
                      <p className="text-sm text-dark-400">
                        {(track.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleEdit(index)}
                      className="text-dark-400 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeTrack(index)}
                      className="text-dark-400 hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {track.isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Título</label>
                      <input
                        type="text"
                        value={track.title}
                        onChange={(e) => updateTrack(index, { title: e.target.value })}
                        className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Artista</label>
                      <input
                        type="text"
                        value={track.artist}
                        onChange={(e) => updateTrack(index, { artist: e.target.value })}
                        className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Tempo (BPM)</label>
                      <input
                        type="number"
                        value={track.tempo}
                        onChange={(e) => updateTrack(index, { tempo: parseInt(e.target.value) || 120 })}
                        className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Nota</label>
                      <input
                        type="text"
                        value={track.key}
                        onChange={(e) => updateTrack(index, { key: e.target.value })}
                        className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Compás</label>
                      <input
                        type="text"
                        value={track.timeSignature}
                        onChange={(e) => updateTrack(index, { timeSignature: e.target.value })}
                        className="w-full px-2 py-1 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-dark-400">Título:</span>
                      <p className="text-white">{track.title}</p>
                    </div>
                    <div>
                      <span className="text-dark-400">Artista:</span>
                      <p className="text-white">{track.artist}</p>
                    </div>
                    <div>
                      <span className="text-dark-400">Tempo:</span>
                      <p className="text-white">{track.tempo} BPM</p>
                    </div>
                    <div>
                      <span className="text-dark-400">Nota:</span>
                      <p className="text-white">{track.key}</p>
                    </div>
                    <div>
                      <span className="text-dark-400">Compás:</span>
                      <p className="text-white">{track.timeSignature}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioLibraryUpload;
