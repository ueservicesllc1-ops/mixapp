/**
 * SimpleOfflineService - Servicio simple de sincronización offline sin dependencias externas
 * 
 * @format
 */

interface OfflineData {
  userProfile: any;
  setlists: any[];
  songs: any[];
  projects: any[];
  lastSync: string;
  fullBackup: boolean;
}

class SimpleOfflineService {
  private static instance: SimpleOfflineService;
  private isOnline: boolean = true;
  private offlineData: OfflineData = {
    userProfile: null,
    setlists: [],
    songs: [],
    projects: [],
    lastSync: '',
    fullBackup: false
  };

  private constructor() {}

  public static getInstance(): SimpleOfflineService {
    if (!SimpleOfflineService.instance) {
      SimpleOfflineService.instance = new SimpleOfflineService();
    }
    return SimpleOfflineService.instance;
  }

  // Verificar estado de conexión
  public async checkConnectionStatus(): Promise<boolean> {
    try {
      // Intentar hacer una petición simple para verificar conexión
      const response = await fetch('https://www.google.com', { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      this.isOnline = true;
      return true;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }

  // Guardar datos offline en memoria
  public saveOfflineData(key: string, data: any): void {
    if (key === 'userProfile') {
      this.offlineData.userProfile = data;
    } else if (key === 'setlists') {
      this.offlineData.setlists = data;
    } else if (key === 'songs') {
      this.offlineData.songs = data;
    } else if (key === 'projects') {
      this.offlineData.projects = data;
    }
    this.offlineData.lastSync = new Date().toISOString();
    console.log(`💾 Datos guardados offline: ${key}`);
  }

  // Cargar datos offline de memoria
  public loadOfflineData(key: string): any | null {
    if (key === 'userProfile') {
      console.log(`📱 Datos cargados offline: ${key}`);
      return this.offlineData.userProfile;
    } else if (key === 'setlists') {
      console.log(`📱 Datos cargados offline: ${key}`);
      return this.offlineData.setlists;
    } else if (key === 'songs') {
      console.log(`📱 Datos cargados offline: ${key}`);
      return this.offlineData.songs;
    } else if (key === 'projects') {
      console.log(`📱 Datos cargados offline: ${key}`);
      return this.offlineData.projects;
    }
    return null;
  }

  // Obtener setlists (online u offline)
  public async getSetlists(firestoreService: any): Promise<any[]> {
    try {
      const isOnline = await this.checkConnectionStatus();
      
      if (isOnline) {
        // Intentar cargar online
        try {
          const currentUser = firestoreService.getCurrentUser ? firestoreService.getCurrentUser() : null;
          if (!currentUser) {
            console.log('⚠️ No hay usuario autenticado');
            return this.loadOfflineData('setlists') || [];
          }
          
          const onlineSetlists = await firestoreService.getUserSetlists(currentUser.uid);
          this.saveOfflineData('setlists', onlineSetlists);
          console.log('✅ Setlists cargados online');
          return onlineSetlists;
        } catch (error) {
          console.log('⚠️ Error cargando online, usando datos offline');
        }
      }
      
      // Cargar datos offline
      const offlineSetlists = this.loadOfflineData('setlists');
      console.log('📱 Usando setlists offline');
      return offlineSetlists || [];
      
    } catch (error) {
      console.error('❌ Error obteniendo setlists:', error);
      return [];
    }
  }

  // Obtener canciones (online para descargar, offline para usar las ya descargadas)
  public async getSongs(firestoreService: any): Promise<any[]> {
    try {
      const isOnline = await this.checkConnectionStatus();
      
      if (!isOnline) {
        console.log('📱 Sin conexión - Usando canciones ya descargadas localmente');
        // Retornar canciones que ya están descargadas localmente
        return this.loadOfflineData('songs');
      }

      // Cargar online y sincronizar base de datos local
      console.log('🌐 Cargando canciones online y sincronizando BD local...');
      const onlineSongs = await firestoreService.getCollection('songs');
      
      console.log('📊 DEBUG - Canciones obtenidas de Firestore:');
      console.log('   - Total canciones:', onlineSongs.length);
      console.log('   - Títulos únicos:', [...new Set(onlineSongs.map(s => s.title || s.name))]);
      console.log('   - IDs únicos:', [...new Set(onlineSongs.map(s => s.id))]);
      
      // Verificar duplicados por título
      const titles = onlineSongs.map(s => s.title || s.name);
      const uniqueTitles = [...new Set(titles)];
      if (titles.length !== uniqueTitles.length) {
        console.log('⚠️ DUPLICADOS DETECTADOS EN FIRESTORE:');
        const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
        console.log('   - Títulos duplicados:', [...new Set(duplicates)]);
      }
      
      this.saveOfflineData('songs', onlineSongs);
      console.log('✅ Canciones cargadas online y sincronizadas localmente');
      return onlineSongs;
      
    } catch (error) {
      console.error('❌ Error obteniendo canciones:', error);
      // En caso de error, usar datos offline si están disponibles
      return this.loadOfflineData('songs') || [];
    }
  }

  // Crear setlist offline
  public createOfflineSetlist(setlistData: any): string {
    const offlineId = `offline_${Date.now()}`;
    const setlistWithId = {
      ...setlistData,
      id: offlineId,
      isOffline: true,
      createdAt: new Date().toISOString()
    };

    // Agregar a los setlists offline
    this.offlineData.setlists.push(setlistWithId);
    
    console.log(`📱 Setlist creado offline: ${setlistWithId.name}`);
    return offlineId;
  }

  // Agregar canción descargada a la base de datos local
  public addDownloadedSong(setlistId: string, songData: any): void {
    // Verificar que la canción tiene archivo local descargado
    if (!songData.localAudioFile) {
      console.log('⚠️ No se puede agregar canción sin archivo local descargado');
      return;
    }

    // Marcar la canción como descargada localmente
    const downloadedSong = {
      ...songData,
      isDownloaded: true,
      downloadedAt: new Date().toISOString(),
      localPath: songData.localAudioFile
    };

    // Buscar el setlist y agregar la canción
    const setlistIndex = this.offlineData.setlists.findIndex(s => s.id === setlistId);
    if (setlistIndex !== -1) {
      if (!this.offlineData.setlists[setlistIndex].songs) {
        this.offlineData.setlists[setlistIndex].songs = [];
      }
      this.offlineData.setlists[setlistIndex].songs.push(downloadedSong);
    }

    // También agregar a la lista de canciones descargadas
    const songIndex = this.offlineData.songs.findIndex(s => s.id === songData.id);
    if (songIndex !== -1) {
      this.offlineData.songs[songIndex] = downloadedSong;
    } else {
      this.offlineData.songs.push(downloadedSong);
    }
    
    console.log(`💾 Canción descargada agregada a BD local: ${downloadedSong.title}`);
  }

  // Hacer copia completa de Firebase al disco duro local
  public async createFullBackup(firestoreService: any): Promise<void> {
    try {
      const isOnline = await this.checkConnectionStatus();
      
      if (!isOnline) {
        console.log('📱 Sin conexión - No se puede hacer backup completo');
        return;
      }

      console.log('💾 Iniciando backup completo de Firebase...');
      
      const currentUser = firestoreService.getCurrentUser ? firestoreService.getCurrentUser() : null;
      if (!currentUser) {
        console.log('⚠️ No hay usuario autenticado para hacer backup');
        return;
      }

      // 1. Backup del perfil de usuario
      console.log('👤 Respaldando perfil de usuario...');
      const userProfile = await firestoreService.getUserProfile(currentUser.uid);
      this.saveOfflineData('userProfile', userProfile);

      // 2. Backup de setlists del usuario
      console.log('📋 Respaldando setlists...');
      const userSetlists = await firestoreService.getUserSetlists(currentUser.uid);
      this.saveOfflineData('setlists', userSetlists);

      // 3. Backup de proyectos del usuario
      console.log('🎵 Respaldando proyectos...');
      const userProjects = await firestoreService.getUserProjects(currentUser.uid);
      this.saveOfflineData('projects', userProjects);

      // 4. Backup de todas las canciones
      console.log('🎶 Respaldando canciones...');
      const allSongs = await firestoreService.getCollection('songs');
      this.saveOfflineData('songs', allSongs);

      // 5. Marcar backup como completo
      this.offlineData.fullBackup = true;
      this.offlineData.lastSync = new Date().toISOString();

      console.log('✅ Backup completo finalizado');
      console.log(`📊 Usuario: ${userProfile ? 'Respaldo completo' : 'Sin perfil'}`);
      console.log(`📊 Setlists: ${userSetlists.length}`);
      console.log(`📊 Proyectos: ${userProjects.length}`);
      console.log(`📊 Canciones: ${allSongs.length}`);
      
    } catch (error) {
      console.error('❌ Error en backup completo:', error);
    }
  }

  // Sincronización completa
  public async syncData(firestoreService: any): Promise<void> {
    try {
      const isOnline = await this.checkConnectionStatus();
      
      if (!isOnline) {
        console.log('📱 Sin conexión - No se puede sincronizar');
        return;
      }

      console.log('🔄 Iniciando sincronización completa...');
      
      // Hacer backup completo de Firebase
      await this.createFullBackup(firestoreService);
      
      // Subir cambios offline a Firebase
      const currentUser = firestoreService.getCurrentUser ? firestoreService.getCurrentUser() : null;
      if (!currentUser) {
        console.log('⚠️ No hay usuario autenticado para sincronizar cambios offline');
        return;
      }
      
      // Subir setlists creados offline
      for (const setlist of this.offlineData.setlists) {
        if (setlist.isOffline) {
          try {
            await firestoreService.createSetlist(setlist);
            console.log(`✅ Setlist offline sincronizado: ${setlist.name}`);
          } catch (error) {
            console.error(`❌ Error sincronizando setlist offline: ${setlist.name}`, error);
          }
        }
      }
      
      console.log('✅ Sincronización completa exitosa');
      console.log(`📊 Backup completo: ${this.offlineData.fullBackup ? 'Sí' : 'No'}`);
      console.log(`📊 Última sincronización: ${this.offlineData.lastSync}`);
      
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    }
  }

  // Detectar cambios de conexión y sincronizar automáticamente
  public async checkConnectionAndSync(firestoreService: any): Promise<boolean> {
    const wasOffline = !this.isOnline;
    const isOnline = await this.checkConnectionStatus();
    
    if (wasOffline && isOnline) {
      console.log('🌐 Conexión restaurada - Iniciando sincronización automática');
      await this.syncData(firestoreService);
      return true;
    }
    
    this.isOnline = isOnline;
    return false;
  }

  // Obtener estado
  public getStatus() {
    return {
      isOnline: this.isOnline,
      hasUserProfile: !!this.offlineData.userProfile,
      offlineSetlists: this.offlineData.setlists.length,
      offlineProjects: this.offlineData.projects.length,
      offlineSongs: this.offlineData.songs.length,
      fullBackup: this.offlineData.fullBackup,
      lastSync: this.offlineData.lastSync
    };
  }

  // Limpiar datos offline (después de sincronización exitosa)
  public clearOfflineData(): void {
    this.offlineData.setlists = this.offlineData.setlists.filter(s => !s.isOffline);
    console.log('✅ Datos offline limpiados después de sincronización');
  }
}

export default SimpleOfflineService;
