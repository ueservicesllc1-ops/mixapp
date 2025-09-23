/**
 * MixerCurse App - Multitrack Audio Player
 * 
 * @format
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/config/firebase'; // Initialize Firebase first
import { AuthProvider, useAuth } from './src/components/AuthProvider';
import MainScreen from './src/screens/MainScreen';
import LoginScreen from './src/screens/LoginScreen';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You can add a loading screen here
  }

  return user ? <MainScreen /> : <LoginScreen />;
};

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
