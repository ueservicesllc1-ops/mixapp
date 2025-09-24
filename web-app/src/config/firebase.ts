/**
 * Firebase Configuration for Web App
 * 
 * @format
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration (same as mobile app)
const firebaseConfig = {
  apiKey: "AIzaSyDc0B-F47iI9Oz-JcgNpOM0ENUoRG5tInE",
  authDomain: "mixercurse2.firebaseapp.com",
  projectId: "mixercurse2",
  storageBucket: "mixercurse2.firebasestorage.app",
  messagingSenderId: "509189891821",
  appId: "1:509189891821:web:your-web-app-id" // You'll need to add this in Firebase Console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
