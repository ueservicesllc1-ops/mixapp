/**
 * FirestoreService - Database operations for MixerCurse
 * 
 * @format
 */

import firestore from '@react-native-firebase/firestore';
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
  audioFile?: string;
  order: number;
}

class FirestoreService {
  private db = firestore();

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

    await this.db.collection('users').doc(user.uid).set(userProfile);
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const doc = await this.db.collection('users').doc(uid).get();
    return doc.exists ? doc.data() as UserProfile : null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    await this.db.collection('users').doc(uid).update({
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

    const docRef = await this.db.collection('projects').add(project);
    return docRef.id;
  }

  async getUserProjects(ownerId: string): Promise<Project[]> {
    const snapshot = await this.db
      .collection('projects')
      .where('ownerId', '==', ownerId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<void> {
    await this.db.collection('projects').doc(projectId).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.db.collection('projects').doc(projectId).delete();
  }

  // Setlist Operations
  async createSetlist(setlistData: Omit<Setlist, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const setlist: Omit<Setlist, 'id'> = {
      ...setlistData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await this.db.collection('setlists').add(setlist);
    return docRef.id;
  }

  async getUserSetlists(ownerId: string): Promise<Setlist[]> {
    const snapshot = await this.db
      .collection('setlists')
      .where('ownerId', '==', ownerId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Setlist[];
  }

  async updateSetlist(setlistId: string, updates: Partial<Setlist>): Promise<void> {
    await this.db.collection('setlists').doc(setlistId).update({
      ...updates,
      updatedAt: new Date(),
    });
  }

  async deleteSetlist(setlistId: string): Promise<void> {
    await this.db.collection('setlists').doc(setlistId).delete();
  }

  // Song Operations
  async addSongToSetlist(setlistId: string, song: Omit<Song, 'id'>): Promise<string> {
    const docRef = await this.db.collection('setlists').doc(setlistId).collection('songs').add(song);
    return docRef.id;
  }

  async getSetlistSongs(setlistId: string): Promise<Song[]> {
    const snapshot = await this.db
      .collection('setlists')
      .doc(setlistId)
      .collection('songs')
      .orderBy('order')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Song[];
  }

  // Real-time listeners
  subscribeToUserProjects(ownerId: string, callback: (projects: Project[]) => void) {
    return this.db
      .collection('projects')
      .where('ownerId', '==', ownerId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const projects = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Project[];
        callback(projects);
      });
  }

  subscribeToUserSetlists(ownerId: string, callback: (setlists: Setlist[]) => void) {
    return this.db
      .collection('setlists')
      .where('ownerId', '==', ownerId)
      .orderBy('updatedAt', 'desc')
      .onSnapshot(snapshot => {
        const setlists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Setlist[];
        callback(setlists);
      });
  }
}

export default new FirestoreService();
