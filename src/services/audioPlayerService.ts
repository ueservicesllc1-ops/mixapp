/**
 * AudioPlayerService - Servicio para manejar la reproducción de audio
 * 
 * @format
 */

import Sound from 'react-native-sound';

// Configurar react-native-sound
Sound.setCategory('Playback');

interface AudioTrack {
  id: string;
  name: string;
  fileUrl: string;
  localPath?: string;
  volume?: number;
  muted?: boolean;
}

interface Song {
  id: string;
  title: string;
  artist?: string;
  bpm?: number;
  key?: string;
  tracks: AudioTrack[];
  localPath?: string;
}

class AudioPlayerService {
  private sounds: Map<string, Sound> = new Map();
  private currentSong: Song | null = null;
  private isPlaying: boolean = false;
  private onPlaybackUpdate?: (currentTime: number, duration: number) => void;
  private playbackTimer?: NodeJS.Timeout;

  // Configurar callback para actualizaciones de reproducción
  setPlaybackUpdateCallback(callback: (currentTime: number, duration: number) => void) {
    this.onPlaybackUpdate = callback;
  }

  // Cargar una canción con sus tracks
  async loadSong(song: Song): Promise<void> {
    console.log('🎵 Cargando canción:', song.title);
    
    // Limpiar sonidos anteriores
    this.stop();
    this.clearSounds();
    
    this.currentSong = song;
    
    // Cargar cada track de la canción
    const loadPromises = song.tracks.map(track => this.loadTrack(track));
    await Promise.all(loadPromises);
    
    console.log('✅ Canción cargada exitosamente');
  }

  // Cargar un track individual
  private async loadTrack(track: AudioTrack): Promise<void> {
    return new Promise((resolve, reject) => {
      const soundPath = track.localPath || track.fileUrl;
      
      const sound = new Sound(soundPath, '', (error) => {
        if (error) {
          console.error('❌ Error cargando track:', track.name, error);
          reject(error);
          return;
        }
        
        console.log('✅ Track cargado:', track.name);
        this.sounds.set(track.id, sound);
        resolve();
      });
    });
  }

  // Reproducir todos los tracks sincronizados
  async play(): Promise<void> {
    if (!this.currentSong) {
      throw new Error('No hay canción cargada');
    }

    console.log('▶️ Iniciando reproducción de:', this.currentSong.title);
    
    // Reproducir todos los tracks sincronizados
    const playPromises = Array.from(this.sounds.entries()).map(([trackId, sound]) => {
      return new Promise<void>((resolve, reject) => {
        sound.play((success) => {
          if (success) {
            console.log('✅ Track reproducido:', trackId);
            resolve();
          } else {
            console.error('❌ Error reproduciendo track:', trackId);
            reject(new Error(`Error reproduciendo track ${trackId}`));
          }
        });
      });
    });

    try {
      await Promise.all(playPromises);
      this.isPlaying = true;
      this.startPlaybackTimer();
      console.log('🎵 Reproducción iniciada exitosamente');
    } catch (error) {
      console.error('❌ Error en reproducción:', error);
      throw error;
    }
  }

  // Pausar reproducción
  pause(): void {
    if (!this.isPlaying) return;
    
    console.log('⏸️ Pausando reproducción');
    
    this.sounds.forEach((sound) => {
      sound.pause();
    });
    
    this.isPlaying = false;
    this.stopPlaybackTimer();
  }

  // Reanudar reproducción
  resume(): void {
    if (this.isPlaying) return;
    
    console.log('▶️ Reanudando reproducción');
    
    this.sounds.forEach((sound) => {
      sound.play();
    });
    
    this.isPlaying = true;
    this.startPlaybackTimer();
  }

  // Detener reproducción
  stop(): void {
    console.log('⏹️ Deteniendo reproducción');
    
    this.sounds.forEach((sound) => {
      sound.stop();
    });
    
    this.isPlaying = false;
    this.stopPlaybackTimer();
  }

  // Limpiar todos los sonidos
  private clearSounds(): void {
    this.sounds.forEach((sound) => {
      sound.release();
    });
    this.sounds.clear();
  }

  // Iniciar timer para actualizaciones de reproducción
  private startPlaybackTimer(): void {
    this.stopPlaybackTimer();
    
    this.playbackTimer = setInterval(() => {
      if (this.currentSong && this.onPlaybackUpdate) {
        // Obtener duración del primer track como referencia
        const firstSound = Array.from(this.sounds.values())[0];
        if (firstSound) {
          const currentTime = firstSound.getCurrentTime();
          const duration = firstSound.getDuration();
          this.onPlaybackUpdate(currentTime, duration);
        }
      }
    }, 1000);
  }

  // Detener timer de reproducción
  private stopPlaybackTimer(): void {
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = undefined;
    }
  }

  // Controlar volumen de un track específico
  setTrackVolume(trackId: string, volume: number): void {
    const sound = this.sounds.get(trackId);
    if (sound) {
      sound.setVolume(volume);
    }
  }

  // Silenciar/desilenciar un track
  setTrackMuted(trackId: string, muted: boolean): void {
    const sound = this.sounds.get(trackId);
    if (sound) {
      sound.setVolume(muted ? 0 : 1);
    }
  }

  // Obtener estado actual
  getCurrentSong(): Song | null {
    return this.currentSong;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Limpiar recursos
  cleanup(): void {
    this.stop();
    this.clearSounds();
    this.currentSong = null;
  }
}

// Instancia singleton
const audioPlayerService = new AudioPlayerService();

export default audioPlayerService;
