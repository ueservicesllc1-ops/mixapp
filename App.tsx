/**
 * MixerCurse App - Multitrack Audio Player
 * 
 * @format
 */

import React from 'react';
import { StatusBar, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/config/firebase'; // Initialize Firebase first
import { AuthProvider, useAuth } from './src/components/AuthProvider';
import MainScreen from './src/screens/MainScreen';
import LoginScreen from './src/screens/LoginScreen';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00ff00" />
        <Text style={styles.loadingText}>Cargando MixerCurse...</Text>
      </View>
    );
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    fontWeight: 'bold',
  },
});

export default App;
