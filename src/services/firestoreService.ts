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
  color: string;
}

export interface Setlist {
  id: string;
  name: string;
  date: string;
  userId: string;
  songs: Song[];
  createdAt: string;
  updatedAt: Date;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  key: string;
  bpm: number;
  audioFile?: string;
  order: number;
}

class FirestoreService {
  private db = getFirestore();

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
    const q = query(
      collection(this.db, 'projects'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
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
  async createSetlist(setlistData: { name: string; date: string; userId: string; createdAt: string }): Promise<string> {
    const setlist = {
      ...setlistData,
      songs: [],
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(this.db, 'setlists'), setlist);
    return docRef.id;
  }

  async getUserSetlists(userId: string): Promise<Setlist[]> {
    const q = query(
      collection(this.db, 'setlists'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);

    // Ordenar los resultados en el cliente por updatedAt descendente
    const setlists = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Setlist[];

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

  // Song Operations
  async addSongToSetlist(setlistId: string, song: Omit<Song, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(this.db, 'setlists', setlistId, 'songs'), song);
    return docRef.id;
  }

  async getSetlistSongs(setlistId: string): Promise<Song[]> {
    const q = query(
      collection(this.db, 'setlists', setlistId, 'songs'),
      orderBy('order')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
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

  subscribeToUserSetlists(userId: string, callback: (setlists: Setlist[]) => void) {
    const q = query(
      collection(this.db, 'setlists'),
      where('userId', '==', userId)
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
}

export default new FirestoreService();
