/**
 * ZipUpload - Component for uploading ZIP files with multitrack songs
 * Similar to Looommunity workflow
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, Save, X, Edit3, FileArchive } from 'lucide-react';
import JSZip from 'jszip';
import realB2Service from '../services/realB2Service';
import firestoreService from '../services/firestoreService';

interface ZipUploadProps {
  userId: string;
  onUploadComplete?: () => void;
}

interface TrackFile {
  name: string;
  file: File;
  size: number;
  type: string;
}

interface SongMetadata {
  title: string;
  artist: string;
  tempo: number;
  key: string;
  timeSignature: string;
}

const ZipUpload: React.FC<ZipUploadProps> = ({ userId, onUploadComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tracks, setTracks] = useState<TrackFile[]>([]);
  const [songMetadata, setSongMetadata] = useState<SongMetadata>({
    title: '',
    artist: '',
    tempo: 120,
    key: 'C',
    timeSignature: '4/4'
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const zipFile = acceptedFiles.find(file => file.name.toLowerCase().endsWith('.zip'));
    if (!zipFile) {
      alert('Por favor selecciona un archivo ZIP');
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      
      const audioTracks: TrackFile[] = [];
      
      // Procesar cada archivo en el ZIP
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (!zipEntry.dir && isAudioFile(relativePath)) {
          const file = await zipEntry.async('blob');
          const trackFile = new File([file], relativePath, { type: getAudioMimeType(relativePath) });
          
          audioTracks.push({
            name: getTrackName(relativePath),
            file: trackFile,
            size: trackFile.size,
            type: trackFile.type
          });
        }
      }

      setTracks(audioTracks);
      
      // Auto-completar metadatos desde el nombre del ZIP
      const zipName = zipFile.name.replace('.zip', '');
      const parts = zipName.split(' - ');
      setSongMetadata(prev => ({
        ...prev,
        title: parts[1] || zipName,
        artist: parts[0] || 'Unknown'
      }));

    } catch (error) {
      console.error('Error processing ZIP:', error);
      alert('Error al procesar el archivo ZIP');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip']
    },
    multiple: false
  });

  const isAudioFile = (filename: string) => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const getAudioMimeType = (filename: string) => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/m4a',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };
    return mimeTypes[ext || ''] || 'audio/mpeg';
  };

  const getTrackName = (filename: string) => {
    // Extraer nombre del track sin la extensión y rutas
    const name = filename.split('/').pop() || filename;
    return name.replace(/\.[^/.]+$/, '');
  };

  const updateTrackName = (index: number, newName: string) => {
    setTracks(prev => prev.map((track, i) => 
      i === index ? { ...track, name: newName } : track
    ));
  };

  const removeTrack = (index: number) => {
    setTracks(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSong = async () => {
    if (tracks.length === 0 || !songMetadata.title || !songMetadata.artist) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    setIsUploading(true);
    try {
      // Subir cada track a B2
      const uploadedTracks = [];
      for (const track of tracks) {
        const downloadURL = await realB2Service.uploadAudioFile(track.file, userId);
        uploadedTracks.push({
          name: track.name,
          audioFile: downloadURL,
          size: track.size,
          type: track.type
        });
      }

      // Crear proyecto con todos los tracks
      const projectData = {
        name: songMetadata.title,
        description: `${songMetadata.artist} - ${songMetadata.title}`,
        ownerId: userId,
        tracks: uploadedTracks.map((track, index) => ({
          id: `track-${index}`,
          name: track.name,
          volume: 1,
          muted: false,
          solo: false,
          audioFile: track.audioFile,
          color: getRandomColor()
        })),
        bpm: songMetadata.tempo,
        key: songMetadata.key
      };

      // Guardar proyecto
      const projectId = await firestoreService.createProject(projectData);
      console.log('Project created:', projectId);

      // También guardar como canción en la biblioteca
      const songData = {
        title: songMetadata.title,
        artist: songMetadata.artist,
        key: songMetadata.key,
        bpm: songMetadata.tempo,
        timeSignature: songMetadata.timeSignature,
        audioFile: uploadedTracks[0]?.audioFile || '', // URL del primer track
        order: 0,
        duration: 0,
        fileSize: uploadedTracks.reduce((total, track) => total + track.size, 0),
        uploadDate: new Date(),
        ownerId: userId,
        projectId: projectId, // Referencia al proyecto
        tracks: uploadedTracks.map((track, index) => ({
          name: track.name,
          audioFile: track.audioFile,
          size: track.size
        }))
      };

      // Guardar en la biblioteca del usuario (colección songs)
      await firestoreService.addSongToLibrary(userId, songData);
      console.log('Song added to library:', songMetadata.title);

      // Limpiar formulario
      setTracks([]);
      setSongMetadata({
        title: '',
        artist: '',
        tempo: 120,
        key: 'C',
        timeSignature: '4/4'
      });

      if (onUploadComplete) {
        onUploadComplete();
      }

      alert('¡Canción multitrack subida exitosamente!');

    } catch (error) {
      console.error('Error uploading song:', error);
      alert('Error al subir la canción');
    } finally {
      setIsUploading(false);
    }
  };

  const getRandomColor = () => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          ${isProcessing || isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary-600 p-4 rounded-full">
              <FileArchive className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {isProcessing ? 'Procesando ZIP...' : 
               isDragActive ? 'Suelta el archivo ZIP aquí' : 'Sube un archivo ZIP con tracks'}
            </h3>
            <p className="text-dark-400 mb-4">
              Arrastra y suelta un archivo ZIP aquí, o haz clic para seleccionar
            </p>
            <p className="text-sm text-dark-500">
              El ZIP debe contener archivos de audio (MP3, WAV, M4A, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Song Metadata Form */}
      {tracks.length > 0 && (
        <div className="card">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Music className="h-5 w-5 mr-2" />
            Información de la Canción
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-2">Título *</label>
              <input
                type="text"
                value={songMetadata.title}
                onChange={(e) => setSongMetadata(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
                placeholder="Nombre de la canción"
              />
            </div>
            
            <div>
              <label className="block text-sm text-dark-400 mb-2">Artista *</label>
              <input
                type="text"
                value={songMetadata.artist}
                onChange={(e) => setSongMetadata(prev => ({ ...prev, artist: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
                placeholder="Nombre del artista"
              />
            </div>
            
            <div>
              <label className="block text-sm text-dark-400 mb-2">Tempo (BPM)</label>
              <input
                type="number"
                value={songMetadata.tempo}
                onChange={(e) => setSongMetadata(prev => ({ ...prev, tempo: parseInt(e.target.value) || 120 }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
                min="60"
                max="200"
              />
            </div>
            
            <div>
              <label className="block text-sm text-dark-400 mb-2">Tonalidad</label>
              <select
                value={songMetadata.key}
                onChange={(e) => setSongMetadata(prev => ({ ...prev, key: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
              >
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-dark-400 mb-2">Compás</label>
              <select
                value={songMetadata.timeSignature}
                onChange={(e) => setSongMetadata(prev => ({ ...prev, timeSignature: e.target.value }))}
                className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="2/4">2/4</option>
                <option value="6/8">6/8</option>
                <option value="12/8">12/8</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tracks List */}
      {tracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Tracks ({tracks.length})
            </h4>
            <button
              onClick={uploadSong}
              disabled={isUploading || !songMetadata.title || !songMetadata.artist}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors font-medium"
            >
              <Save className="h-4 w-4" />
              <span>{isUploading ? 'Subiendo...' : 'Subir Canción'}</span>
            </button>
          </div>

          <div className="space-y-2">
            {tracks.map((track, index) => (
              <div key={index} className="card">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{index + 1}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => updateTrackName(index, e.target.value)}
                      className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded text-white focus:outline-none focus:border-primary-500"
                      placeholder="Nombre del track"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-dark-400">
                    <span>{track.type}</span>
                    <span>{formatFileSize(track.size)}</span>
                  </div>
                  
                  <button
                    onClick={() => removeTrack(index)}
                    className="text-dark-400 hover:text-red-400 p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZipUpload;