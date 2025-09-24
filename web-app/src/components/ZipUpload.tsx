/**
 * ZipUpload - Component for uploading and processing ZIP files
 */

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileArchive, Music, Save, X, Edit3 } from 'lucide-react';
import JSZip from 'jszip';
import realB2Service from '../services/realB2Service';
import firestoreService from '../services/firestoreService';

interface ZipUploadProps {
  userId: string;
  setlistId: string;
  onUploadComplete?: () => void;
}

interface ExtractedTrack {
  file: File;
  name: string;
  artist: string;
  tempo: number;
  key: string;
  timeSignature: string;
  isEditing: boolean;
}

const ZipUpload: React.FC<ZipUploadProps> = ({ userId, setlistId, onUploadComplete }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [extractedTracks, setExtractedTracks] = useState<ExtractedTrack[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const zipFile = acceptedFiles.find(file => file.name.endsWith('.zip'));
    if (!zipFile) return;

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      
      const audioFiles: ExtractedTrack[] = [];
      
      // Procesar cada archivo en el ZIP
      for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
        if (!(zipEntry as any).dir && isAudioFile(relativePath)) {
          const fileData = await (zipEntry as any).async('blob');
          const file = new File([fileData], (zipEntry as any).name, { type: getMimeType(relativePath) });
          
          // Extraer metadatos del nombre del archivo
          const trackInfo = extractTrackInfo((zipEntry as any).name);
          
          audioFiles.push({
            file,
            name: trackInfo.name,
            artist: trackInfo.artist,
            tempo: trackInfo.tempo,
            key: trackInfo.key,
            timeSignature: trackInfo.timeSignature,
            isEditing: false
          });
        }
      }
      
      setExtractedTracks(audioFiles);
      console.log('Extracted tracks:', audioFiles);
      
    } catch (error) {
      console.error('Error processing ZIP:', error);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip']
    },
    multiple: false
  });

  const isAudioFile = (filename: string): boolean => {
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  };

  const getMimeType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes: { [key: string]: string } = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };
    return mimeTypes[ext || ''] || 'audio/mpeg';
  };

  const extractTrackInfo = (filename: string) => {
    // Extraer información del nombre del archivo
    // Ejemplo: "Artist - Song Name - 120BPM - C - 4-4.mp3"
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split(' - ');
    
    return {
      name: parts[1] || nameWithoutExt,
      artist: parts[0] || 'Unknown',
      tempo: parseInt(parts[2]?.replace(/[^\d]/g, '') || '120'),
      key: parts[3] || 'C',
      timeSignature: parts[4] || '4/4'
    };
  };

  const updateTrack = (index: number, updates: Partial<ExtractedTrack>) => {
    setExtractedTracks(prev => prev.map((track, i) => 
      i === index ? { ...track, ...updates } : track
    ));
  };

  const toggleEdit = (index: number) => {
    updateTrack(index, { isEditing: !extractedTracks[index].isEditing });
  };

  const uploadTracks = async () => {
    if (extractedTracks.length === 0) return;

    setIsUploading(true);
    try {
      for (const track of extractedTracks) {
        // Subir archivo a B2
        const downloadURL = await realB2Service.uploadAudioFile(track.file, userId);
        
        // Crear registro en Firestore
        const songData = {
          title: track.name,
          artist: track.artist,
          key: track.key,
          bpm: track.tempo,
          timeSignature: track.timeSignature,
          audioFile: downloadURL,
          order: 0,
          duration: 0, // Se puede calcular después
          fileSize: track.file.size,
          uploadDate: new Date()
        };

        await firestoreService.addSongToSetlist(setlistId, songData);
        console.log('Track uploaded:', track.name);
      }

      // Limpiar tracks
      setExtractedTracks([]);
      
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
          ${isProcessing ? 'pointer-events-none opacity-50' : ''}
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
              {isProcessing ? 'Procesando ZIP...' : 'Sube tu archivo ZIP'}
            </h3>
            <p className="text-dark-400 mb-4">
              Arrastra y suelta un archivo ZIP con canciones, o haz clic para seleccionar
            </p>
            <p className="text-sm text-dark-500">
              Formatos soportados: MP3, WAV, M4A, AAC, OGG, FLAC
            </p>
          </div>
        </div>
      </div>

      {/* Extracted Tracks */}
      {extractedTracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Music className="h-5 w-5 mr-2" />
              Canciones Extraídas ({extractedTracks.length})
            </h4>
            <button
              onClick={uploadTracks}
              disabled={isUploading}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-dark-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{isUploading ? 'Subiendo...' : 'Guardar Todas'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {extractedTracks.map((track, index) => (
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
                  <button
                    onClick={() => toggleEdit(index)}
                    className="text-dark-400 hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>

                {track.isEditing ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-xs text-dark-400 mb-1">Nombre</label>
                      <input
                        type="text"
                        value={track.name}
                        onChange={(e) => updateTrack(index, { name: e.target.value })}
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
                      <span className="text-dark-400">Nombre:</span>
                      <p className="text-white">{track.name}</p>
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

export default ZipUpload;
