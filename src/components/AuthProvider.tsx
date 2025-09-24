/**
 * AuthProvider - Firebase Authentication Context
 * 
 * @format
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import firestoreService from '../services/firestoreService';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Configure Google Sign-In
    GoogleSignin.configure({
      webClientId: '509189891821-ap9k9f7o8m2tn1ah7dsbjq2i2v1nft8v.apps.googleusercontent.com',
      offlineAccess: true,
    });

    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      
      // Guardar o actualizar información del usuario en Firestore
      if (user) {
        await handleUserFirestore(user);
      }
    });

    return unsubscribe;
  }, []);

  const handleUserFirestore = async (user: FirebaseAuthTypes.User) => {
    try {
      console.log('Guardando información del usuario en Firestore...');
      
      // Verificar si el usuario ya existe en Firestore
      const existingUser = await firestoreService.getUserProfile(user.uid);
      
      if (existingUser) {
        // Actualizar información existente
        await firestoreService.updateUserProfile(user.uid, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
        });
        console.log('Usuario actualizado en Firestore');
      } else {
        // Crear nuevo perfil de usuario
        await firestoreService.createUserProfile(user);
        console.log('Nuevo usuario creado en Firestore');
      }
    } catch (error) {
      console.error('Error al guardar usuario en Firestore:', error);
      // No lanzar el error para no interrumpir el flujo de autenticación
    }
  };

  const signIn = async (email: string, password: string) => {
    await auth().signInWithEmailAndPassword(email, password);
  };

  const signUp = async (email: string, password: string) => {
    await auth().createUserWithEmailAndPassword(email, password);
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Iniciando Google Sign-In...');
      
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      console.log('Google Play Services disponible');
      
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      console.log('Resultado completo de GoogleSignin.signIn():', JSON.stringify(signInResult, null, 2));
      
      // El token puede estar en diferentes ubicaciones dependiendo de la versión
      const idToken = signInResult.data?.idToken || signInResult.idToken;
      const user = signInResult.data?.user || signInResult.user;
      
      if (!idToken) {
        console.error('No se recibió idToken en el resultado:', signInResult);
        console.error('Datos del usuario:', user);
        throw new Error('No se pudo obtener el token de Google. Verifica que el SHA-1 esté configurado correctamente en Firebase Console.');
      }
      
      console.log('Token obtenido exitosamente:', idToken.substring(0, 20) + '...');
      
      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      
      // Sign-in the user with the credential
      await auth().signInWithCredential(googleCredential);
      console.log('Autenticación con Firebase exitosa');
    } catch (error: any) {
      console.error('Google Sign-In Error completo:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      
      // Manejo específico de errores de Google Sign-In
      let errorMessage = 'Error al iniciar sesión con Google';
      
      if (error?.code) {
        switch (error.code) {
          case 'SIGN_IN_CANCELLED':
            errorMessage = 'Inicio de sesión cancelado por el usuario';
            break;
          case 'IN_PROGRESS':
            errorMessage = 'Ya hay un inicio de sesión en progreso';
            break;
          case 'PLAY_SERVICES_NOT_AVAILABLE':
            errorMessage = 'Google Play Services no está disponible. Instala Google Play Services desde Play Store.';
            break;
          case 'SIGN_IN_REQUIRED':
            errorMessage = 'Se requiere iniciar sesión';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'SIGN_IN_FAILED':
            errorMessage = 'Error en el proceso de autenticación con Google';
            break;
          case 'DEVELOPER_ERROR':
            errorMessage = 'Error de configuración. Verifica el SHA-1 en Firebase Console.';
            break;
          default:
            errorMessage = error.message || `Error de Google: ${error.code}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOut = async () => {
    try {
      // Sign out from Google
      await GoogleSignin.signOut();
      // Sign out from Firebase
      await auth().signOut();
    } catch (error: any) {
      console.error('Sign Out Error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};