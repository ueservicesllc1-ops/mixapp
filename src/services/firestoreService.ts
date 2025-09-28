/**
 * FirestoreService - Database operations for MixerCurse
 * 
 * @format
 */

import firestore, { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getFirestore
} from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  tracks: Track[];
  bpm: number;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Track {
  id: string;
  name: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  audioFile?: string;
  localAudioFile?: string; // Ruta local del archivo de track
  color: string;
}

export interface Setlist {
  id: string;
  name: string;
  ownerId: string;
  songs: Song[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  audioFile?: string; // URL original de B2
  localAudioFile?: string; // Ruta local del archivo descargado
  order: number;
  duration?: number;
  fileSize?: number;
  uploadDate?: Date;
  ownerId?: string;
  projectId?: string;
  tags?: string[];
  isPublic?: boolean;
  tracks?: Track[]; // Tracks individuales de la canción
}

export interface LEDImage {
  id: string;
  name: string;
  songName: string;
  imageUrl: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

class FirestoreService {
  private db = getFirestore();

  // Get current authenticated user
  getCurrentUser() {
    return auth().currentUser;
  }

  // User Profile Operations
  async createUserProfile(user: any): Promise<void> {
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(this.db, 'users', user.uid), userProfile);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(this.db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(this.db, 'users', uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  // Project Operations
  async createProject(projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const project: Omit<Project, 'id'> = {
      ...projectData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(this.db, 'projects'), project);
    return docRef.id;
  }

  async getUserProjects(ownerId: string): Promise<Project[]> {
    // Usar consulta simple sin orderBy para evitar problemas de índice
    const q = query(
      collection(this.db, 'projects'),
      where('ownerId', '==', ownerId)
    );
    const snapshot = await getDocs(q);
    
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    
    // Ordenar manualmente por fecha de actualización
    return projects.sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(this.db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    const docRef = doc(this.db, 'projects', projectId);
    await deleteDoc(docRef);
  }

  // Setlist Operations
  async createSetlist(setlistData: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log('🎵 createSetlist llamada con datos:', setlistData);
    
    const setlist: Omit<Setlist, 'id'> = {
      ...setlistData,
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('📊 Setlist completa a guardar:', setlist);
    
    const docRef = await addDoc(collection(this.db, 'setlists'), setlist);
    
    console.log('✅ Setlist creada en Firestore con ID:', docRef.id);
    return docRef.id;
  }

  async getUserSetlists(ownerId: string): Promise<Setlist[]> {
    const q = query(
      collection(this.db, 'setlists'),
      where('ownerId', '==', ownerId)
    );
    const snapshot = await getDocs(q);

    // Cargar cada setlist con sus canciones
    const setlists = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const setlistData = doc.data();
        const setlistId = doc.id;
        
        // Obtener las canciones de este setlist
        const songs = await this.getSetlistSongs(setlistId);
        
        return {
          id: setlistId,
          ...setlistData,
          songs: songs
        } as Setlist;
      })
    );

    // Ordenar por fecha de actualización (más reciente primero)
    return setlists.sort((a, b) => {
      const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
      const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    });
  }

  async updateSetlist(setlistId: string, updates: Partial<Setlist>): Promise<void> {
    const docRef = doc(this.db, 'setlists', setlistId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteSetlist(setlistId: string): Promise<void> {
    const docRef = doc(this.db, 'setlists', setlistId);
    await deleteDoc(docRef);
  }

  // Generic Collection Operations
  async getCollection(collectionName: string): Promise<any[]> {
    const snapshot = await getDocs(collection(this.db, collectionName));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }

  // Song Operations
  async addSongToSetlist(setlistId: string, song: Omit<Song, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'setlists', setlistId, 'songs'), song);
    return docRef.id;
  }

  async getSetlistSongs(setlistId: string): Promise<Song[]> {
    console.log('🔍 getSetlistSongs llamada con setlistId:', setlistId);
    const q = query(
      collection(this.db, 'setlists', setlistId, 'songs'),
      orderBy('order')
    );
    const snapshot = await getDocs(q);
    
    console.log('📊 Documentos encontrados en setlist:', snapshot.docs.length);
    
    const songs = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('🎵 Canción encontrada:', { id: doc.id, title: data.title, order: data.order });
      return {
        id: doc.id,
        ...data,
      };
    }) as Song[];
    
    console.log('📚 Total canciones retornadas:', songs.length);
    return songs;
  }

  // Real-time listeners
  subscribeToUserProjects(ownerId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(this.db, 'projects'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, snapshot => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      callback(projects);
    });
  }

