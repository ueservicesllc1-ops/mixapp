/**
 * ZipUpload - Componente para subir y procesar archivos ZIP con tracks de audio
 */

import React, { useState } from 'react';
import { Upload, Music, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import realB2Service from '../services/realB2Service';
import firestoreService from '../services/firestoreService';
import JSZip from 'jszip';

interface Track {
  name: string;
  file: File;
  editedName: string;
}

interface MultitrackData {
  songName: string;
  artist: string;
  tempo: number;
  key: string;
  timeSignature: string;
  tracks: Track[];
}

const ZipUpload: React.FC = () => {
  const { user } = useAuth();
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [multitrackData, setMultitrackData] = useState<MultitrackData>({
    songName: '',
    artist: '',
    tempo: 120,
    key: 'C',
    timeSignature: '4/4',
    tracks: []
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleZipUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Por favor selecciona un archivo ZIP válido');
      return;
    }

    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const audioFiles: Track[] = [];
      const audioExtensions = ['.wav', '.mp3', '.aiff', '.flac', '.m4a'];

      for (const [filename, zipEntry] of Object.entries(zipContent.files)) {
        if (!zipEntry.dir && audioExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
          const blob = await zipEntry.async('blob');
          const file = new File([blob], filename, { type: 'audio/wav' });
          
          audioFiles.push({
            name: filename,
            file: file,
            editedName: filename.replace(/\.[^/.]+$/, '') // Remover extensión
          });
        }
      }

      setTracks(audioFiles);
      setMultitrackData(prev => ({
        ...prev,
        tracks: audioFiles
      }));
      
      console.log(`Se encontraron ${audioFiles.length} archivos de audio en el ZIP`);
    } catch (error) {
      console.error('Error procesando ZIP:', error);
      alert('Error al procesar el archivo ZIP');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateTrackName = (index: number, newName: string) => {
    const updatedTracks = [...tracks];
    updatedTracks[index].editedName = newName;
    setTracks(updatedTracks);
    
    setMultitrackData(prev => ({
      ...prev,
      tracks: updatedTracks
    }));
  };

  const handleSave = async () => {
    if (!user?.uid) {
      alert('Debes estar autenticado para subir');
      return;
    }

    if (!multitrackData.songName || !multitrackData.artist || tracks.length === 0) {
      alert('Por favor completa todos los campos y asegúrate de tener tracks');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Crear carpeta en B2 para el multitrack
      const folderName = `multitracks/${user.uid}/${Date.now()}_${multitrackData.songName.replace(/[^a-zA-Z0-9]/g, '_')}`;
      
      const uploadedTracks = [];
      const totalTracks = tracks.length;

      // Subir cada track
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        const trackPath = `${folderName}/${track.editedName}.wav`;
        
        console.log(`Subiendo track ${i + 1}/${totalTracks}: ${track.editedName}`);
        
        const downloadUrl = await realB2Service.uploadAudioFile(track.file, trackPath);
        
        uploadedTracks.push({
          name: track.editedName,
          originalName: track.name,
          downloadUrl: downloadUrl,
          fileSize: track.file.size
        });

        setUploadProgress(((i + 1) / totalTracks) * 100);
      }

      // Guardar en Firestore como multitrack
      const multitrackDataToSave = {
        songName: multitrackData.songName,
        artist: multitrackData.artist,
        tempo: multitrackData.tempo,
        key: multitrackData.key,
        timeSignature: multitrackData.timeSignature,
        tracks: uploadedTracks,
        folderPath: folderName,
        ownerId: user.uid,
        createdAt: new Date(),
        type: 'multitrack'
      };

      await firestoreService.addMultitrack(multitrackDataToSave);
      
      console.log('Multitrack guardado exitosamente');
      alert('Multitrack subido exitosamente a la nube');
      
      // Reset form
      setTracks([]);
      setMultitrackData({
        songName: '',
        artist: '',
        tempo: 120,
        key: 'C',
        timeSignature: '4/4',
        tracks: []
      });
      setZipFile(null);
      
    } catch (error) {
      console.error('Error subiendo multitrack:', error);
      alert('Error al subir el multitrack');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Subir a la nube</h2>
        <p className="text-dark-400 mb-8">
          Sube un archivo ZIP que contenga todos los archivos de audio de tu proyecto
        </p>
        
        {/* Zona de subida de ZIP */}
        {!zipFile && (
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 bg-gray-800/50 hover:bg-gray-800/70 transition-colors">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Arrastra tu archivo ZIP aquí
              </h3>
              <p className="text-gray-400 mb-4">
                O haz clic para seleccionar un archivo
              </p>
              <input
                type="file"
                accept=".zip"
                className="hidden"
                id="zip-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setZipFile(file);
                    handleZipUpload(file);
                  }
                }}
              />
              <label
                htmlFor="zip-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                Seleccionar archivo ZIP
              </label>
            </div>
          </div>
        )}

        {/* Procesando ZIP */}
        {isProcessing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Procesando archivo ZIP...</p>
          </div>
        )}

        {/* Formulario de multitrack */}
        {tracks.length > 0 && !isProcessing && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Información del Proyecto</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre de la Canción
                  </label>
                  <input
                    type="text"
                    value={multitrackData.songName}
                    onChange={(e) => setMultitrackData(prev => ({ ...prev, songName: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de la canción"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Artista
                  </label>
                  <input
                    type="text"
                    value={multitrackData.artist}
                    onChange={(e) => setMultitrackData(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre del artista"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tempo (BPM)
                  </label>
                  <input
                    type="number"
                    value={multitrackData.tempo}
                    onChange={(e) => setMultitrackData(prev => ({ ...prev, tempo: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tono
                  </label>
                  <select
                    value={multitrackData.key}
                    onChange={(e) => setMultitrackData(prev => ({ ...prev, key: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Compás
                  </label>
                  <select
                    value={multitrackData.timeSignature}
                    onChange={(e) => setMultitrackData(prev => ({ ...prev, timeSignature: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Lista de tracks */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-4">Tracks de Audio ({tracks.length})</h3>
              <div className="space-y-3">
                {tracks.map((track, index) => (
                  <div key={index} className="flex items-center space-x-4 bg-gray-700 p-3 rounded-md">
                    <Music className="h-5 w-5 text-blue-400" />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={track.editedName}
                        onChange={(e) => updateTrackName(index, e.target.value)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nombre del track"
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      {(track.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setTracks([]);
                  setMultitrackData({
                    songName: '',
                    artist: '',
                    tempo: 120,
                    key: 'C',
                    timeSignature: '4/4',
                    tracks: []
                  });
                  setZipFile(null);
                }}
                className="flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isUploading}
                className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo... {uploadProgress.toFixed(0)}%
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Subir a la Nube
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ZipUpload;