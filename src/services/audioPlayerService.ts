/**
 * AudioPlayerService - Service for managing audio playback
 * 
 * @format
 */

import Sound from 'react-native-sound';

// Configurar Sound
Sound.setCategory('Playback');

export interface AudioTrack {
  id: string;
  name: string;
  fileUrl: string;
  localPath?: string;
  volume?: number;
  muted?: boolean;
  solo?: boolean;
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  tracks?: AudioTrack[];
  [key: string]: any;
}

class AudioPlayerService {
  private sounds: Map<string, Sound> = new Map();
  private currentSong: Song | null = null;
  private playbackUpdateCallback?: (currentTime: number, duration: number) => void;
  private playbackInterval?: NodeJS.Timeout;

  // Cargar una canción y sus tracks
  async loadSong(song: Song): Promise<void> {
    console.log('🎵 Cargando canción:', song.title);
    console.log('🎵 ID de la canción:', song.id);
    console.log('🎵 Datos completos de Firebase:', JSON.stringify(song, null, 2));
    
    // Limpiar sonidos anteriores
    this.clearSounds();
    this.currentSong = null;
    
    // Buscar tracks en almacenamiento local del emulador
    console.log('🔍 Buscando tracks en almacenamiento local...');
    const tracks = await this.findTracksInDownloads(song);
    
    if (tracks.length === 0) {
      throw new Error('No se encontraron tracks para esta canción en almacenamiento local');
    }
    
    this.currentSong = {
      ...song,
      tracks: tracks
    };
    
    console.log('🎵 Canción actualizada con tracks locales:', this.currentSong.title);
    await this.loadTracks(tracks);
  }

