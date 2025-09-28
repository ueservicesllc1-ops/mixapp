/**
 * FirestoreService - Database operations for MixerCurse Web
 */

import { 
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
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, Project, Setlist, Song, LEDImage } from '../types';

class FirestoreService {
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

    await setDoc(doc(db, 'users', user.uid), userProfile);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() as UserProfile : null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, 'users', uid);
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

    const docRef = await addDoc(collection(db, 'projects'), project);
    return docRef.id;
  }

  async getUserProjects(ownerId: string): Promise<Project[]> {
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    const docRef = doc(db, 'projects', projectId);
    await deleteDoc(docRef);
  }

  // Setlist Operations
  async createSetlist(setlistData: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      console.log('Creating setlist with data:', setlistData);
      const setlist: Omit<Setlist, 'id'> = {
        ...setlistData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, 'setlists'), setlist);
      console.log('Setlist created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating setlist:', error);
      throw error;
    }
  }

  async getUserSetlists(ownerId: string): Promise<Setlist[]> {
    try {
      console.log('Getting setlists for user:', ownerId);
      const q = query(
        collection(db, 'setlists'),
        where('ownerId', '==', ownerId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const setlists = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];
      
      console.log('Found setlists:', setlists);
      return setlists;
    } catch (error) {
      console.error('Error getting user setlists:', error);
      return [];
    }
  }

  async updateSetlist(setlistId: string, updates: Partial<Setlist>): Promise<void> {
    const docRef = doc(db, 'setlists', setlistId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteSetlist(setlistId: string): Promise<void> {
    const docRef = doc(db, 'setlists', setlistId);
    await deleteDoc(docRef);
  }

  // Song Operations
  async addSongToSetlist(setlistId: string, song: Omit<Song, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'setlists', setlistId, 'songs'), song);
    return docRef.id;
  }

  // Add song to user's library (global songs collection)
  async addSongToLibrary(userId: string, song: Omit<Song, 'id'>): Promise<string> {
    try {
      console.log('Adding song to library:', song);
      const docRef = await addDoc(collection(db, 'songs'), {
        ...song,
        ownerId: song.ownerId || userId
      });
      console.log('Song added to library with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error adding song to library:', error);
      throw error;
    }
  }

  async getSetlistSongs(setlistId: string): Promise<Song[]> {
    const q = query(
      collection(db, 'setlists', setlistId, 'songs'),
      orderBy('order')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
  }

  // Get user's library songs
  async getUserLibrary(userId: string): Promise<Song[]> {
    try {
      console.log('Getting user library for:', userId);
      const q = query(
        collection(db, 'songs'),
        where('ownerId', '==', userId),
        orderBy('uploadDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];
      
      console.log('Found library songs:', songs.length);
      return songs;
    } catch (error) {
      console.error('Error getting user library:', error);
      return [];
    }
  }

  // Delete song from user's library
  async deleteSongFromLibrary(songId: string): Promise<void> {
    try {
      console.log('Deleting song from library:', songId);
      const docRef = doc(db, 'songs', songId);
      await deleteDoc(docRef);
      console.log('Song deleted from library:', songId);
    } catch (error) {
      console.error('Error deleting song from library:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToUserProjects(ownerId: string, callback: (projects: Project[]) => void) {
    const q = query(
      collection(db, 'projects'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Project[];
      callback(projects);
    });
  }

  subscribeToUserSetlists(ownerId: string, callback: (setlists: Setlist[]) => void) {
    const q = query(
      collection(db, 'setlists'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const setlists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];
      callback(setlists);
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

      const docRef = await addDoc(collection(db, 'ledImages'), ledImage);
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
        collection(db, 'ledImages'),
        where('ownerId', '==', ownerId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const ledImages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LEDImage[];
      
      console.log('Found LED images:', ledImages.length);
      return ledImages;
    } catch (error) {
      console.error('Error getting user LED images:', error);
      return [];
    }
  }

  async updateLEDImage(ledImageId: string, updates: Partial<LEDImage>): Promise<void> {
    const docRef = doc(db, 'ledImages', ledImageId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteLEDImage(ledImageId: string): Promise<void> {
    const docRef = doc(db, 'ledImages', ledImageId);
    await deleteDoc(docRef);
  }

  async getLEDImageById(ledImageId: string): Promise<LEDImage | null> {
    try {
      const docRef = doc(db, 'ledImages', ledImageId);
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
      collection(db, 'ledImages'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const ledImages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as LEDImage[];
      callback(ledImages);
    });
  }

  // Real-time listener for user's library songs
  subscribeToUserLibrary(userId: string, callback: (songs: Song[]) => void) {
    const q = query(
      collection(db, 'songs'),
      where('ownerId', '==', userId),
      orderBy('uploadDate', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const songs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];
      callback(songs);
    });
  }

  // Métodos para New Songs
  async getUserNewSongs(userId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'newsongs'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user new songs:', error);
      throw error;
    }
  }

  async addNewSong(songData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'newsongs'), {
        ...songData,
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 0
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding new song:', error);
      throw error;
    }
  }

  async incrementNewSongDownloads(songId: string): Promise<void> {
    try {
      const songRef = doc(db, 'newsongs', songId);
      await updateDoc(songRef, {
        downloads: increment(1),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error incrementing downloads:', error);
      throw error;
    }
  }

  async deleteNewSong(songId: string): Promise<void> {
    try {
      const songRef = doc(db, 'newsongs', songId);
      await deleteDoc(songRef);
    } catch (error) {
      console.error('Error deleting new song:', error);
      throw error;
    }
  }
}

export default new FirestoreService();
