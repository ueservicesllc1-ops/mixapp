/**
 * MainScreen - Professional DAW Interface
 * 
 * @format
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Image,
  Modal,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import Sound from 'react-native-sound';
import { SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useAuth } from '../components/AuthProvider';
import firestoreService from '../services/firestoreService';
import SimpleOfflineService from '../services/simpleOfflineService';
import LEDScreenUpload from '../components/LEDScreenUpload';
import LEDDisplay from '../components/LEDDisplay';

const { width, height } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('02:03');
  const [totalTime, setTotalTime] = useState('04:00');
  const [bpm, setBpm] = useState(128);
  const [key, setKey] = useState('C');
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [showLibraryDrawer, setShowLibraryDrawer] = useState(false);
  const [showMySetlistDrawer, setShowMySetlistDrawer] = useState(false);
  const [showAudioPopup, setShowAudioPopup] = useState(false);
  const [showMySetlistPopup, setShowMySetlistPopup] = useState(false);
  const [setlistName, setSetlistName] = useState('');
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);

  const { user, signOut } = useAuth();

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  // Función para descargar todos los archivos de la carpeta de una canción
  const downloadSongFolder = async (song: any, baseUrl: string, customTimestamp?: number) => {
    console.log('📁 DESCARGANDO CARPETA COMPLETA:', song.title);
    console.log('🔍 FUNCIÓN downloadSongFolder INICIADA');
    
    try {
      // Extraer songId de la URL original
      let songId = song.projectId || 'unknown';
      if (baseUrl.includes('/mixercur/audio/')) {
        const urlParts = baseUrl.split('/mixercur/audio/')[1];
        if (urlParts) {
          const extractedSongId = urlParts.split('/')[0];
          if (extractedSongId && extractedSongId !== 'unknown') {
            songId = extractedSongId;
            console.log(`🔧 SongId extraído de URL: ${songId}`);
          }
        }
      }
      
      console.log(`📥 Descargando todos los archivos de la carpeta: ${songId}`);
      addDebugLog(`📥 Iniciando descarga de carpeta completa: ${songId}`);
      addDebugLog(`🔗 URL base: ${baseUrl}`);
      
      // Descargar todos los archivos de la carpeta de la canción
      const folderUrl = `http://192.168.1.173:3001/api/proxy/mixercur/audio/${songId}/`;
      console.log(`📁 Descargando desde carpeta: ${folderUrl}`);
      addDebugLog(`📁 Carpeta de descarga: ${folderUrl}`);
      
      // Lista de archivos conocidos en la carpeta
      const knownFiles = [
        '1759028995216_Click.wav',
        '1759029000243_Flauta.wav', 
        '1759029002556_Guía.wav',
        '1759029004626_Horns.wav'
      ];
      
      let downloadedFiles = 0;
      
      // Descargar cada archivo conocido
      for (const fileName of knownFiles) {
        try {
          const fileUrl = `${folderUrl}${fileName}`;
          const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download/MixerCurseDownloads`;
          const songFolderName = `${song.title || 'Unknown'}_${customTimestamp || Date.now()}`.replace(/[^a-zA-Z0-9]/g, '_');
          const songFolderPath = `${downloadsPath}/${songFolderName}`;
          const filePath = `${songFolderPath}/${fileName}`;
          
          console.log(`📥 Descargando archivo: ${fileName}`);
          console.log(`🔗 URL: ${fileUrl}`);
          console.log(`📁 Guardando en: ${filePath}`);
          addDebugLog(`📥 Descargando: ${fileName}`);
          
          setDownloadingFile(`Descargando ${fileName}...`);
          
          // Verificar si el archivo existe antes de descargarlo
          try {
            const headResponse = await fetch(fileUrl, { method: 'HEAD' });
            if (!headResponse.ok) {
              console.log(`⚠️ Archivo ${fileName} no disponible`);
              continue;
            }
            console.log(`✅ Archivo ${fileName} disponible`);
          } catch (error) {
            console.log(`❌ Error verificando ${fileName}:`, error);
            continue;
          }
          
          // Descargar archivo usando ReactNativeBlobUtil
          const downloadResult = await ReactNativeBlobUtil.config({
            fileCache: true,
            path: filePath,
          }).fetch('GET', fileUrl);
          
          if (downloadResult.path()) {
            const stats = await RNFS.stat(downloadResult.path());
            console.log(`✅ Archivo ${fileName} descargado: ${stats.size} bytes`);
            if (stats.size > 1000) {
              downloadedFiles++;
            }
          }
          
        } catch (error) {
          console.log(`❌ Error descargando ${fileName}:`, error);
        }
      }
      
      console.log(`✅ ${downloadedFiles} archivos descargados de ${knownFiles.length} esperados`);
      addDebugLog(`✅ ${downloadedFiles} archivos descargados correctamente`);
      
      if (downloadedFiles === 0) {
        throw new Error('Ningún archivo se descargó correctamente');
      }
      
    } catch (error) {
      console.error('Error en descarga de carpeta:', error);
      throw error;
    }
  };

  // Función para descargar y agregar al setlist
  const downloadAndAddToSetlist = async (song: any) => {
    let baseUrl = '';
    
    // Procesar URL base para los tracks (antes del try para que esté disponible en catch)
    baseUrl = song.audioFile || song.fileUrl || song.url || song.filePath || song.audioPath || song.downloadUrl || '';
    console.log('🔍 URL base original:', baseUrl);
    
    try {
      setIsDownloading(true);
      setDownloadingFile(`Descargando ${song.title}...`);
      
      // Generar timestamp único para esta descarga
      const downloadTimestamp = Date.now();
      
      // Descargar todos los archivos de la carpeta de la canción
      await downloadSongFolder(song, baseUrl, downloadTimestamp);
      
      // Obtener la ruta real donde se descargaron los tracks
      const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download/MixerCurseDownloads`;
      const songFolderName = `${song.title || 'Unknown'}_${downloadTimestamp}`.replace(/[^a-zA-Z0-9]/g, '_');
      const songFolderPath = `${downloadsPath}/${songFolderName}`;
      
      // Crear carpeta si no existe
      const folderExists = await RNFS.exists(songFolderPath);
      if (!folderExists) {
        await RNFS.mkdir(songFolderPath);
        console.log('✅ Carpeta de canción creada:', songFolderPath);
      }
      
      if (!folderExists) {
        throw new Error('La carpeta de tracks no se creó correctamente');
      }
      
      // Verificar que los archivos se descargaron correctamente
      const expectedFiles = [
        '1759028995216_Click.wav',
        '1759029000243_Flauta.wav',
        '1759029002556_Guía.wav',
        '1759029004626_Horns.wav'
      ];
      
      let verifiedFiles = 0;
      for (const fileName of expectedFiles) {
        const filePath = `${songFolderPath}/${fileName}`;
        const fileExists = await RNFS.exists(filePath);
        if (fileExists) {
          const fileStats = await RNFS.stat(filePath);
          console.log(`✅ Archivo ${fileName} verificado: ${fileStats.size} bytes`);
          if (fileStats.size > 1000) {
            verifiedFiles++;
          }
        } else {
          console.log(`❌ Archivo ${fileName} no encontrado en: ${filePath}`);
        }
      }
      
      if (verifiedFiles === 0) {
        throw new Error('Ningún archivo se descargó correctamente. Verifica que todos los archivos estén disponibles en B2.');
      }
      
      console.log(`✅ ${verifiedFiles} archivos verificados correctamente de ${expectedFiles.length} esperados`);
      
      // Crear objeto de canción con la ruta de la carpeta de tracks
      const songWithLocalPath = {
        ...song,
        localAudioFile: songFolderPath, // Usar la carpeta de tracks como referencia
        downloadedAt: new Date().toISOString(),
        fileSize: 'Multi-track folder'
      };
      
      console.log('💾 Canción con ruta local:', songWithLocalPath);
      
      // Finalizar descarga
      setIsDownloading(false);
      setDownloadingFile('');
      setDownloadProgress(100);
      
      Alert.alert(
        '✅ Descarga Completada',
        `"${song.title}" descargada exitosamente\n\nUbicación: ${songFolderPath}\nArchivos descargados: ${verifiedFiles}/${expectedFiles.length}\n\nPara encontrar los archivos:\n1. Abre "Files" en el emulador\n2. Ve a "Download/MixerCurseDownloads"`,
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('❌ Error en descarga:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error name:', error.name);
      
      setIsDownloading(false);
      setDownloadingFile('');
      setDownloadProgress(0);
      
      addDebugLog(`❌ Error: ${error.message}`);
      addDebugLog(`📁 Ruta esperada: /storage/emulated/0/Download/MixerCurseDownloads`);
      addDebugLog(`🔗 URL canción: ${baseUrl}`);
      addDebugLog(`📊 ProjectId: ${song.projectId || 'N/A'}`);
      addDebugLog(`📊 Tracks esperados: click, flauta, guia, horns`);
      
      Alert.alert(
        '❌ Error de Descarga',
        `Error: ${error.message}\n\n¿Quieres ver los logs de debug?`,
        [
          { text: 'Cerrar', style: 'cancel' },
          {
            text: '📋 Ver Logs',
            onPress: () => setShowDebugLogs(true)
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MixerCurse</Text>
        <TouchableOpacity onPress={() => downloadAndAddToSetlist({ title: 'Test Song', audioFile: '/mixercur/audio/HJE2OzlzUnYoMKjL5PgGays2J4E2/1759028995216_Click.wav', projectId: 'HJE2OzlzUnYoMKjL5PgGays2J4E2' })}>
          <Text style={styles.testButton}>Test Download</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>MainScreen Component</Text>
        {isDownloading && (
          <View style={styles.downloadingContainer}>
            <Text style={styles.downloadingText}>{downloadingFile}</Text>
            <Text style={styles.progressText}>{downloadProgress}%</Text>
          </View>
        )}
      </View>

      {/* Modal de Debug Logs */}
      <Modal
        visible={showDebugLogs}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDebugLogs(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Logs de Debug</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDebugLogs(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.debugLogsContainer}>
              {debugLogs.length === 0 ? (
                <Text style={styles.noLogsText}>No hay logs de debug disponibles</Text>
              ) : (
                <Text
                  style={styles.debugLogText}
                  selectable={true}
                  selectionColor="#2196F3"
                >
                  {debugLogs.join('\n')}
                </Text>
              )}
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearLogsButton}
                onPress={() => setDebugLogs([])}
              >
                <Text style={styles.clearLogsButtonText}>🗑️ Limpiar Logs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  testButton: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  downloadingContainer: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  downloadingText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5,
  },
  progressText: {
    color: '#2196F3',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#444',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugLogsContainer: {
    maxHeight: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  debugLogText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
  noLogsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 50,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearLogsButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearLogsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default MainScreen;
