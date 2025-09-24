/**
 * Firebase Configuration
 * 
 * @format
 */

import { initializeApp } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc0B-F47iI9Oz-JcgNpOM0ENUoRG5tInE",
  authDomain: "mixercurse2.firebaseapp.com",
  projectId: "mixercurse2",
  storageBucket: "mixercurse2.firebasestorage.app",
  messagingSenderId: "509189891821",
  appId: "1:509189891821:android:7faffa4ec71d6d266f0ee4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
