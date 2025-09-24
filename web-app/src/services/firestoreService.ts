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
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, Project, Setlist, Song } from '../types';

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
    const setlist: Omit<Setlist, 'id'> = {
      ...setlistData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, 'setlists'), setlist);
    return docRef.id;
  }

  async getUserSetlists(ownerId: string): Promise<Setlist[]> {
    const q = query(
      collection(db, 'setlists'),
      where('ownerId', '==', ownerId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Setlist[];
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
}

export default new FirestoreService();