  // Cargar tracks individuales
  private async loadTracks(tracks: AudioTrack[]): Promise<void> {
    console.log('🎵 Cargando tracks:', tracks.length);
    
    const loadPromises = tracks.map(async (track, index) => {
      try {
        console.log(`🎵 Cargando track ${index + 1}:`, track.name);
        console.log(`📁 Ruta del archivo:`, track.fileUrl);
        
        console.log(`🎵 Intentando cargar track ${track.name} desde:`, track.fileUrl);
        
        const sound = new Sound(track.fileUrl, '', (error) => {
          if (error) {
            console.error(`❌ Error cargando track ${track.name}:`, error);
            console.error(`❌ URL que falló:`, track.fileUrl);
          } else {
            console.log(`✅ Track ${track.name} cargado exitosamente`);
            console.log(`🎵 Sound object creado para ${track.id}:`, !!sound);
          }
        });
        
        this.sounds.set(track.id, sound);
        console.log(`🎵 Sound agregado al Map con ID: ${track.id}`);
      } catch (error) {
        console.error(`❌ Error creando sound para track ${track.name}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
    
    console.log('✅ Canción cargada exitosamente');
    console.log('🎵 Total sounds en Map:', this.sounds.size);
    console.log('🎵 Keys en Map:', Array.from(this.sounds.keys()));
  }

  // Buscar tracks en la ruta de Downloads
  private async findTracksInDownloads(song: Song): Promise<AudioTrack[]> {
    const RNFS = require('react-native-fs');
    
    console.log('🔍 Buscando tracks específicos para:', song.title);
    console.log('🎵 ID de la canción:', song.id);
    console.log('🎵 Artista:', song.artist);
    
    // Buscar en la carpeta principal de Downloads
    const downloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
    console.log('📁 Buscando en:', downloadsPath);
    
    // Buscar en cada ruta posible
    for (let i = 0; i < possiblePaths.length; i++) {
      const currentPath = possiblePaths[i];
      console.log(`🔍 Revisando ruta ${i + 1}:`, currentPath);
      
      try {
        const pathExists = await RNFS.exists(currentPath);
        if (!pathExists) {
          console.log(`❌ Ruta ${i + 1} no existe:`, currentPath);
          continue;
        }
        
        console.log(`✅ Ruta ${i + 1} existe, leyendo contenido...`);
        const files = await RNFS.readDir(currentPath);
        console.log(`📁 Archivos en ruta ${i + 1}:`, files.map(f => f.name));
        
        // Buscar archivos de audio directamente en esta ruta
        const audioFiles = files.filter(file => 
          file.isFile() && 
          (file.name.endsWith('.wav') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a'))
        );
        
        if (audioFiles.length > 0) {
          console.log(`🎵 Encontrados ${audioFiles.length} archivos de audio en ruta ${i + 1}`);
          console.log('🎵 Archivos de audio:', audioFiles.map(f => f.name));
          
          // Verificar si los archivos coinciden con la canción seleccionada
          const songTitle = song.title.toLowerCase();
          console.log(`🔍 Buscando archivos que coincidan con: "${songTitle}"`);
          
          const matchingFiles = audioFiles.filter(file => {
            const fileName = file.name.toLowerCase();
            const matches = fileName.includes(songTitle) || 
                           (songTitle.includes('buenos') && fileName.includes('buenos')) ||
                           (songTitle.includes('es') && fileName.includes('es'));
            
            console.log(`📁 Archivo: ${file.name} - Coincide: ${matches}`);
            return matches;
          });
          
          if (matchingFiles.length > 0) {
            console.log(`🎵 Archivos que coinciden con "${song.title}":`, matchingFiles.map(f => f.name));
            
            // Verificar que realmente son tracks de la canción correcta
            const validTracks = matchingFiles.filter(file => {
              const fileName = file.name.toLowerCase();
              // Solo aceptar archivos que claramente pertenezcan a "Buenos es"
              return fileName.includes('buenos') || 
                     fileName.includes('es') ||
                     fileName.includes('track') ||
                     fileName.includes('instrumental') ||
                     fileName.includes('vocal');
            });
            
            if (validTracks.length > 0) {
              console.log(`✅ Archivos válidos para "${song.title}":`, validTracks.map(f => f.name));
              
              // Crear objetos AudioTrack solo con archivos válidos
              const tracks: AudioTrack[] = validTracks.map((audioFile, index) => ({
                id: `track_${index}`,
                name: audioFile.name.replace(/\.[^/.]+$/, ''), // Remover extensión
                fileUrl: audioFile.path,
                localPath: audioFile.path,
                volume: 50,
                muted: false
              }));
              
              console.log('✅ Tracks creados para canción específica:', tracks.length);
              return tracks;
            } else {
              console.log(`⚠️ No se encontraron archivos válidos para "${song.title}"`);
            }
          } else {
            console.log(`⚠️ No se encontraron archivos que coincidan con "${song.title}"`);
          }
        }
        
        // Si no hay archivos de audio directamente, buscar en subcarpetas
        const directories = files.filter(file => file.isDirectory());
        console.log(`📁 Subcarpetas encontradas en ruta ${i + 1}:`, directories.map(f => f.name));
        
        for (const directory of directories) {
          console.log(`📁 Revisando subcarpeta:`, directory.name);
          try {
            const subFiles = await RNFS.readDir(directory.path);
            const subAudioFiles = subFiles.filter(file => 
              file.isFile() && 
              (file.name.endsWith('.wav') || file.name.endsWith('.mp3') || file.name.endsWith('.m4a'))
            );
            
            if (subAudioFiles.length > 0) {
              console.log(`🎵 Encontrados ${subAudioFiles.length} archivos de audio en subcarpeta:`, directory.name);
              console.log('🎵 Archivos de audio:', subAudioFiles.map(f => f.name));
              
              // Crear objetos AudioTrack
              const tracks: AudioTrack[] = subAudioFiles.map((audioFile, index) => ({
                id: `track_${index}`,
                name: audioFile.name.replace(/\.[^/.]+$/, ''), // Remover extensión
                fileUrl: audioFile.path,
                localPath: audioFile.path,
                volume: 50,
                muted: false
              }));
              
              console.log('✅ Tracks creados desde subcarpeta:', tracks.length);
              return tracks;
            }
          } catch (subError) {
            console.log('⚠️ Error leyendo subcarpeta:', directory.name, subError);
          }
        }
        
      } catch (pathError) {
        console.log(`❌ Error accediendo a ruta ${i + 1}:`, pathError);
      }
    }
    
    console.log('❌ No se encontraron archivos de audio en ninguna ruta');
    console.log('⚠️ IMPORTANTE: No se cargarán archivos incorrectos para evitar reproducir canciones equivocadas');
    return [];
  }

  // Reproducir
  play(): void {
    console.log('▶️ Reproduciendo...');
    console.log('🎵 Canción actual:', this.currentSong?.title);
    console.log('🎵 Número de sounds cargados:', this.sounds.size);
    console.log('🎵 Sounds disponibles:', Array.from(this.sounds.keys()));
    
    if (!this.currentSong) {
      console.log('❌ No hay canción cargada');
      return;
    }
    
    this.sounds.forEach((sound, trackId) => {
      if (sound) {
        console.log(`🎵 Reproduciendo track: ${trackId} de la canción: ${this.currentSong?.title}`);
        sound.play((success) => {
          if (success) {
            console.log(`✅ Track ${trackId} reproducido exitosamente`);
          } else {
            console.log(`❌ Error reproduciendo track ${trackId}`);
          }
        });
      } else {
        console.log(`❌ Sound no disponible para track: ${trackId}`);
      }
    });
    
    this.startPlaybackUpdates();
  }

  // Pausar
  pause(): void {
    console.log('⏸️ Pausando...');
    this.sounds.forEach((sound) => {
      if (sound) {
        sound.pause();
      }
    });
    this.stopPlaybackUpdates();
  }

  // Reanudar
  resume(): void {
    console.log('▶️ Reanudando...');
    this.sounds.forEach((sound) => {
      if (sound) {
        sound.play();
      }
    });
    this.startPlaybackUpdates();
  }

  // Detener
  stop(): void {
    console.log('⏹️ Deteniendo...');
    this.sounds.forEach((sound) => {
      if (sound) {
        sound.stop();
      }
    });
    this.stopPlaybackUpdates();
  }

  // Cambiar volumen de un track
  setTrackVolume(trackId: string, volume: number): void {
    const sound = this.sounds.get(trackId);
    if (sound) {
      sound.setVolume(volume / 100);
      console.log(`🎚️ Volumen del track ${trackId} cambiado a:`, volume);
    }
  }

  // Silenciar/unmute un track
  setTrackMuted(trackId: string, muted: boolean): void {
    const sound = this.sounds.get(trackId);
    if (sound) {
      sound.setVolume(muted ? 0 : 0.5);
      console.log(`🔇 Track ${trackId} ${muted ? 'silenciado' : 'activado'}`);
    }
  }

  // Solo un track
  setTrackSolo(trackId: string, solo: boolean): void {
    if (solo) {
      // Silenciar todos los otros tracks
      this.sounds.forEach((sound, id) => {
        if (id !== trackId) {
          sound.setVolume(0);
        }
      });
      // Activar el track seleccionado
      const sound = this.sounds.get(trackId);
      if (sound) {
        sound.setVolume(0.5);
      }
    } else {
      // Restaurar volúmenes normales
      this.sounds.forEach((sound) => {
        sound.setVolume(0.5);
      });
    }
    console.log(`🎯 Track ${trackId} ${solo ? 'en solo' : 'solo desactivado'}`);
  }

  // Reproducir un track individual
  playTrack(trackId: string): void {
    console.log(`🎵 Reproduciendo track individual: ${trackId}`);
    
    const sound = this.sounds.get(trackId);
    if (sound) {
      console.log(`🎵 Sound encontrado para track: ${trackId}`);
      sound.play((success) => {
        if (success) {
          console.log(`✅ Track ${trackId} reproducido exitosamente`);
        } else {
          console.log(`❌ Error reproduciendo track ${trackId}`);
        }
      });
    } else {
      console.log(`❌ Sound no encontrado para track: ${trackId}`);
    }
  }

  // Obtener canción actual
  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  // Configurar callback de actualización de reproducción
  setPlaybackUpdateCallback(callback: (currentTime: number, duration: number) => void): void {
    this.playbackUpdateCallback = callback;
  }

  // Iniciar actualizaciones de reproducción
  private startPlaybackUpdates(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
    }
    
    this.playbackInterval = setInterval(() => {
      if (this.playbackUpdateCallback && this.sounds.size > 0) {
        // Usar el primer sound para obtener el tiempo
        const firstSound = Array.from(this.sounds.values())[0];
        if (firstSound) {
          firstSound.getCurrentTime((currentTime) => {
            firstSound.getDuration((duration) => {
              this.playbackUpdateCallback!(currentTime, duration);
            });
          });
        }
      }
    }, 1000);
  }

  // Detener actualizaciones de reproducción
  private stopPlaybackUpdates(): void {
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = undefined;
    }
  }

  // Limpiar sonidos
  private clearSounds(): void {
    this.sounds.forEach((sound) => {
      if (sound) {
        sound.release();
      }
    });
    this.sounds.clear();
  }

  // Obtener la canción actual
  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  // Limpiar recursos
  cleanup(): void {
    this.stop();
    this.clearSounds();
    this.currentSong = null;
    this.playbackUpdateCallback = undefined;
  }
}

export default new AudioPlayerService();