  subscribeToUserSetlists(ownerId: string, callback: (setlists: Setlist[]) => void) {
    const q = query(
      collection(this.db, 'setlists'),
      where('ownerId', '==', ownerId)
    );
    return onSnapshot(q, snapshot => {
      const setlists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];

      // Ordenar por fecha de actualización (más reciente primero)
      const sortedSetlists = setlists.sort((a, b) => {
        const dateA = a.updatedAt instanceof Date ? a.updatedAt : new Date(a.updatedAt);
        const dateB = b.updatedAt instanceof Date ? b.updatedAt : new Date(b.updatedAt);
        return dateB.getTime() - dateA.getTime();
      });

      callback(sortedSetlists);
    });
  }

  // LED Image Operations
  async createLEDImage(ledImageData: Omit<LEDImage, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating LED image with data:', ledImageData);
      const ledImage: Omit<LEDImage, 'id'> = {
        ...ledImageData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(this.db, 'ledImages'), ledImage);
      console.log('LED image created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating LED image:', error);
      throw error;
    }
  }

  async getUserLEDImages(ownerId: string): Promise<LEDImage[]> {
    try {
      console.log('Getting LED images for user:', ownerId);
      const q = query(
        collection(this.db, 'ledImages'),
        where('ownerId', '==', ownerId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ledImages = querySnapshot && querySnapshot.docs ? querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LEDImage[] : [];
      
      console.log('Found LED images:', ledImages.length);
      return ledImages;
    } catch (error) {
      console.error('Error getting user LED images:', error);
      return [];
    }
  }

  async updateLEDImage(ledImageId: string, updates: Partial<LEDImage>): Promise<void> {
    const docRef = doc(this.db, 'ledImages', ledImageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteLEDImage(ledImageId: string): Promise<void> {
    const docRef = doc(this.db, 'ledImages', ledImageId);
    await deleteDoc(docRef);
  }

  async getLEDImageById(ledImageId: string): Promise<LEDImage | null> {
    try {
      const docRef = doc(this.db, 'ledImages', ledImageId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as LEDImage : null;
    } catch (error) {
      console.error('Error getting LED image by ID:', error);
      return null;
    }
  }

  // Real-time listener for LED images
  subscribeToUserLEDImages(ownerId: string, callback: (ledImages: LEDImage[]) => void) {
    const q = query(
      collection(this.db, 'ledImages'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot && snapshot.docs) {
        const ledImages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as LEDImage[];
        callback(ledImages);
      } else {
        console.log('No snapshot or docs available');
        callback([]);
      }
    }, (error) => {
      console.error('Error in LED images snapshot:', error);
      callback([]);
    });
  }

  // ========== NEW SONGS COLLECTION OPERATIONS ==========
  
  // Get all new songs for a user
  async getUserNewSongs(ownerId: string): Promise<any[]> {
    try {
      console.log('🔍 Getting new songs for user:', ownerId);
      const q = query(
        collection(this.db, 'newsongs'),
        where('ownerId', '==', ownerId)
      );
      
      const querySnapshot = await getDocs(q);
      const newSongs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('🎵 Found new songs:', newSongs.length);
      return newSongs;
    } catch (error) {
      console.error('❌ Error getting user new songs:', error);
      return [];
    }
  }

  // Get all public new songs (for discovery)
  async getAllPublicNewSongs(): Promise<any[]> {
    try {
      console.log('🔍 Getting all public new songs');
      const q = query(
        collection(this.db, 'newsongs'),
        where('isPublic', '==', true),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      const newSongs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      console.log('🎵 Found public new songs:', newSongs.length);
      return newSongs;
    } catch (error) {
      console.error('❌ Error getting public new songs:', error);
      return [];
    }
  }

  // Increment download count
  async incrementNewSongDownloads(newSongId: string): Promise<void> {
    try {
      const docRef = doc(this.db, 'newsongs', newSongId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const currentDownloads = docSnap.data().downloads || 0;
        await updateDoc(docRef, {
          downloads: currentDownloads + 1,
          lastPlayed: new Date(),
          updatedAt: new Date()
        });
        console.log('📊 Download count incremented for new song:', newSongId);
      }
    } catch (error) {
      console.error('❌ Error incrementing download count:', error);
    }
  }

  // Real-time listener for user's new songs
  subscribeToUserNewSongs(ownerId: string, callback: (newSongs: any[]) => void) {
    const q = query(
      collection(this.db, 'newsongs'),
      where('ownerId', '==', ownerId)
    );
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot && snapshot.docs) {
        const newSongs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(newSongs);
      } else {
        console.log('No new songs snapshot or docs available');
        callback([]);
      }
    }, (error) => {
      console.error('Error in new songs snapshot:', error);
      callback([]);
    });
  }

  // Real-time listener for all public new songs
  subscribeToPublicNewSongs(callback: (newSongs: any[]) => void) {
    const q = query(
      collection(this.db, 'newsongs'),
      where('isPublic', '==', true),
      where('status', '==', 'active')
    );
    
    return onSnapshot(q, (snapshot) => {
      if (snapshot && snapshot.docs) {
        const newSongs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(newSongs);
      } else {
        console.log('No public new songs snapshot or docs available');
        callback([]);
      }
    }, (error) => {
      console.error('Error in public new songs snapshot:', error);
      callback([]);
    });
  }

  // Método para guardar canciones descargadas
  async addDownloadedSong(songMetadata: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(firestore(), 'downloadedSongs'), {
        ...songMetadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding downloaded song:', error);
      throw error;
    }
  }

  // Método para obtener canciones descargadas del usuario
  async getUserDownloadedSongs(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(firestore(), 'downloadedSongs'),
        where('ownerId', '==', userId),
        orderBy('downloadedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting downloaded songs:', error);
      return [];
    }
  }

  // Método para eliminar canción descargada
  async deleteDownloadedSong(songId: string): Promise<void> {
    try {
      const songRef = doc(firestore(), 'downloadedSongs', songId);
      await deleteDoc(songRef);
    } catch (error) {
      console.error('Error deleting downloaded song:', error);
      throw error;
    }
  }

}

export default new FirestoreService();
