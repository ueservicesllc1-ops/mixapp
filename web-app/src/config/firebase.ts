/**
 * Firebase Configuration for Web App
 * 
 * @format
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration (same as mobile app)
const firebaseConfig = {
  apiKey: "AIzaSyBR8aKDqgib3w149Dcl0IFfFsqLReui3Jo",
  authDomain: "mixercurse2.firebaseapp.com",
  projectId: "mixercurse2",
  storageBucket: "mixercurse2.firebasestorage.app",
  messagingSenderId: "509189891821",
  appId: "1:509189891821:web:bf05edec645d067d6f0ee4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services (only Auth and Firestore)
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
