/**
 * Type definitions for MixerCurse Web App
 */

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
  timeSignature?: string;
  audioFile?: string;
  order: number;
  duration?: number;
  fileSize?: number;
  uploadDate?: Date;
  ownerId?: string;
  projectId?: string;
  tracks?: {
    name: string;
    audioFile: string;
    size: number;
  }[];
}

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
