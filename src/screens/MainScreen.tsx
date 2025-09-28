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
import AudioLibrary from '../components/AudioLibrary';

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
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [songTitle, setSongTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [librarySongs, setLibrarySongs] = useState<any[]>([]);
  const [setlistSongs, setSetlistSongs] = useState<any[]>([]);
  const [selectedSetlist, setSelectedSetlist] = useState<any>(null);
  const [selectedSetlistSongs, setSelectedSetlistSongs] = useState<any[]>([]);
  const [showCreateSetlistModal, setShowCreateSetlistModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState('');
  const [showDownloadedSongsModal, setShowDownloadedSongsModal] = useState(false);
  const [downloadedSongs, setDownloadedSongs] = useState<any[]>([]);
  const [trackProgress, setTrackProgress] = useState<{[key: string]: number}>({});
  const [currentTrack, setCurrentTrack] = useState<string>('');
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [realTimeLogs, setRealTimeLogs] = useState<string[]>([]);
  const [showNewSongsModal, setShowNewSongsModal] = useState(false);
  const [newSongs, setNewSongs] = useState<any[]>([]);
  const [currentSetlistSongs, setCurrentSetlistSongs] = useState<any[]>([]);

  const { user, signOut } = useAuth();

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logEntry]);
    setRealTimeLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const handleUploadSong = async () => {
    try {
      if (!songTitle || !artistName) {
        Alert.alert('Error', 'Por favor completa todos los campos');
        return;
      }

      // Generar ID único para la canción
      const songId = `song_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Construir la ruta donde se subirá
      const uploadPath = `canciones/${songId}/`;
      const fullPath = `https://mixercur.s3.us-east-005.backblazeb2.com/${uploadPath}`;
      
      addDebugLog(`🎵 Subiendo canción: ${artistName} - ${songTitle}`);
      addDebugLog(`📁 Ruta de subida: ${fullPath}`);
      addDebugLog(`🆔 ID de canción: ${songId}`);
      
      // Simular subida exitosa (aquí iría la lógica real de subida)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mostrar éxito con la ruta
      Alert.alert(
        '✅ Canción Subida Exitosamente',
        `Artista: ${artistName}\nCanción: ${songTitle}\n\n📁 Ruta en B2:\n${fullPath}\n\n🆔 ID: ${songId}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowUploadForm(false);
              setSongTitle('');
              setArtistName('');
            }
          }
        ]
      );
      
    } catch (error) {
      addDebugLog(`❌ Error subiendo canción: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'No se pudo subir la canción');
    }
  };

  // Cargar canciones de la biblioteca desde Firestore
  const loadLibrarySongs = async () => {
    try {
      if (user?.uid) {
        console.log('🔍 Cargando canciones para usuario:', user.uid);
        
        // Intentar cargar proyectos (canciones)
        console.log('🔍 Intentando cargar proyectos con UID:', user.uid);
        const projects = await firestoreService.getUserProjects(user.uid);
        console.log('📚 Proyectos encontrados:', projects);
        console.log('📊 Total proyectos:', projects.length);
        
        // Debug específico de la consulta
        if (projects.length === 0) {
          console.log('⚠️ No se encontraron proyectos para este usuario');
          console.log('🔍 Verificando consulta directa...');
          
          try {
            // Hacer consulta directa sin filtro para ver todos los proyectos
            const allProjects = await firestoreService.getCollection('projects');
            console.log('📋 Todos los proyectos en la base de datos:', allProjects.length);
            
            // Buscar proyectos que coincidan con diferentes campos
            const projectsByOwnerId = allProjects.filter(p => p.ownerId === user.uid);
            const projectsByUserId = allProjects.filter(p => p.userId === user.uid);
            const projectsByUser = allProjects.filter(p => p.user === user.uid);
            
            console.log('👤 Proyectos con ownerId =', user.uid, ':', projectsByOwnerId.length);
            console.log('👤 Proyectos con userId =', user.uid, ':', projectsByUserId.length);
            console.log('👤 Proyectos con user =', user.uid, ':', projectsByUser.length);
            
            if (projectsByOwnerId.length > 0) {
              console.log('✅ Encontrados proyectos con ownerId correcto');
              console.log('📋 Primer proyecto:', projectsByOwnerId[0]);
            }
            
          } catch (directQueryError) {
            console.log('❌ Error en consulta directa:', directQueryError);
          }
        }
        
        // También intentar cargar todas las colecciones para debug
        try {
          const allCollections = await firestoreService.getCollection('projects');
          console.log('🗂️ Todos los proyectos en la base de datos:', allCollections.length);
          console.log('📋 Primeros 3 proyectos:', allCollections.slice(0, 3));
          
          const userProjects = allCollections.filter(p => p.ownerId === user.uid);
          console.log('👤 Proyectos del usuario actual:', userProjects.length);
          console.log('👤 UID del usuario:', user.uid);
          
          // Mostrar todos los ownerId únicos para debug
          const uniqueOwners = [...new Set(allCollections.map(p => p.ownerId))];
          console.log('👥 Todos los ownerId en proyectos:', uniqueOwners);
          
          // Intentar otras colecciones posibles
          try {
            const songs = await firestoreService.getCollection('songs');
            console.log('🎵 Canciones en colección "songs":', songs.length);
            console.log('📋 Primeras 3 canciones:', songs.slice(0, 3));
            
            const userSongs = songs.filter(s => s.ownerId === user.uid);
            console.log('👤 Canciones del usuario en "songs":', userSongs.length);
            
            // Mostrar todos los ownerId en songs
            const uniqueSongOwners = [...new Set(songs.map(s => s.ownerId))];
            console.log('👥 Todos los ownerId en songs:', uniqueSongOwners);
          } catch (songsError) {
            console.log('⚠️ No existe colección "songs" o error:', songsError);
          }
          
          try {
            const tracks = await firestoreService.getCollection('tracks');
            console.log('🎶 Tracks en colección "tracks":', tracks.length);
            console.log('📋 Primeros 3 tracks:', tracks.slice(0, 3));
          } catch (tracksError) {
            console.log('⚠️ No existe colección "tracks" o error:', tracksError);
          }
          
          try {
            const audioFiles = await firestoreService.getCollection('audioFiles');
            console.log('🎧 Audio files en colección "audioFiles":', audioFiles.length);
            console.log('📋 Primeros 3 audio files:', audioFiles.slice(0, 3));
          } catch (audioError) {
            console.log('⚠️ No existe colección "audioFiles" o error:', audioError);
          }
          
        } catch (collectionError) {
          console.log('⚠️ Error obteniendo todas las colecciones:', collectionError);
        }
        
        // Intentar usar canciones de otras colecciones si no hay proyectos
        let songsToShow = projects;
        
        // Si no hay proyectos con getUserProjects, intentar con consulta directa
        if (projects.length === 0) {
          try {
            const allProjects = await firestoreService.getCollection('projects');
            const projectsByOwnerId = allProjects.filter(p => p.ownerId === user.uid);
            const projectsByUserId = allProjects.filter(p => p.userId === user.uid);
            const projectsByUser = allProjects.filter(p => p.user === user.uid);
            
            if (projectsByOwnerId.length > 0) {
              console.log('✅ Usando proyectos encontrados con ownerId');
              songsToShow = projectsByOwnerId;
            } else if (projectsByUserId.length > 0) {
              console.log('✅ Usando proyectos encontrados con userId');
              songsToShow = projectsByUserId;
            } else if (projectsByUser.length > 0) {
              console.log('✅ Usando proyectos encontrados con user');
              songsToShow = projectsByUser;
            }
          } catch (error) {
            console.log('⚠️ Error en consulta directa de proyectos:', error);
          }
        }
        
        if (songsToShow.length === 0) {
          // Intentar colección 'songs'
          try {
            const songs = await firestoreService.getCollection('songs');
            const userSongs = songs.filter(s => s.ownerId === user.uid);
            if (userSongs.length > 0) {
              console.log('✅ Usando canciones de colección "songs"');
              songsToShow = userSongs;
            }
          } catch (error) {
            console.log('⚠️ No se pudo cargar colección "songs"');
          }
          
          // Si aún no hay canciones, intentar otras colecciones
          if (songsToShow.length === 0) {
            try {
              const audioFiles = await firestoreService.getCollection('audioFiles');
              const userAudioFiles = audioFiles.filter(a => a.ownerId === user.uid);
              if (userAudioFiles.length > 0) {
                console.log('✅ Usando audio files de colección "audioFiles"');
                songsToShow = userAudioFiles;
              }
            } catch (error) {
              console.log('⚠️ No se pudo cargar colección "audioFiles"');
            }
          }
          
          // Si aún no hay canciones, intentar 'userLibrary'
          if (songsToShow.length === 0) {
            try {
              const userLibrary = await firestoreService.getCollection('userLibrary');
              const userLibraryItems = userLibrary.filter(l => l.ownerId === user.uid);
              if (userLibraryItems.length > 0) {
                console.log('✅ Usando items de colección "userLibrary"');
                songsToShow = userLibraryItems;
              }
          } catch (error) {
            console.log('⚠️ No se pudo cargar colección "userLibrary"');
          }
        }
        }
        
        setLibrarySongs(songsToShow);
        
        // Mostrar detalles de cada canción
        songsToShow.forEach((song, index) => {
          console.log(`🎵 Canción ${index + 1}:`, {
            id: song.id,
            name: song.name || (song as any).title,
            bpm: song.bpm,
            key: song.key,
            ownerId: song.ownerId
          });
        });
        
        if (projects.length === 0) {
          console.log('ℹ️ No se encontraron canciones. Posibles causas:');
          console.log('1. No hay canciones subidas para este usuario');
          console.log('2. Las canciones están en otra colección');
          console.log('3. Error en la consulta de Firestore');
        }
        } else {
        console.log('❌ No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error cargando biblioteca:', error);
      addDebugLog(`Error cargando biblioteca: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Cargar canciones cuando se abre la biblioteca
  useEffect(() => {
    if (showLibraryDrawer) {
      loadLibrarySongs();
    }
  }, [showLibraryDrawer, user]);

  // Cargar setlists cuando se abre el drawer
  const loadSetlistSongs = async () => {
    try {
      if (user?.uid) {
        console.log('🎵 Cargando setlists para usuario:', user.uid);
        const setlists = await firestoreService.getUserSetlists(user.uid);
        console.log('📚 Setlists encontrados:', setlists);
        console.log('📊 Total setlists:', setlists.length);
        setSetlistSongs(setlists);
        
        // Mostrar detalles de cada setlist
        setlists.forEach((setlist, index) => {
          console.log(`🎵 Setlist ${index + 1}:`, {
            id: setlist.id,
            name: setlist.name,
            songs: setlist.songs?.length || 0,
            ownerId: setlist.ownerId
          });
        });
    } else {
        console.log('❌ No hay usuario autenticado');
              }
    } catch (error) {
      console.error('❌ Error cargando setlists:', error);
      addDebugLog(`Error cargando setlists: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    if (showMySetlistDrawer) {
      loadSetlistSongs();
    }
  }, [showMySetlistDrawer, user]);

  // Cargar canciones del setlist cuando se selecciona uno
  useEffect(() => {
    if (selectedSetlist) {
      loadCurrentSetlistSongs();
    }
  }, [selectedSetlist, user]);

  // Función para cargar canciones de una setlist seleccionada
  const loadSelectedSetlistSongs = async (setlistId: string) => {
    try {
      console.log('🎵 Cargando canciones de setlist:', setlistId);
      const songs = await firestoreService.getSetlistSongs(setlistId);
      console.log('📚 Canciones de setlist encontradas:', songs);
      setSelectedSetlistSongs(songs);
    } catch (error) {
      console.error('❌ Error cargando canciones de setlist:', error);
      addDebugLog(`Error cargando canciones de setlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Función para seleccionar una setlist
  const selectSetlist = async (setlist: any) => {
    try {
      console.log('🎵 Seleccionando setlist:', setlist.name);
      setSelectedSetlist(setlist);
      await loadSelectedSetlistSongs(setlist.id);
    } catch (error) {
      console.error('❌ Error seleccionando setlist:', error);
      Alert.alert('Error', 'No se pudo cargar la setlist');
    }
  };

  // Función para crear una nueva setlist
  const createNewSetlist = () => {
    console.log('🎵 Abriendo modal para crear nueva setlist');
    setShowCreateSetlistModal(true);
  };

  const handleCreateSetlist = async () => {
    try {
      if (!newSetlistName.trim()) {
        Alert.alert('Error', 'El nombre de la setlist no puede estar vacío');
        return;
      }

      console.log('📝 Creando setlist con nombre:', newSetlistName.trim());
      setIsDownloading(true);
      setDownloadingFile('Creando setlist...');
      
      const setlistData = {
        name: newSetlistName.trim(),
        ownerId: user?.uid || '',
        songs: []
      };
      
      console.log('📊 Datos de la setlist:', setlistData);
      
      const newSetlistId = await firestoreService.createSetlist(setlistData);
      
      console.log('✅ Setlist creada con ID:', newSetlistId);
      
      // Recargar setlists
      await loadSetlistSongs();
      
      // Cerrar modal y limpiar
      setShowCreateSetlistModal(false);
      setNewSetlistName('');
      
      Alert.alert('Éxito', `Setlist "${newSetlistName.trim()}" creada correctamente`);
      
    } catch (error) {
      console.error('❌ Error creando setlist:', error);
      addDebugLog(`Error creando setlist: ${error instanceof Error ? error.message : String(error)}`);
      Alert.alert('Error', 'No se pudo crear la setlist');
    } finally {
      setIsDownloading(false);
      setDownloadingFile('');
    }
  };

  // Función para cargar canciones nuevas de la colección "newsongs"
  const loadNewSongs = async () => {
    try {
      if (user?.uid) {
        console.log('🎵 Cargando canciones nuevas para usuario:', user.uid);
        const songs = await firestoreService.getUserNewSongs(user.uid);
        console.log('🎵 Canciones nuevas encontradas:', songs);
        setNewSongs(songs);
      } else {
        console.log('❌ No hay usuario autenticado');
      }
    } catch (error) {
      console.error('❌ Error cargando canciones nuevas:', error);
      addDebugLog(`Error cargando canciones nuevas: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Función para cargar canciones del setlist actual
  const loadCurrentSetlistSongs = async () => {
    try {
      if (user?.uid && selectedSetlist) {
        console.log('🎵 Cargando canciones del setlist actual:', selectedSetlist.name);
        const songs = await firestoreService.getSetlistSongs(selectedSetlist.id);
        console.log('🎵 Canciones del setlist encontradas:', songs);
        setCurrentSetlistSongs(songs);
      } else {
        console.log('❌ No hay setlist seleccionado');
        setCurrentSetlistSongs([]);
      }
    } catch (error) {
      console.error('❌ Error cargando canciones del setlist:', error);
      addDebugLog(`Error cargando canciones del setlist: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Función para cargar canciones descargadas
  const loadDownloadedSongs = async () => {
    try {
      console.log('📁 Cargando canciones descargadas...');
      const downloadPath = `${RNFS.ExternalStorageDirectoryPath}/Download/MixerCurseDownloads`;
      
      // Verificar si existe la carpeta
      const folderExists = await RNFS.exists(downloadPath);
      if (!folderExists) {
        console.log('📁 Carpeta de descargas no existe');
        setDownloadedSongs([]);
      return;
    }
    
      // Leer contenido de la carpeta
      const items = await RNFS.readDir(downloadPath);
      console.log('📁 Elementos en carpeta de descargas:', items.length);
      
      const songFolders = items.filter(item => item.isDirectory());
      console.log('📁 Carpetas de canciones encontradas:', songFolders.length);
      
      const songs = [];
      for (const folder of songFolders) {
        try {
          // Leer archivos dentro de la carpeta
          const folderContents = await RNFS.readDir(folder.path);
          const audioFiles = folderContents.filter(file => 
            file.isFile() && file.name.endsWith('.wav')
          );
          
          if (audioFiles.length > 0) {
            songs.push({
              name: folder.name,
              path: folder.path,
              files: audioFiles,
              fileCount: audioFiles.length,
              totalSize: audioFiles.reduce((sum, file) => sum + file.size, 0)
            });
          }
        } catch (error) {
          console.log('⚠️ Error leyendo carpeta:', folder.name, error);
        }
      }
      
      console.log('🎵 Canciones descargadas encontradas:', songs.length);
      setDownloadedSongs(songs);
      
    } catch (error) {
      console.error('❌ Error cargando canciones descargadas:', error);
      addDebugLog(`Error cargando canciones descargadas: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Función para eliminar una canción descargada
  const deleteDownloadedSong = async (song: any) => {
    try {
      console.log('🗑️ Eliminando canción descargada:', song.name);
      
        Alert.alert(
        'Eliminar Canción',
        `¿Estás seguro de que quieres eliminar "${song.name}" y todos sus archivos? Esta acción no se puede deshacer.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                setIsDownloading(true);
                setDownloadingFile(`Eliminando ${song.name}...`);
                
                // Eliminar toda la carpeta
                await RNFS.unlink(song.path);
                console.log('✅ Carpeta eliminada:', song.path);
                
                // Recargar lista
                await loadDownloadedSongs();
                
                Alert.alert('Éxito', 'Canción eliminada correctamente');
                
              } catch (error) {
                console.error('❌ Error eliminando canción:', error);
                Alert.alert('Error', 'No se pudo eliminar la canción');
              } finally {
                setIsDownloading(false);
                setDownloadingFile('');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error en deleteDownloadedSong:', error);
      Alert.alert('Error', 'No se pudo eliminar la canción');
    }
  };

  // Función para eliminar una canción de la biblioteca
  const deleteSongFromLibrary = async (song: any) => {
    try {
      console.log('🗑️ Eliminando canción:', song.name || song.title);
      
      // Mostrar confirmación
      Alert.alert(
        'Eliminar Canción',
        `¿Estás seguro de que quieres eliminar "${song.name || song.title}"? Esta acción no se puede deshacer.`,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              try {
                setIsDownloading(true);
                setDownloadingFile('Eliminando canción...');
                
                // 1. Eliminar de Firestore
                await firestoreService.deleteProject(song.id);
                console.log('✅ Proyecto eliminado de Firestore');
                
                // 2. Eliminar archivos de B2 (si tiene tracks)
                if (song.tracks && song.tracks.length > 0) {
                  console.log('🗑️ Eliminando tracks de B2...');
                  
                  for (const track of song.tracks) {
                    if (track.audioFile) {
                      try {
                        // Construir URL del proxy para eliminar
                        const trackUrl = track.audioFile;
                        const deleteUrl = `http://192.168.1.173:3001/api/delete${trackUrl}`;
                        
                        console.log('🗑️ Eliminando track:', trackUrl);
                        
                        const response = await fetch(deleteUrl, {
                          method: 'DELETE',
                        });
                        
                        if (response.ok) {
                          console.log('✅ Track eliminado de B2:', track.name);
          } else {
                          console.log('⚠️ Error eliminando track de B2:', track.name);
          }
        } catch (error) {
                        console.log('⚠️ Error eliminando track:', track.name, error);
                      }
                    }
                  }
                }
                
                // 3. Actualizar la lista local
                setLibrarySongs(prev => prev.filter(s => s.id !== song.id));
                
                // 4. Mostrar confirmación
                Alert.alert('Éxito', 'Canción eliminada correctamente');
                
              } catch (error) {
                console.error('❌ Error eliminando canción:', error);
                Alert.alert('Error', 'No se pudo eliminar la canción');
              } finally {
                setIsDownloading(false);
                setDownloadingFile('');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error en deleteSongFromLibrary:', error);
      Alert.alert('Error', 'No se pudo eliminar la canción');
    }
  };


  // Función para verificar si el servidor proxy está disponible
  const checkProxyServer = async (): Promise<boolean> => {
    const proxyUrls = [
      'http://192.168.1.173:3001/api/health',
      'http://localhost:3001/api/health',
      'http://10.0.2.2:3001/api/health',
      'http://127.0.0.1:3001/api/health'
    ];
    
    for (const url of proxyUrls) {
      try {
        const response = await fetch(url, { 
          method: 'GET'
        });
        if (response.ok) {
          console.log(`✅ Servidor proxy disponible en: ${url}`);
          addDebugLog(`✅ Servidor proxy disponible en: ${url}`);
          return true;
        }
      } catch (error) {
        console.log(`❌ Proxy no disponible en: ${url}`);
      }
    }
    
    console.log('❌ Ningún servidor proxy está disponible');
    addDebugLog('❌ Ningún servidor proxy está disponible');
    return false;
  };

  // Función de diagnóstico completo
  const runDiagnostic = async () => {
    addDebugLog('🔍 INICIANDO DIAGNÓSTICO COMPLETO...');
    addDebugLog('='.repeat(50));
    
    // 1. Verificar conectividad básica
    addDebugLog('🌐 1. Verificando conectividad básica...');
    try {
      const testResponse = await fetch('https://www.google.com', { method: 'HEAD' });
      addDebugLog(`✅ Internet disponible: ${testResponse.status}`);
    } catch (error) {
      addDebugLog(`❌ Sin conexión a internet: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // 2. Verificar servidor proxy
    addDebugLog('🔧 2. Verificando servidor proxy...');
    const proxyAvailable = await checkProxyServer();
    
    // 3. Verificar Backblaze B2 directo
    addDebugLog('☁️ 3. Verificando Backblaze B2 directo...');
    const b2Urls = [
      'https://mixercur.s3.us-east-005.backblazeb2.com/canciones/song_1759063260317_5b6w6kxph/',
      'https://f005.backblazeb2.com/file/mixercur/canciones/song_1759063260317_5b6w6kxph/',
      'https://f000.backblazeb2.com/file/mixercur/canciones/song_1759063260317_5b6w6kxph/'
    ];
    
    for (const url of b2Urls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        addDebugLog(`${response.ok ? '✅' : '❌'} B2 ${url}: ${response.status}`);
      } catch (error) {
        addDebugLog(`❌ B2 ${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    // 4. Verificar permisos de escritura
    addDebugLog('📁 4. Verificando permisos de escritura...');
    try {
      const testPath = `${RNFS.ExternalStorageDirectoryPath}/Download/MixerCurseDownloads/test.txt`;
      await RNFS.writeFile(testPath, 'test', 'utf8');
      const exists = await RNFS.exists(testPath);
      if (exists) {
        await RNFS.unlink(testPath);
        addDebugLog('✅ Permisos de escritura OK');
      } else {
        addDebugLog('❌ No se pudo escribir archivo de prueba');
      }
    } catch (error) {
      addDebugLog(`❌ Error de permisos: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    addDebugLog('='.repeat(50));
    addDebugLog('🔍 DIAGNÓSTICO COMPLETADO');
  };


  // Función para descargar y agregar al setlist
  const downloadAndAddToSetlist = async (song: any) => {
    let baseUrl = '';
    
    // Procesar URL base para los tracks (antes del try para que esté disponible en catch)
    baseUrl = song.audioFile || song.fileUrl || song.url || song.filePath || song.audioPath || song.downloadUrl || '';
    console.log('🔍 URL base original:', baseUrl);
    
    // Si no hay URL, usar el ID del proyecto para construir la URL
    if (!baseUrl && song.id) {
      baseUrl = `/mixercur/canciones/${song.id}/`;
      console.log('🔧 URL construida desde ID:', baseUrl);
    }
    
    // Debug: mostrar todos los datos de la canción
    console.log('🔍 DATOS COMPLETOS DE LA CANCIÓN:', JSON.stringify(song, null, 2));
    
    try {
      setIsDownloading(true);
      setDownloadingFile(`Descargando ${song.title}...`);
      
      // Generar timestamp único para esta descarga
      const downloadTimestamp = Date.now();
      
      // Verificar si el servidor proxy está disponible
      const proxyAvailable = await checkProxyServer();
      if (!proxyAvailable) {
        throw new Error('Servidor proxy no disponible. Verifica que el servidor esté ejecutándose en http://192.168.1.173:3001');
      }
      
      // Descargar archivos de audio usando el proxy
      const tracks = [
        'BAJO.wav', 'BATERIA.wav', 'CLICK.wav', 'GA1.wav', 'GA2.wav',
        'GE1.wav', 'GE2.wav', 'GE3.wav', 'GE4.wav', 'GE5.wav',
        'GUIAS.wav', 'PADS.wav', 'PIANO.wav'
      ];
      
      let downloadedFiles = 0;
      const trackProgress: {[key: string]: number} = {};
      
      // Inicializar progreso de tracks
      tracks.forEach(track => {
        trackProgress[track] = 0;
      });
      setTrackProgress(trackProgress);
      
      for (const track of tracks) {
        try {
          setCurrentTrack(track);
          addDebugLog(`📥 Descargando ${track}...`);
          
          const trackUrl = `${baseUrl}${track}`;
          const proxyUrl = `http://192.168.1.173:3001/api/proxy${trackUrl}`;
          
          const filePath = `${songFolderPath}/${track}`;
          
          const { config } = ReactNativeBlobUtil;
          const downloadConfig = config({
            fileCache: true,
            path: filePath,
            addAndroidDownloads: {
              useDownloadManager: false,
              notification: false,
              mime: 'audio/wav',
              description: `Descargando ${track}`,
            },
          });
          
          const response = await downloadConfig.fetch('GET', proxyUrl);
          
          // Verificar que el archivo se descargó
          const fileExists = await RNFS.exists(filePath);
          if (fileExists) {
            const stats = await RNFS.stat(filePath);
            if (stats.size > 1000) {
              trackProgress[track] = 100;
              downloadedFiles++;
              addDebugLog(`✅ ${track} descargado: ${stats.size} bytes`);
            } else {
              trackProgress[track] = -1;
              addDebugLog(`❌ ${track} archivo muy pequeño: ${stats.size} bytes`);
            }
          } else {
            trackProgress[track] = -1;
            addDebugLog(`❌ ${track} no se descargó`);
          }
          
          setTrackProgress({...trackProgress});
          
        } catch (error) {
          trackProgress[track] = -1;
          setTrackProgress({...trackProgress});
          addDebugLog(`❌ Error descargando ${track}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
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
        'BAJO.wav',
        'BATERIA.wav',
        'CLICK.wav',
        'GA1.wav',
        'GA2.wav',
        'GE1.wav',
        'GE2.wav',
        'GE3.wav',
        'GE4.wav',
        'GE5.wav',
        'GUIAS.wav',
        'PADS.wav',
        'PIANO.wav'
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
        throw new Error('Ningún archivo se descargó correctamente. Verifica que los archivos estén disponibles en B2.');
      }
      
      console.log(`✅ ${verifiedFiles} archivos descargados de ${expectedFiles.length} intentados`);
      
      console.log(`✅ ${verifiedFiles} archivos verificados correctamente de ${expectedFiles.length} esperados`);
      
      // Crear objeto de canción con la ruta de la carpeta de tracks
      const songWithLocalPath = {
        ...song,
        localAudioFile: songFolderPath, // Usar la carpeta de tracks como referencia
        downloadedAt: new Date().toISOString(),
        fileSize: 'Multi-track folder'
      };
      
      console.log('💾 Canción con ruta local:', songWithLocalPath);

        // Agregar a la setlist seleccionada si hay una
        if (selectedSetlist) {
          try {
            console.log('🎵 Agregando canción a setlist:', selectedSetlist.name);
            console.log('🔍 Setlist ID:', selectedSetlist.id);
            console.log('🔍 Usuario UID:', user?.uid);
            
            // Crear objeto de canción para la setlist
            const setlistSong = {
              title: song.title || song.name || 'Sin título',
              artist: song.artist || 'Unknown',
              key: song.key || 'C',
              bpm: song.bpm || 120,
              audioFile: baseUrl,
              localAudioFile: songFolderPath,
              order: selectedSetlistSongs.length + 1,
              duration: 0,
              fileSize: 0,
              uploadDate: new Date(),
              ownerId: user?.uid,
              projectId: song.id,
              tags: [],
              isPublic: false
            };
            
            console.log('📝 Datos de la canción a guardar:', JSON.stringify(setlistSong, null, 2));
            
            // Agregar a Firestore
            const songId = await firestoreService.addSongToSetlist(selectedSetlist.id, setlistSong);
            console.log('✅ Canción agregada a Firestore con ID:', songId);
            
            // Actualizar la lista local
            setSelectedSetlistSongs(prev => [...prev, { ...setlistSong, id: songId }]);
            
            // Recargar las canciones de la setlist para asegurar sincronización
            await loadSelectedSetlistSongs(selectedSetlist.id);
            
            console.log('✅ Canción agregada a setlist exitosamente');
            } catch (error) {
            console.error('❌ Error agregando a setlist:', error);
            addDebugLog(`Error agregando a setlist: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            Alert.alert('Advertencia', 'La canción se descargó pero no se pudo agregar a la setlist');
          }
        } else {
          console.log('⚠️ No hay setlist seleccionada para agregar la canción');
        }

        // Finalizar descarga
          setIsDownloading(false);
          setDownloadingFile('');
        setDownloadProgress(100);

        const successMessage = selectedSetlist 
          ? `"${song.title}" descargada y agregada a "${selectedSetlist.name}"`
          : `"${song.title}" descargada exitosamente`;
        
        Alert.alert(
          '✅ Descarga Completada',
          successMessage,
          [{ text: 'OK' }]
        );

      } catch (error) {
        console.error('❌ Error en descarga:', error);
        if (error instanceof Error) {
          console.error('❌ Error stack:', error.stack);
          console.error('❌ Error message:', error.message);
          console.error('❌ Error name:', error.name);
        }
        
        setIsDownloading(false);
        setDownloadingFile('');
        setDownloadProgress(0);
      
        addDebugLog(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
        addDebugLog(`📁 Ruta esperada: /storage/emulated/0/Download/MixerCurseDownloads`);
        addDebugLog(`🔗 URL canción: ${baseUrl}`);
        addDebugLog(`📊 ProjectId: ${song.projectId || 'N/A'}`);
        addDebugLog(`📊 Tracks esperados: BAJO, BATERIA, CLICK, GA1, GA2, GE1, GE2, GE3, GE4, GE5, GUIAS, PADS, PIANO`);
        
        Alert.alert(
          '❌ Error de Descarga',
          `Error: ${error instanceof Error ? error.message : String(error)}\n\n¿Quieres ver los logs de debug?`,
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
      {/* BOTÓN CENTRAL */}
      <View style={styles.centralButtonContainer}>
        <TouchableOpacity 
          style={styles.centralButton}
          onPress={() => setShowUploadForm(true)}
        >
          <Text style={styles.centralButtonText}>SI PUEDO HACERLO</Text>
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MixerCurse</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.libraryButton}
            onPress={() => setShowLibraryDrawer(true)}
          >
            <Text style={styles.buttonText}>📚 Biblioteca</Text>
          </TouchableOpacity>
            <TouchableOpacity 
            style={styles.setlistButton}
            onPress={() => {
              console.log('🎵 Abriendo modal de setlists');
              setShowMySetlistDrawer(true);
            }}
            >
            <Text style={styles.buttonText}>🎵 Mi Setlist</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={styles.downloadedButton}
            onPress={() => {
              console.log('📁 Abriendo modal de canciones descargadas');
              loadDownloadedSongs();
              setShowDownloadedSongsModal(true);
            }}
            >
            <Text style={styles.buttonText}>📁 Descargadas</Text>
            </TouchableOpacity>
            <TouchableOpacity 
            style={styles.newSongsButton}
            onPress={() => {
              console.log('🎵 Abriendo modal de canciones nuevas');
              loadNewSongs();
              setShowNewSongsModal(true);
            }}
            >
            <Text style={styles.buttonText}>🎵 New Songs</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={styles.logsButton}
            onPress={() => {
              console.log('📋 Abriendo logs en tiempo real');
              setShowLogsModal(true);
            }}
            >
            <Text style={styles.buttonText}>📋 Logs</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={styles.diagnosticButton}
            onPress={async () => {
              console.log('🔍 Ejecutando diagnóstico completo');
              await runDiagnostic();
              setShowLogsModal(true);
            }}
            >
            <Text style={styles.buttonText}>🔍 Diagnóstico</Text>
            </TouchableOpacity>
          </View>
          </View>

      {/* LED Display Area */}
      <View style={styles.ledSection}>
        <LEDDisplay />
          </View>

      {/* Mixer Area */}
      <View style={styles.mixerSection}>
        <View style={styles.transportControls}>
                  <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={() => setIsPlaying(!isPlaying)}
                  >
            <Text style={styles.playButtonText}>{isPlaying ? '⏸️' : '▶️'}</Text>
                  </TouchableOpacity>
          
          <View style={styles.timeDisplay}>
            <Text style={styles.timeText}>{currentTime}</Text>
            <Text style={styles.timeText}>/</Text>
            <Text style={styles.timeText}>{totalTime}</Text>
                    </View>
                    </View>

        <View style={styles.tempoControls}>
          <Text style={styles.tempoLabel}>BPM: {bpm}</Text>
          <Text style={styles.keyLabel}>Key: {key}</Text>
                        </View>
              </View>

      {/* Setlist Area */}
      <View style={styles.setlistSection}>
        <Text style={styles.sectionTitle}>
          {selectedSetlist ? `Setlist: ${selectedSetlist.name}` : 'Setlist'}
        </Text>
        <ScrollView style={styles.setlistContainer}>
          {currentSetlistSongs.length === 0 ? (
            <View style={styles.emptySetlistContainer}>
              <Text style={styles.emptySetlistText}>
                {selectedSetlist 
                  ? `"${selectedSetlist.name}" está vacío\n\nAgrega canciones desde la biblioteca`
                  : 'Selecciona un setlist para ver las canciones'
                }
              </Text>
              {selectedSetlist && (
                <TouchableOpacity 
                  style={styles.addSongsButton}
                  onPress={() => {
                    console.log('📚 Abriendo biblioteca para agregar canciones');
                    setShowLibraryDrawer(true);
                  }}
                >
                  <Text style={styles.addSongsButtonText}>📚 Agregar Canciones</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            currentSetlistSongs.map((song, index) => (
              <View key={index} style={styles.setlistSongItem}>
                <View style={styles.setlistSongInfo}>
                  <Text style={styles.setlistSongTitle}>{song.title || song.name}</Text>
                  <Text style={styles.setlistSongArtist}>{song.artist}</Text>
                  <Text style={styles.setlistSongDetails}>
                    BPM: {song.bpm || 'N/A'} | Key: {song.key || 'N/A'}
                  </Text>
                </View>
                <View style={styles.setlistSongActions}>
                  <TouchableOpacity 
                    style={styles.playSetlistButton}
                    onPress={() => {
                      console.log('▶️ Reproduciendo:', song.title);
                      // Aquí puedes agregar lógica de reproducción
                    }}
                  >
                    <Text style={styles.playSetlistButtonText}>▶️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeSetlistButton}
                    onPress={() => {
                      console.log('🗑️ Eliminando del setlist:', song.title);
                      // Aquí puedes agregar lógica para eliminar del setlist
                    }}
                  >
                    <Text style={styles.removeSetlistButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* Download Progress */}
      {isDownloading && (
        <View style={styles.downloadingContainer}>
          <Text style={styles.downloadingText}>{downloadingFile}</Text>
          <Text style={styles.progressText}>{downloadProgress}%</Text>
          
          {/* Progreso detallado de tracks */}
          {Object.keys(trackProgress).length > 0 && (
            <View style={styles.trackProgressContainer}>
              <Text style={styles.trackProgressTitle}>Progreso por Track:</Text>
              {Object.entries(trackProgress).map(([trackName, progress]) => (
                <View key={trackName} style={styles.trackProgressItem}>
                  <Text style={styles.trackName}>
                    {trackName} {currentTrack === trackName && '⬅️'}
            </Text>
                  <View style={styles.trackProgressBar}>
            <View 
              style={[
                        styles.trackProgressFill, 
                        { 
                          width: progress === -1 ? '100%' : `${Math.max(0, progress)}%`,
                          backgroundColor: progress === -1 ? '#ff4444' : progress === 100 ? '#44ff44' : '#4488ff'
                        }
              ]} 
            />
                </View>
                  <Text style={styles.trackProgressText}>
                    {progress === -1 ? 'Error' : `${progress}%`}
                  </Text>
              </View>
              ))}
            </View>
          )}
          </View>
      )}

      {/* Biblioteca Modal */}
      <Modal
        visible={showLibraryDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLibraryDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📚 Biblioteca de Audio</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.setlistSelectorButton}
                  onPress={() => setShowMySetlistDrawer(true)}
                >
                  <Text style={styles.setlistSelectorButtonText}>
                    {selectedSetlist ? `🎵 ${selectedSetlist.name}` : '🎵 Seleccionar Setlist'}
                        </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={() => setShowDebugLogs(true)}
            >
                  <Text style={styles.debugButtonText}>🔍 Debug</Text>
            </TouchableOpacity>
                  <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowLibraryDrawer(false)}
                  >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.libraryContainer}>
              {/* Panel izquierdo - Canciones de la biblioteca */}
              <View style={styles.libraryLeftPanel}>
                <Text style={styles.panelTitle}>📚 Biblioteca de Canciones</Text>
                <ScrollView style={styles.libraryContent}>
                  {librarySongs.length === 0 ? (
                    <Text style={styles.emptyText}>No hay canciones en la biblioteca</Text>
                  ) : (
                    librarySongs.map((song, index) => (
                      <View key={index} style={styles.songItemContainer}>
                      <TouchableOpacity
                          style={styles.songItem}
                          onPress={() => downloadAndAddToSetlist(song)}
                        >
                          <Text style={styles.songTitle}>{song.name || song.title}</Text>
                          <Text style={styles.songDetails}>
                            BPM: {song.bpm} | Key: {song.key}
                        </Text>
                          <Text style={styles.downloadButtonText}>⬇️ Descargar</Text>
                      </TouchableOpacity>
                    <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => deleteSongFromLibrary(song)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                    ))
                )}
                </ScrollView>
            </View>

              {/* Panel derecho - Setlist seleccionada */}
              <View style={styles.libraryRightPanel}>
                <Text style={styles.panelTitle}>
                  {selectedSetlist ? `🎵 ${selectedSetlist.name}` : '🎵 Selecciona una Setlist'}
                  </Text>
                <ScrollView style={styles.libraryContent}>
                  {!selectedSetlist ? (
                    <Text style={styles.emptyText}>Selecciona una setlist para ver sus canciones</Text>
                  ) : selectedSetlistSongs.length === 0 ? (
                    <Text style={styles.emptyText}>Esta setlist no tiene canciones</Text>
                  ) : (
                    selectedSetlistSongs.map((song, index) => (
                      <View key={index} style={styles.songItemContainer}>
                  <TouchableOpacity
                          style={styles.songItem}
                          onPress={() => downloadAndAddToSetlist(song)}
                        >
                          <Text style={styles.songTitle}>{song.title || song.name}</Text>
                          <Text style={styles.songDetails}>
                            BPM: {song.bpm} | Key: {song.key}
                        </Text>
                          <Text style={styles.downloadButtonText}>⬇️ Descargar</Text>
                        </TouchableOpacity>
                                <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => {
                            // Aquí puedes agregar funcionalidad para eliminar de setlist
                            console.log('Eliminando de setlist:', song.title);
                          }}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
            </View>
                    ))
                  )}
                </ScrollView>
                </View>
                    </View>
                        </View>
                        </View>
      </Modal>

      {/* Mi Setlist Modal */}
      <Modal
        visible={showMySetlistDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMySetlistDrawer(false)}
        onShow={() => console.log('🎵 Modal de setlists abierto')}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎵 Mis Setlists</Text>
              <View style={styles.headerButtons}>
                          <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => {
                    console.log('➕ Botón Nueva setlist presionado');
                    createNewSetlist();
                  }}
              >
                  <Text style={styles.createButtonText}>➕ Nueva</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowMySetlistDrawer(false)}
                          >
                  <Text style={styles.closeButtonText}>✕</Text>
                          </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.libraryContent}>
              {setlistSongs.length === 0 ? (
                <Text style={styles.emptyText}>No tienes setlists creadas</Text>
              ) : (
                setlistSongs.map((setlist, index) => (
                  <View key={index} style={styles.setlistItemContainer}>
                           <TouchableOpacity 
                      style={styles.setlistItem}
                             onPress={() => {
                        selectSetlist(setlist);
                        setShowMySetlistDrawer(false);
                      }}
                    >
                      <Text style={styles.setlistTitle}>{setlist.name}</Text>
                      <Text style={styles.setlistDetails}>
                        {setlist.songs?.length || 0} canciones
                          </Text>
                      <Text style={styles.setlistButton}>🎵 Abrir</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                      style={styles.deleteButton}
                             onPress={() => {
                        // Aquí puedes agregar funcionalidad para eliminar setlist
                        console.log('Eliminando setlist:', setlist.name);
                      }}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
                    ))
                  )}
          </ScrollView>
        </View>
                    </View>
      </Modal>

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

      {/* Modal para crear nueva setlist */}
      <Modal
        visible={showCreateSetlistModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateSetlistModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createSetlistModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎵 Nueva Setlist</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCreateSetlistModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.createSetlistContent}>
              <Text style={styles.inputLabel}>Nombre de la setlist:</Text>
              <TextInput
                style={styles.setlistNameInput}
                value={newSetlistName}
                onChangeText={setNewSetlistName}
                placeholder="Ingresa el nombre de la setlist"
                placeholderTextColor="#666"
              />
              
              <View style={styles.createSetlistButtons}>
          <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowCreateSetlistModal(false);
                    setNewSetlistName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
                  style={styles.createButton}
                  onPress={handleCreateSetlist}
                  disabled={isDownloading}
                >
                  <Text style={styles.createButtonText}>
                    {isDownloading ? 'Creando...' : 'Crear'}
                  </Text>
          </TouchableOpacity>
        </View>
      </View>
                  </View>
                </View>
      </Modal>

      {/* Modal para canciones descargadas */}
      <Modal
        visible={showDownloadedSongsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDownloadedSongsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📁 Canciones Descargadas</Text>
                  <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDownloadedSongsModal(false)}
                  >
                <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
        </View>

            <ScrollView style={styles.libraryContent}>
              {downloadedSongs.length === 0 ? (
                <Text style={styles.emptyText}>No hay canciones descargadas</Text>
              ) : (
                downloadedSongs.map((song, index) => (
                  <View key={index} style={styles.songItemContainer}>
                  <TouchableOpacity 
                      style={styles.songItem}
                      onPress={() => {
                        console.log('📁 Abriendo canción:', song.name);
                      }}
                    >
                      <Text style={styles.songTitle}>{song.name}</Text>
                      <Text style={styles.songDetails}>
                        {song.fileCount} archivos • {(song.totalSize / 1024 / 1024).toFixed(1)} MB
                    </Text>
                      <Text style={styles.downloadButtonText}>📁 Abrir Carpeta</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => deleteDownloadedSong(song)}
                  >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para canciones nuevas */}
      <Modal
        visible={showNewSongsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewSongsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.fullScreenModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎵 New Songs</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.refreshButton}
                  onPress={() => {
                    console.log('🔄 Refrescando canciones nuevas');
                    loadNewSongs();
                  }}
                >
                  <Text style={styles.refreshButtonText}>🔄 Actualizar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowNewSongsModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.newSongsContainer}>
              {/* Panel izquierdo - Canciones disponibles en B2 */}
              <View style={styles.newSongsLeftPanel}>
                <Text style={styles.panelTitle}>🎵 Canciones Disponibles en B2</Text>
                <ScrollView style={styles.libraryContent}>
              {newSongs.length === 0 ? (
                <Text style={styles.emptyText}>No hay canciones nuevas disponibles</Text>
              ) : (
                newSongs.map((song, index) => (
                  <View key={index} style={styles.songItemContainer}>
                    <TouchableOpacity 
                      style={styles.songItem}
                      onPress={() => {
                        // Función de descarga protegida contra crashes
                        const downloadSong = async () => {
                          try {
                            console.log('🎵 Descargando canción nueva:', song.title);
                            console.log('🔍 Objeto song completo:', JSON.stringify(song, null, 2));
                            addDebugLog(`🎵 Iniciando descarga: ${song.title}`);
                            setIsDownloading(true);
                            setDownloadingFile(`Descargando ${song.title}...`);
                            
                            // Incrementar contador de descargas de forma segura
                            try {
                              await firestoreService.incrementNewSongDownloads(song.id);
                            } catch (incrementError) {
                              console.log('⚠️ Error incrementando descargas:', incrementError);
                            }
                          
                            // Descarga con ReactNativeBlobUtil pero simplificada
                            let downloadUrl = song.b2Url || song.audioFile || song.downloadUrl || song.url || song.fileUrl || '';
                            
                            console.log('🔍 URLs disponibles:', {
                              b2Url: song.b2Url,
                              audioFile: song.audioFile,
                              downloadUrl: song.downloadUrl,
                              url: song.url,
                              fileUrl: song.fileUrl,
                              finalUrl: downloadUrl
                            });
                            
                            if (!downloadUrl || downloadUrl === 'null' || downloadUrl === 'undefined' || downloadUrl.trim() === '') {
                              const availableUrls = {
                                b2Url: song.b2Url,
                                audioFile: song.audioFile,
                                downloadUrl: song.downloadUrl,
                                url: song.url,
                                fileUrl: song.fileUrl
                              };
                              console.error('❌ No se encontró URL válida. URLs disponibles:', availableUrls);
                              throw new Error(`No se encontró URL de descarga válida para "${song.title}". URLs disponibles: ${JSON.stringify(availableUrls)}`);
                            }
                            
                            // Si la URL es relativa, convertirla a URL completa de B2
                            if (downloadUrl.startsWith('/mixercur/')) {
                              downloadUrl = `https://mixercur.s3.us-east-005.backblazeb2.com${downloadUrl}`;
                              console.log('🔗 URL convertida a completa:', downloadUrl);
                            }
                            
                            console.log('📥 Descargando desde:', downloadUrl);
                            
                            // Verificar si la URL es accesible antes de descargar
                            try {
                              const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
                              console.log('🔍 Test HEAD request status:', testResponse.status);
                              console.log('🔍 Test HEAD request headers:', {
                                'content-length': testResponse.headers.get('content-length'),
                                'content-type': testResponse.headers.get('content-type')
                              });
                            } catch (testError) {
                              console.log('⚠️ Error verificando URL:', testError);
                            }
                            
                            // Configuración mínima para descarga
                            const { config } = ReactNativeBlobUtil;
                            const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
                            const fileName = `${song.title}.mp3`;
                            const filePath = `${downloadsPath}/${fileName}`;
                            
                            console.log('📁 Guardando en:', filePath);
                            
                            const downloadConfig = config({
                              fileCache: true,
                              path: filePath,
                            });
                            
                            const response = await downloadConfig.fetch('GET', downloadUrl);
                            
                            console.log('✅ Descarga completada:', response.path());
                            console.log('📊 Response info:', {
                              status: response.info().status,
                              headers: response.info().headers,
                              path: response.path()
                            });
                            
                            // Verificar el tamaño del archivo descargado
                            try {
                              const fileExists = await RNFS.exists(response.path());
                              if (fileExists) {
                                const stats = await RNFS.stat(response.path());
                                console.log('📁 Archivo descargado - Tamaño:', stats.size, 'bytes');
                                if (stats.size < 1000) {
                                  console.log('⚠️ Archivo muy pequeño, posible error en descarga');
                                }
                              }
                            } catch (fileError) {
                              console.log('❌ Error verificando archivo:', fileError);
                            }
                            
                            // Guardar metadatos en Firestore para acceso posterior
                            try {
                              const songMetadata = {
                                title: song.title,
                                artist: song.artist,
                                fileName: fileName,
                                localPath: response.path(),
                                downloadUrl: downloadUrl,
                                downloadedAt: new Date(),
                                fileSize: 0, // Se puede calcular después
                                ownerId: user?.uid || '',
                                isDownloaded: true,
                                originalSongId: song.id
                              };
                              
                              console.log('💾 Guardando metadatos en Firestore...');
                              await firestoreService.addDownloadedSong(songMetadata);
                              console.log('✅ Metadatos guardados en Firestore');
                            } catch (metadataError) {
                              console.log('⚠️ Error guardando metadatos:', metadataError);
                            }
                            
                            setIsDownloading(false);
                            setDownloadingFile('');
                            setDownloadProgress(100);
                            
                            Alert.alert(
                              '✅ Descarga Completada',
                              `"${song.title}" descargada exitosamente\n\n📁 Guardado en:\n${response.path()}\n\n💾 Metadatos guardados en Firestore`,
                              [{ text: 'OK' }]
                            );
                          
                          } catch (error) {
                            console.error('❌ Error descargando canción nueva:', error);
                            addDebugLog(`❌ Error en descarga: ${error instanceof Error ? error.message : String(error)}`);
                            
                            // Limpiar estados de forma segura
                            try {
                              setIsDownloading(false);
                              setDownloadingFile('');
                              setDownloadProgress(0);
                            } catch (stateError) {
                              console.error('Error limpiando estados:', stateError);
                            }
                            
                            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
                            
                            // Mostrar error simple sin crashear
                            try {
                              Alert.alert(
                                '❌ Error de Descarga',
                                `No se pudo descargar "${song.title}"\n\nError: ${errorMessage}`,
                                [{ text: 'OK', style: 'default' }]
                              );
                            } catch (alertError) {
                              console.error('Error mostrando alert:', alertError);
                            }
                          }
                        };
                        
                        // Ejecutar descarga de forma segura
                        downloadSong().catch(error => {
                          console.error('Error en downloadSong:', error);
                        });
                      }}
                    >
                      <View style={styles.songHeader}>
                        <Text style={styles.songTitle}>{song.title}</Text>
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>NEW</Text>
                        </View>
                      </View>
                      <Text style={styles.songDetails}>🎤 {song.artist}</Text>
                      <Text style={styles.songDetails}>📁 {song.fileName}</Text>
                      <Text style={styles.songDetails}>📏 {((song.fileSize || 0) / 1024 / 1024).toFixed(2)} MB</Text>
                      <Text style={styles.songDetails}>📥 {song.downloads || 0} descargas</Text>
                      <Text style={styles.downloadButtonText}>⬇️ Descargar</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
                </ScrollView>
              </View>

              {/* Panel derecho - Lista de setlists */}
              <View style={styles.newSongsRightPanel}>
                <Text style={styles.panelTitle}>🎵 Seleccionar Setlist</Text>
                <ScrollView style={styles.libraryContent}>
                  {setlistSongs.length === 0 ? (
                    <Text style={styles.emptyText}>No tienes setlists creadas</Text>
                  ) : (
                    setlistSongs.map((setlist, index) => (
                      <View key={index} style={styles.setlistSelectorItem}>
                        <TouchableOpacity 
                          style={[
                            styles.setlistSelectorButton,
                            selectedSetlist?.id === setlist.id && styles.setlistSelectorButtonActive
                          ]}
                          onPress={async () => {
                            console.log('🎵 Seleccionando setlist:', setlist.name);
                            setSelectedSetlist(setlist);
                            
                            // Cerrar el modal de New Songs
                            setShowNewSongsModal(false);
                            
                            // Cargar las canciones del setlist seleccionado
                            try {
                              console.log('🎵 Cargando canciones del setlist:', setlist.name);
                              const songs = await firestoreService.getSetlistSongs(setlist.id);
                              console.log('🎵 Canciones del setlist encontradas:', songs);
                              setCurrentSetlistSongs(songs);
                              
                              // Mostrar mensaje de confirmación
                              Alert.alert(
                                '✅ Setlist Activado',
                                `"${setlist.name}" está ahora activo\n\n${songs.length} canciones cargadas`,
                                [{ text: 'OK' }]
                              );
                            } catch (error) {
                              console.error('❌ Error cargando canciones del setlist:', error);
                              setCurrentSetlistSongs([]);
                              Alert.alert(
                                '⚠️ Setlist Vacío',
                                `"${setlist.name}" está activo pero no tiene canciones`,
                                [{ text: 'OK' }]
                              );
                            }
                          }}
                        >
                          <Text style={styles.setlistSelectorButtonText}>{setlist.name}</Text>
                          <Text style={styles.setlistSelectorDetails}>
                            {setlist.songs?.length || 0} canciones
                          </Text>
                          {selectedSetlist?.id === setlist.id && (
                            <Text style={styles.setlistSelectorActive}>✓ Activo</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para logs en tiempo real */}
      <Modal
        visible={showLogsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLogsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sideModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📋 Logs en Tiempo Real</Text>
              <View style={styles.headerButtons}>
              <TouchableOpacity 
                  style={styles.clearLogsButton}
                  onPress={() => {
                    setRealTimeLogs([]);
                    setDebugLogs([]);
                  }}
                >
                  <Text style={styles.clearLogsButtonText}>🗑️ Limpiar</Text>
              </TouchableOpacity>
                  <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setShowLogsModal(false)}
                  >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                    </View>
                    </View>
            
            <ScrollView style={styles.logsContent}>
              {realTimeLogs.length === 0 ? (
                <Text style={styles.emptyText}>No hay logs disponibles</Text>
              ) : (
                realTimeLogs.map((log, index) => (
                  <Text key={index} style={styles.logText} selectable>
                    {log}
                  </Text>
                ))
              )}
            </ScrollView>
          </View>
            </View>
      </Modal>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <Modal
          visible={showUploadForm}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🎵 Subir Canción</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowUploadForm(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.uploadForm}>
              <Text style={styles.formLabel}>Nombre del Artista:</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ej: Juan Pérez"
                value={artistName}
                onChangeText={setArtistName}
              />
              
              <Text style={styles.formLabel}>Título de la Canción:</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ej: Mi Nueva Canción"
                value={songTitle}
                onChangeText={setSongTitle}
              />
              
              <Text style={styles.formLabel}>Archivo de Audio:</Text>
              <TouchableOpacity style={styles.fileButton}>
                <Text style={styles.fileButtonText}>📁 Seleccionar Archivo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleUploadSong}
              >
                <Text style={styles.uploadButtonText}>🚀 Subir a B2</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  centralButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  centralButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centralButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  uploadForm: {
    padding: 20,
  },
  formLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  formInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 10,
  },
  fileButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  fileButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    padding: 10,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  libraryButton: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 6,
  },
  setlistButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  ledSection: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mixerSection: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  transportControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  playButton: {
    backgroundColor: '#333',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  playButtonActive: {
    backgroundColor: '#4CAF50',
  },
  playButtonText: {
    fontSize: 24,
    color: '#fff',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  tempoControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tempoLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  keyLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setlistSection: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setlistContainer: {
    flex: 1,
  },
  emptySetlistText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  drawerText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
  },
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    width: '98%',
    height: '95%',
    borderRadius: 12,
    margin: 10,
  },
  sideModal: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '80%',
    backgroundColor: '#2a2a2a',
    borderLeftWidth: 2,
    borderLeftColor: '#2196F3',
  },
  libraryContent: {
    flex: 1,
    padding: 20,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  songItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  songTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  songDetails: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  downloadButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  setlistItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  setlistItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    flex: 1,
  },
  setlistTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  setlistDetails: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  libraryContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  libraryLeftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#444',
    paddingRight: 10,
  },
  libraryRightPanel: {
    flex: 1,
    paddingLeft: 10,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  setlistSelectorButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
    maxWidth: 150,
  },
  setlistSelectorButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createSetlistModal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
  },
  createSetlistContent: {
    marginTop: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  setlistNameInput: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  createSetlistButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  downloadedButton: {
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  downloadedButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  newSongsButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  trackProgressContainer: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    maxHeight: 200,
  },
  trackProgressTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  trackProgressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  trackName: {
    color: '#fff',
    fontSize: 12,
    width: 80,
    marginRight: 10,
  },
  trackProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#444',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  trackProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  trackProgressText: {
    color: '#fff',
    fontSize: 10,
    width: 35,
    textAlign: 'right',
  },
  logsButton: {
    backgroundColor: '#2a4a2a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  diagnosticButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  logsContent: {
    flex: 1,
    padding: 10,
  },
  logText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 5,
    lineHeight: 16,
  },
  refreshButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  newBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  setlistSongItem: {
    flexDirection: 'row',
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    alignItems: 'center',
  },
  setlistSongInfo: {
    flex: 1,
  },
  setlistSongTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  setlistSongArtist: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  setlistSongDetails: {
    color: '#666',
    fontSize: 12,
  },
  setlistSongActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playSetlistButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playSetlistButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeSetlistButton: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  removeSetlistButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newSongsContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  newSongsLeftPanel: {
    flex: 1,
    borderRightWidth: 2,
    borderRightColor: '#444',
    paddingRight: 15,
    marginRight: 15,
  },
  newSongsRightPanel: {
    flex: 1,
    paddingLeft: 15,
  },
  setlistSelectorItem: {
    marginBottom: 10,
  },
  setlistSelectorButton: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#2196F3',
    marginBottom: 10,
  },
  setlistSelectorButtonActive: {
    backgroundColor: '#2a4a2a',
    borderLeftColor: '#4CAF50',
  },
  setlistSelectorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  setlistSelectorDetails: {
    color: '#888',
    fontSize: 14,
    marginBottom: 6,
  },
  setlistSelectorActive: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptySetlistContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  addSongsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  addSongsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainScreen;
