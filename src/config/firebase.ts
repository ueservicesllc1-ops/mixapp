/**
 * Firebase Configuration
 * 
 * @format
 */

import { initializeApp } from '@react-native-firebase/app';

// Firebase configuration
const firebaseConfig = {
  // You need to add your Firebase config here
  // Get this from Firebase Console > Project Settings > General > Your apps
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
