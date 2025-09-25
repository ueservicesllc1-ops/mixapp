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
import { SafeAreaView } from 'react-native-safe-area-context';
// import DateTimePicker from '@react-native-community/datetimepicker';
// Drawer reemplazado por Modal nativo
import { useAuth } from '../components/AuthProvider';
import firestoreService, { Setlist, Song } from '../services/firestoreService';
// import DatabaseStatusIndicator from '../components/DatabaseStatusIndicator';
// import { useDatabaseStatus } from '../hooks/useDatabaseStatus';

const { width, height } = Dimensions.get('window');

const MainScreen: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('02:03');
  const [totalTime, setTotalTime] = useState('04:00');
  const [bpm, setBpm] = useState(128);
  const [key, setKey] = useState('C');
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [showLibraryDrawer, setShowLibraryDrawer] = useState(false);
  const [showSetlistDrawer, setShowSetlistDrawer] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [setlistName, setSetlistName] = useState('');
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loadingSetlists, setLoadingSetlists] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingSetlist, setEditingSetlist] = useState<Setlist | null>(null);
  const [editSetlistName, setEditSetlistName] = useState('');
  const [selectedSetlist, setSelectedSetlist] = useState<Setlist | null>(null);
  const [setlistSongs, setSetlistSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  
  // Hook de autenticación
  const { user, signOut } = useAuth();
  
  // Estado para verificar si el usuario está en Firestore
  const [userInFirestore, setUserInFirestore] = useState<boolean>(false);
  
  // Hook para monitorear el estado de las bases de datos
  // const { status: dbStatus, isLoading: dbLoading } = useDatabaseStatus();
  
  // Estado simulado para evitar errores
  const dbStatus = { firestore: true, b2: true };

  // Verificar si el usuario está en Firestore y cargar setlists
  useEffect(() => {
    const checkUserInFirestore = async () => {
      if (user) {
        try {
          const userProfile = await firestoreService.getUserProfile(user.uid);
          setUserInFirestore(!!userProfile);
          
          // Cargar setlists del usuario
          await loadUserSetlists();
        } catch (error) {
          console.error('Error verificando usuario en Firestore:', error);
          setUserInFirestore(false);
        }
      }
    };

    checkUserInFirestore();
  }, [user]);

  // Función para cargar setlists del usuario
  const loadUserSetlists = async () => {
    if (!user) return;
    
    try {
      setLoadingSetlists(true);
      const userSetlists = await firestoreService.getUserSetlists(user.uid);
      setSetlists(userSetlists);
    } catch (error) {
      console.error('Error cargando setlists:', error);
      Alert.alert('Error', 'No se pudieron cargar los setlists');
    } finally {
      setLoadingSetlists(false);
    }
  };

  // Función para cargar canciones de un setlist
  const loadSetlistSongs = async (setlistId: string) => {
    try {
      setLoadingSongs(true);
      const songs = await firestoreService.getSetlistSongs(setlistId);
      setSetlistSongs(songs);
    } catch (error) {
      console.error('Error cargando canciones del setlist:', error);
      Alert.alert('Error', 'No se pudieron cargar las canciones del setlist');
    } finally {
      setLoadingSongs(false);
    }
  };

  // Función para seleccionar un setlist
  const handleSelectSetlist = async (setlist: Setlist) => {
    setSelectedSetlist(setlist);
    await loadSetlistSongs(setlist.id);
    setShowSetlistDrawer(false); // Cerrar el drawer después de seleccionar
  };

  const tracks: Array<{ name: string; muted: boolean; solo: boolean; volume: number }> = [];

  const musicalKeys = ['Db', 'Eb', 'Gb', 'Ab', 'Bb', 'B', 'C', 'D', 'E', 'F', 'G', 'A'];

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (index: number) => {
    // Toggle mute logic here
  };

  const toggleSolo = (index: number) => {
    // Toggle solo logic here
  };

  const handleSignOut = async () => {
    try {
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que quieres cerrar sesión?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Cerrar Sesión',
            style: 'destructive',
            onPress: async () => {
              await signOut();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'Hubo un problema al cerrar sesión');
    }
  };

  const handleCreateSetlist = async () => {
    if (!setlistName.trim()) {
      Alert.alert('Error', 'Por favor completa el nombre del setlist');
      return;
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD
      await firestoreService.createSetlist({
        name: setlistName,
        date: currentDate, // Usar fecha actual automáticamente
        userId: user?.uid,
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert('Éxito', 'Setlist creado correctamente');
      setSetlistName('');
      setShowCreateForm(false);
      
      // Recargar la lista de setlists
      await loadUserSetlists();
    } catch (error) {
      console.error('Error al crear setlist:', error);
      Alert.alert('Error', 'No se pudo crear el setlist');
    }
  };

  const handleEditSetlist = (setlist: Setlist) => {
    setEditingSetlist(setlist);
    setEditSetlistName(setlist.name);
    setShowEditForm(true);
  };

  const handleUpdateSetlist = async () => {
    if (!editSetlistName.trim() || !editingSetlist) {
      Alert.alert('Error', 'Por favor completa el nombre del setlist');
      return;
    }

    try {
      await firestoreService.updateSetlist(editingSetlist.id, {
        name: editSetlistName,
      });
      
      Alert.alert('Éxito', 'Setlist actualizado correctamente');
      setEditSetlistName('');
      setEditingSetlist(null);
      setShowEditForm(false);
      
      // Recargar la lista de setlists
      await loadUserSetlists();
    } catch (error) {
      console.error('Error al actualizar setlist:', error);
      Alert.alert('Error', 'No se pudo actualizar el setlist');
    }
  };

  const handleDeleteSetlist = (setlist: Setlist) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que quieres eliminar el setlist "${setlist.name}"?`,
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
              await firestoreService.deleteSetlist(setlist.id);
              Alert.alert('Éxito', 'Setlist eliminado correctamente');
              
              // Recargar la lista de setlists
              await loadUserSetlists();
            } catch (error) {
              console.error('Error al eliminar setlist:', error);
              Alert.alert('Error', 'No se pudo eliminar el setlist');
            }
          },
        },
      ]
    );
  };


  return (
    <SafeAreaView style={styles.container}>
    {/* Modal para la biblioteca */}
    <Modal
      visible={showLibraryDrawer}
      animationType="slide"
      presentationStyle="overFullScreen"
      onRequestClose={() => setShowLibraryDrawer(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📚 Biblioteca de Audio</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLibraryDrawer(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.librarySection}>
              <Text style={styles.librarySectionTitle}>🎵 Canciones</Text>
              <View style={styles.libraryItem}>
                <Text style={styles.libraryItemIcon}>🎶</Text>
                <View style={styles.libraryItemInfo}>
                  <Text style={styles.libraryItemTitle}>Canción de Ejemplo</Text>
                  <Text style={styles.libraryItemSubtitle}>Artista • 120 BPM • C Mayor</Text>
                </View>
                <TouchableOpacity style={styles.libraryItemButton}>
                  <Text style={styles.libraryItemButtonText}>▶</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.librarySection}>
              <Text style={styles.librarySectionTitle}>🎛️ Proyectos</Text>
              <View style={styles.libraryItem}>
                <Text style={styles.libraryItemIcon}>🎚️</Text>
                <View style={styles.libraryItemInfo}>
                  <Text style={styles.libraryItemTitle}>Proyecto Demo</Text>
                  <Text style={styles.libraryItemSubtitle}>8 pistas • 128 BPM</Text>
                </View>
                <TouchableOpacity style={styles.libraryItemButton}>
                  <Text style={styles.libraryItemButtonText}>📂</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.librarySection}>
              <Text style={styles.librarySectionTitle}>🎼 Setlists</Text>
              <View style={styles.libraryItem}>
                <Text style={styles.libraryItemIcon}>📋</Text>
                <View style={styles.libraryItemInfo}>
                  <Text style={styles.libraryItemTitle}>Setlist Domingo</Text>
                  <Text style={styles.libraryItemSubtitle}>5 canciones</Text>
                </View>
                <TouchableOpacity style={styles.libraryItemButton}>
                  <Text style={styles.libraryItemButtonText}>📂</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.masterButton}>
            <Text style={styles.masterButtonText}>MASTER</Text>
            <View style={styles.masterIndicator} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <TouchableOpacity style={[styles.controlButton, styles.rewindButton]}>
            <Text style={styles.controlIcon}>⏮</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.playButton, isPlaying && styles.playButtonActive]} onPress={handlePlayPause}>
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.stopButton]}>
            <Text style={styles.controlIcon}>⏹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.forwardButton]}>
            <Text style={styles.controlIcon}>⏭</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.loopButton]}>
            <Text style={styles.controlIcon}>⟲</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, styles.shuffleButton]}>
            <Text style={styles.controlIcon}>⇄</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timeDisplay}>{currentTime} / {totalTime}</Text>
          <Text style={styles.bpmDisplay}>{bpm} BPM</Text>
          <Text style={styles.keyDisplay}>{key}</Text>
          
          {/* Información del usuario */}
          {user && (
            <TouchableOpacity style={styles.userContainer} onPress={handleSignOut}>
              <View style={styles.userInfo}>
                {user.photoURL && (
                  <Image source={{ uri: user.photoURL }} style={styles.userAvatar} />
                )}
                <View style={styles.userDetails}>
                  <View style={styles.userNameContainer}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {user.displayName || 'Usuario'}
                    </Text>
                    {userInFirestore && (
                      <View style={styles.firestoreIndicator}>
                        <Text style={styles.firestoreIcon}>☁️</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutIcon}>🚪</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.midiButton}>
            <Text style={styles.midiText}>MIDI IN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.midiButton}>
            <Text style={styles.midiText}>OUTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Tracks Section */}
        <View style={styles.tracksSection}>
          {/* Simple Display Section */}
          <View style={styles.simpleDisplaySection}>
            <View style={styles.simpleDisplay}>
              {/* Song Info */}
              <View style={styles.songInfoSection}>
                <View style={styles.albumArtContainer}>
                  <View style={styles.albumArt}>
                    <Text style={styles.albumArtText}>🎵</Text>
                  </View>
                </View>
                <View style={styles.songDetails}>
                  <Text style={styles.songTitle}>
                    {selectedSetlist ? selectedSetlist.name : 'Sin setlist seleccionado'}
                  </Text>
                  <Text style={styles.songArtist}>
                    {selectedSetlist ? `${setlistSongs.length} canciones` : 'Selecciona un setlist'}
                  </Text>
                  <Text style={styles.songBpm}>{bpm} BPM</Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '50%' }]} />
                  <View style={styles.progressThumb} />
                </View>
                <View style={styles.timeInfo}>
                  <Text style={styles.timeText}>{currentTime}</Text>
                  <Text style={styles.timeText}>{totalTime}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.tracksGrid}>
            {tracks.map((track, index) => (
              <View key={index} style={styles.trackContainer}>
                <Text style={styles.trackName}>{track.name}</Text>
                <View style={styles.professionalFaderContainer}>
                  {/* dB Scale */}
                  <View style={styles.dbScale}>
                    <Text style={styles.dbText}>+6</Text>
                    <Text style={styles.dbText}>+3</Text>
                    <Text style={styles.dbText}>0</Text>
                    <Text style={styles.dbText}>-3</Text>
                    <Text style={styles.dbText}>-6</Text>
                    <Text style={styles.dbText}>-12</Text>
                    <Text style={styles.dbText}>-∞</Text>
                  </View>
                  
                  {/* Fader Track */}
                  <View style={styles.faderTrack}>
                    <View style={styles.faderTrackLine} />
                    
                    {/* Fader Thumb */}
                    <View style={[styles.faderThumb, { 
                      bottom: `${(track.volume * 100)}%`,
                      backgroundColor: track.muted ? '#666' : '#4CAF50'
                    }]}>
                      {/* Blue indicator light */}
                      <View style={[styles.indicatorLight, { 
                        backgroundColor: track.muted ? '#333' : '#00aaff' 
                      }]} />
                    </View>
                  </View>
                  
                  {/* Current dB Value */}
                  <View style={styles.dbValueContainer}>
                    <Text style={styles.dbValue}>
                      {track.muted ? '-∞' : `${Math.round((track.volume - 0.5) * 24)}dB`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.trackControls}>
                  <TouchableOpacity 
                    style={[styles.trackButton, track.muted && styles.mutedButton]}
                    onPress={() => toggleMute(index)}
                  >
                    <Text style={styles.trackButtonText}>M</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.trackButton, track.solo && styles.soloButton]}
                    onPress={() => toggleSolo(index)}
                  >
                    <Text style={styles.trackButtonText}>S</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Right Panel */}
        <View style={styles.ledScreen}>
          {/* Song List - 70% of area */}
          <View style={styles.songListSection}>
            <View style={styles.ledMarquee}>
              <Text style={styles.ledMarqueeText}>
                {selectedSetlist ? selectedSetlist.name.toUpperCase() : 'SETLIST'}
              </Text>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.setlistButton}
                onPress={() => {
                  console.log('Botón Setlist presionado - FUNCIONA!');
                  setShowSetlistDrawer(true);
                }}
              >
                <Text style={styles.setlistButtonText}>Setlist</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.setlistButton}>
                <Text style={styles.setlistButtonText}>Edit Setlist</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.songList}>
              {loadingSongs ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Cargando canciones...</Text>
                </View>
              ) : setlistSongs.length > 0 ? (
                setlistSongs.map((song, index) => (
                  <View key={song.id} style={styles.songItem}>
                    <Text style={styles.songNumber}>{index + 1}</Text>
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle}>{song.title}</Text>
                      <Text style={styles.songArtist}>{song.artist}</Text>
                    </View>
                    <View style={styles.songMeta}>
                      <Text style={styles.songKey}>{song.key}</Text>
                      <Text style={styles.songBpm}>{song.bpm} BPM</Text>
                    </View>
                  </View>
                ))
              ) : selectedSetlist ? (
                <View style={styles.emptySongList}>
                  <Text style={styles.emptySongListText}>No hay canciones en este setlist</Text>
                  <Text style={styles.emptySongListSubtext}>Agrega canciones desde la biblioteca</Text>
                </View>
              ) : (
                <View style={styles.emptySongList}>
                  <Text style={styles.emptySongListText}>Selecciona un setlist</Text>
                  <Text style={styles.emptySongListSubtext}>Elige un setlist para ver sus canciones</Text>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.libraryButton}>
              <Text style={styles.libraryButtonText}>Biblioteca</Text>
            </TouchableOpacity>
          </View>
          
          {/* Button Grid - 30% of area */}
          <View style={styles.buttonGridSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>2</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>3</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>4</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>5</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>6</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>7</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>8</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>9</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.gridButton}>
                <Text style={styles.gridButtonText}>10</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Setlist Drawer */}
      <Modal
        visible={showSetlistDrawer}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSetlistDrawer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.setlistDrawer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Setlist</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSetlistDrawer(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.setlistContent}>
              <TouchableOpacity 
                style={styles.createSetlistButton}
                onPress={() => setShowCreateForm(true)}
              >
                <Text style={styles.createSetlistButtonText}>Crear Setlist</Text>
              </TouchableOpacity>
              
              {/* Lista de Setlists */}
              <View style={styles.setlistsList}>
                <Text style={styles.setlistsTitle}>Mis Setlists</Text>
                {loadingSetlists ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Cargando setlists...</Text>
                  </View>
                ) : setlists.length > 0 ? (
                  <ScrollView style={styles.setlistsScroll}>
                    {setlists.map((setlist) => (
                      <View key={setlist.id} style={styles.setlistItem}>
                        <TouchableOpacity 
                          style={styles.setlistItemContent}
                          onPress={() => handleSelectSetlist(setlist)}
                        >
                          <View style={styles.setlistItemInfo}>
                            <Text style={styles.setlistItemText}>{setlist.name}</Text>
                            <Text style={styles.setlistItemDate}>{setlist.date}</Text>
                          </View>
                        </TouchableOpacity>
                        <View style={styles.setlistItemActions}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEditSetlist(setlist)}
                          >
                            <Text style={styles.actionButtonText}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={() => handleDeleteSetlist(setlist)}
                          >
                            <Text style={styles.actionButtonText}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.emptySetlists}>
                    <Text style={styles.emptySetlistsText}>No tienes setlists creados</Text>
                    <Text style={styles.emptySetlistsSubtext}>Crea tu primer setlist</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para crear setlist */}
      <Modal
        visible={showCreateForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createFormContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Crear Setlist</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowCreateForm(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Setlist</Text>
                <TextInput
                  style={styles.textInput}
                  value={setlistName}
                  onChangeText={setSetlistName}
                  placeholder="Ej: Servicio Dominical"
                  placeholderTextColor="#888"
                />
              </View>
              
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleCreateSetlist}
              >
                <Text style={styles.saveButtonText}>Guardar Setlist</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para editar setlist */}
      <Modal
        visible={showEditForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.createFormContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Setlist</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setShowEditForm(false);
                  setEditingSetlist(null);
                  setEditSetlistName('');
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del Setlist</Text>
                <TextInput
                  style={styles.textInput}
                  value={editSetlistName}
                  onChangeText={setEditSetlistName}
                  placeholder="Ej: Servicio Dominical"
                  placeholderTextColor="#888"
                />
              </View>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleUpdateSetlist}
              >
                <Text style={styles.saveButtonText}>Actualizar Setlist</Text>
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
    paddingHorizontal: 15,
    paddingVertical: 6,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    flex: 1,
  },
  masterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
  },
  masterButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 8,
    marginRight: 4,
  },
  masterIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'center',
  },
  controlButton: {
    marginHorizontal: 6,
    width: 40,
    height: 40,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
    // Efecto metal pulido aluminio
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    // Gradiente simulado con múltiples bordes
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  playButton: {
    marginHorizontal: 8,
    width: 50,
    height: 50,
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 6,
    // Efecto metal pulido aluminio con LED verde
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    // Gradiente simulado con múltiples bordes
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  controlIcon: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  playIcon: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  timeDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  bpmDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  keyDisplay: {
    color: '#fff',
    fontSize: 8,
    marginRight: 6,
  },
  midiButton: {
    backgroundColor: '#333',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 2,
  },
  midiText: {
    color: '#fff',
    fontSize: 6,
  },
  settingsButton: {
    padding: 4,
  },
  settingsIcon: {
    fontSize: 12,
    color: '#fff',
  },
  dbStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  // LED Button Styles - Metal pulido con LED
  playButtonActive: {
    borderColor: '#00ff00',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#00ff00',
    shadowOpacity: 1,
    shadowRadius: 15,
    backgroundColor: '#F0F8F0',
  },
  stopButton: {
    borderColor: '#ff0000',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff0000',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    backgroundColor: '#F8F0F0',
  },
  rewindButton: {
    borderColor: '#ff8800',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff8800',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F8F4F0',
  },
  forwardButton: {
    borderColor: '#ff8800',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#ff8800',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F8F4F0',
  },
  loopButton: {
    borderColor: '#0088ff',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#0088ff',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F0F4F8',
  },
  shuffleButton: {
    borderColor: '#8800ff',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderRightColor: '#C0C0C0',
    borderBottomColor: '#C0C0C0',
    shadowColor: '#8800ff',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    backgroundColor: '#F4F0F8',
  },
  simpleDisplaySection: {
    backgroundColor: '#0a0a0a',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  simpleDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
  },
  songInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  albumArtContainer: {
    marginRight: 15,
  },
  albumArt: {
    width: 60,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#555',
  },
  albumArtText: {
    fontSize: 24,
    color: '#888',
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  songArtist: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  songBpm: {
    color: '#00aaff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressSection: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 3,
  },
  progressThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 6,
    top: -3,
    left: '50%',
    transform: [{ translateX: -6 }],
    borderWidth: 2,
    borderColor: '#00aaff',
  },
  timeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  advancedDisplay: {
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  headerText: {
    color: '#00aaff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  subHeaderText: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerValue: {
    color: '#00ff00',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  headerLabel: {
    color: '#888',
    fontSize: 10,
  },
  graphSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  graphContainer: {
    flex: 2,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  graphLabel: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  graphArea: {
    height: 60,
    backgroundColor: '#000',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 6,
  },
  waveformLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#00aaff',
    width: '100%',
    top: '50%',
    borderRadius: 1,
  },
  waveformLine2: {
    backgroundColor: '#ff8800',
    top: '30%',
    width: '80%',
  },
  waveformLine3: {
    backgroundColor: '#00ff00',
    top: '70%',
    width: '60%',
  },
  graphControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  graphButton: {
    backgroundColor: '#00aaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  graphButtonText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  graphPercentage: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  controlSection: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlValue: {
    color: '#ff8800',
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 8,
  },
  playButton: {
    backgroundColor: '#00ff00',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playIcon: {
    fontSize: 12,
    color: '#000',
  },
  controlText: {
    color: '#888',
    fontSize: 8,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlBtn: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 2,
    marginRight: 4,
  },
  controlBtnText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  controlLabel: {
    color: '#888',
    fontSize: 8,
    marginLeft: 8,
  },
  bottomGraphSection: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bottomGraph: {
    flex: 2,
    backgroundColor: '#0f0f0f',
    borderRadius: 4,
    padding: 8,
    marginRight: 8,
  },
  bottomGraphLabel: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  spectrumArea: {
    height: 40,
    backgroundColor: '#000',
    borderRadius: 2,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  spectrumBar: {
    width: 6,
    backgroundColor: '#00ff00',
    borderRadius: 1,
  },
  spectrumLabel: {
    color: '#888',
    fontSize: 8,
  },
  sliderSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderTrack: {
    width: 4,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 2,
    position: 'relative',
    marginBottom: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#00aaff',
    borderRadius: 4,
    left: -2,
  },
  sliderLabel: {
    color: '#888',
    fontSize: 8,
  },
  bottomControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  bottomButton: {
    backgroundColor: '#00aaff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    flex: 1,
    marginHorizontal: 2,
  },
  bottomButtonText: {
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  tracksSection: {
    flex: 7, // 70% del ancho
    padding: 15,
  },
  tracksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  trackContainer: {
    width: '18%',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginBottom: 10,
  },
  professionalFaderContainer: {
    height: 120,
    width: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dbScale: {
    height: '100%',
    width: 12,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 2,
  },
  dbText: {
    color: '#888',
    fontSize: 8,
    fontWeight: 'bold',
  },
  faderTrack: {
    height: '100%',
    width: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    position: 'relative',
    marginHorizontal: 4,
  },
  faderTrackLine: {
    position: 'absolute',
    left: 1,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#444',
    borderRadius: 1,
  },
  faderThumb: {
    position: 'absolute',
    width: 12,
    height: 16,
    borderRadius: 6,
    left: -4,
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorLight: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: '#00aaff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  dbValueContainer: {
    height: '100%',
    width: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dbValue: {
    color: '#00aaff',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    transform: [{ rotate: '-90deg' }],
  },
  trackControls: {
    flexDirection: 'row',
  },
  trackButton: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  mutedButton: {
    backgroundColor: '#f44336',
  },
  soloButton: {
    backgroundColor: '#ff9800',
  },
  trackButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rightPanel: {
    flex: 3, // 30% del ancho
    backgroundColor: '#2a2a2a',
    padding: 15,
  },
  setlistSection: {
    marginBottom: 20,
  },
  setlistHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  syncButton: {
    backgroundColor: '#2196F3',
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  setlistTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  setlistContainer: {
    maxHeight: 200,
  },
  songItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 5,
  },
  selectedSong: {
    backgroundColor: '#2196F3',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  songNumber: {
    color: '#888',
    fontSize: 12,
    marginRight: 10,
  },
  songDetails: {
    flex: 1,
  },
  songTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songArtist: {
    color: '#888',
    fontSize: 10,
  },
  songMenu: {
    color: '#888',
    fontSize: 16,
  },
  songMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  songKey: {
    color: '#fff',
    fontSize: 10,
    marginRight: 10,
  },
  songBpm: {
    color: '#fff',
    fontSize: 10,
    marginRight: 10,
  },
  songPlay: {
    fontSize: 12,
  },
  librarySection: {
    flex: 1,
  },
  libraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  libraryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  editButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#333',
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 10,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 6,
    marginBottom: 15,
  },
  libraryIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#fff',
  },
  libraryInfo: {
    flex: 1,
  },
  libraryName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  librarySource: {
    color: '#888',
    fontSize: 10,
  },
  keySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  keyButton: {
    width: '16%',
    aspectRatio: 1,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: '1%',
  },
  selectedKey: {
    backgroundColor: '#4CAF50',
  },
  keyButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  libraryVolume: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  libraryFaderContainer: {
    height: 80,
    width: 20,
    backgroundColor: '#333',
    borderRadius: 10,
    justifyContent: 'flex-end',
    marginRight: 10,
  },
  libraryFader: {
    backgroundColor: '#87CEEB',
    width: '100%',
    borderRadius: 10,
  },
  libraryControls: {
    flexDirection: 'row',
  },
  libraryButton: {
    width: 20,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  libraryButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Estilos para el componente de usuario
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
    maxWidth: 200,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  userDetails: {
    flex: 1,
    minWidth: 0,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    flex: 1,
  },
  userEmail: {
    color: '#888',
    fontSize: 8,
  },
  firestoreIndicator: {
    marginLeft: 4,
    padding: 1,
  },
  firestoreIcon: {
    fontSize: 8,
  },
  signOutButton: {
    marginLeft: 4,
    padding: 2,
  },
  signOutIcon: {
    fontSize: 12,
  },
  // Estilos para el botón de biblioteca
  libraryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 100,
  },
  libraryButtonText: {
    fontSize: 16,
    marginRight: 6,
  },
  libraryButtonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Estilos para el modal de biblioteca
  drawerContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    width: width * 0.8, // 80% del ancho de la pantalla
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
  },
  drawerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: '#333',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    padding: 20,
  },
  librarySection: {
    marginBottom: 25,
  },
  librarySectionTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  libraryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  libraryItemIcon: {
    fontSize: 24,
    marginRight: 15,
  },
  libraryItemInfo: {
    flex: 1,
  },
  libraryItemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  libraryItemSubtitle: {
    color: '#888',
    fontSize: 12,
  },
  libraryItemButton: {
    backgroundColor: '#4CAF50',
    width: 35,
    height: 35,
    borderRadius: 17.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  libraryItemButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Estilos para Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 0,
    width: '90%',
    height: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#2a2a2a',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },

  // Estilos para Pantalla LED
  ledScreen: {
    flex: 2.6,
    backgroundColor: '#000',
    borderWidth: 3,
    borderColor: '#333',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  ledDisplay: {
    flex: 3,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  ledTopModule: {
    flex: 7,
    backgroundColor: '#020b02',
    borderBottomWidth: 2,
    borderBottomColor: '#0a3a0a',
  },
  ledTopBezel: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#0f0',
    backgroundColor: '#001900',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledTopTitle: {
    color: '#00ff66',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  ledMatrix: {
    backgroundColor: '#111',
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  ledRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  ledPixel: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 3,
    elevation: 2,
  },
  ledRed: {
    backgroundColor: '#ff0040',
    shadowColor: '#ff0040',
    shadowOpacity: 1,
  },
  ledGreen: {
    backgroundColor: '#00ff40',
    shadowColor: '#00ff40',
    shadowOpacity: 1,
  },
  ledBlue: {
    backgroundColor: '#0040ff',
    shadowColor: '#0040ff',
    shadowOpacity: 1,
  },
  ledStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#333',
    marginTop: 20,
  },
  ledStatusIndicator: {
    alignItems: 'center',
    minWidth: 50,
  },
  ledStatusText: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  ledStatusValue: {
    color: '#00ff00',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Estilos para las nuevas secciones
  songListSection: {
    flex: 7,
    backgroundColor: '#2a2a2a',
    padding: 15,
  },
  ledMarquee: {
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#00ff00',
    borderRadius: 4,
    padding: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  ledMarqueeText: {
    color: '#00ff00',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  setlistButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
  },
  setlistButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  libraryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  libraryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  songList: {
    flex: 1,
  },
  songItem: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  songNumber: {
    color: '#888',
    fontSize: 12,
    marginRight: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  songInfo: {
    flex: 1,
    marginRight: 10,
  },
  songTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  songArtist: {
    color: '#888',
    fontSize: 10,
  },
  songMeta: {
    alignItems: 'flex-end',
  },
  songKey: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  songBpm: {
    color: '#00aaff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  buttonGridSection: {
    flex: 3,
    backgroundColor: '#1a1a1a',
    padding: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  gridButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  setlistDrawer: {
    width: '42%',
    height: '100%',
    backgroundColor: '#2a2a2a',
    borderLeftWidth: 2,
    borderLeftColor: '#00ff00',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    backgroundColor: '#333',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setlistContent: {
    flex: 1,
    padding: 20,
  },
  setlistItem: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  setlistItemText: {
    color: '#fff',
    fontSize: 14,
  },
  createSetlistButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 50,
  },
  createSetlistButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createFormContainer: {
    width: '28%',
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#00ff00',
  },
  formContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#555',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#00ff00',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Estilos para la lista de setlists
  setlistsList: {
    flex: 1,
    marginTop: 20,
  },
  setlistsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  setlistsScroll: {
    flex: 1,
  },
  setlistItem: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#555',
    flexDirection: 'row',
    alignItems: 'center',
  },
  setlistItemContent: {
    flex: 1,
    padding: 15,
  },
  setlistItemInfo: {
    flex: 1,
  },
  setlistItemText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  setlistItemDate: {
    color: '#888',
    fontSize: 12,
  },
  setlistItemActions: {
    flexDirection: 'row',
    paddingRight: 10,
  },
  actionButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  actionButtonText: {
    fontSize: 16,
  },
  emptySetlists: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySetlistsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySetlistsSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
  },
  // Estilos para lista de canciones vacía
  emptySongList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySongListText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 5,
  },
  emptySongListSubtext: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MainScreen;