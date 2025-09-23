/**
 * AudioLibraryService - Manage user's audio library and tracks
 * 
 * @format
 */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

interface AudioTrack {
  id?: string;
  name: string;
  artist: string;
  duration: number; // in seconds
  bpm: number;
  key: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadDate: firestore.FieldValue;
  ownerId: string;
  isPublic: boolean;
  tags: string[];
}

interface UserLibrary {
  id?: string;
  ownerId: string;
  tracks: AudioTrack[];
  totalTracks: number;
  totalSize: number; // in bytes
  createdAt: firestore.FieldValue;
  updatedAt: firestore.FieldValue;
}

const audioLibraryCollection = firestore().collection('audioLibraries');
const tracksCollection = firestore().collection('audioTracks');

const audioLibraryService = {
  // Get user's audio library
  async getUserLibrary(userId: string): Promise<UserLibrary | null> {
    const libraryDoc = await audioLibraryCollection.doc(userId).get();
    return libraryDoc.exists ? (libraryDoc.data() as UserLibrary) : null;
  },

  // Create user's audio library
  async createUserLibrary(userId: string): Promise<void> {
    const libraryRef = audioLibraryCollection.doc(userId);
    await libraryRef.set({
      ownerId: userId,
      tracks: [],
      totalTracks: 0,
      totalSize: 0,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Add track to user's library
  async addTrackToLibrary(trackData: Omit<AudioTrack, 'id' | 'uploadDate' | 'ownerId'>): Promise<string> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const trackRef = tracksCollection.doc();
    const trackId = trackRef.id;

    // Add track to tracks collection
    await trackRef.set({
      ...trackData,
      id: trackId,
      ownerId: currentUser.uid,
      uploadDate: firestore.FieldValue.serverTimestamp(),
    });

    // Update user's library
    const libraryRef = audioLibraryCollection.doc(currentUser.uid);
    await libraryRef.update({
      totalTracks: firestore.FieldValue.increment(1),
      totalSize: firestore.FieldValue.increment(trackData.fileSize),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    return trackId;
  },

  // Get user's tracks
  async getUserTracks(userId: string): Promise<AudioTrack[]> {
    const snapshot = await tracksCollection.where('ownerId', '==', userId).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudioTrack));
  },

  // Get public tracks
  async getPublicTracks(): Promise<AudioTrack[]> {
    const snapshot = await tracksCollection.where('isPublic', '==', true).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudioTrack));
  },

  // Delete track from library
  async deleteTrack(trackId: string): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const trackDoc = await tracksCollection.doc(trackId).get();
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }

    const trackData = trackDoc.data() as AudioTrack;
    if (trackData.ownerId !== currentUser.uid) {
      throw new Error('Unauthorized to delete this track');
    }

    // Delete track
    await tracksCollection.doc(trackId).delete();

    // Update user's library
    const libraryRef = audioLibraryCollection.doc(currentUser.uid);
    await libraryRef.update({
      totalTracks: firestore.FieldValue.increment(-1),
      totalSize: firestore.FieldValue.increment(-trackData.fileSize),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Update track metadata
  async updateTrack(trackId: string, updates: Partial<AudioTrack>): Promise<void> {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const trackDoc = await tracksCollection.doc(trackId).get();
    if (!trackDoc.exists) {
      throw new Error('Track not found');
    }

    const trackData = trackDoc.data() as AudioTrack;
    if (trackData.ownerId !== currentUser.uid) {
      throw new Error('Unauthorized to update this track');
    }

    await tracksCollection.doc(trackId).update({
      ...updates,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  },

  // Search tracks
  async searchTracks(query: string, userId?: string): Promise<AudioTrack[]> {
    let tracksQuery = tracksCollection.where('isPublic', '==', true);
    
    if (userId) {
      tracksQuery = tracksCollection.where('ownerId', '==', userId);
    }

    const snapshot = await tracksQuery.get();
    const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AudioTrack));
    
    // Filter by search query
    return tracks.filter(track => 
      track.name.toLowerCase().includes(query.toLowerCase()) ||
      track.artist.toLowerCase().includes(query.toLowerCase()) ||
      track.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },
};

export default audioLibraryService;
