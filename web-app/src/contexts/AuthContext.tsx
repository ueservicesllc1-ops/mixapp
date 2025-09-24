/**
 * AuthContext - Firebase Authentication Context for Web App
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import firestoreService from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);
      
      // Guardar o actualizar información del usuario en Firestore
      if (user) {
        await handleUserFirestore(user);
      }
    });

    return unsubscribe;
  }, []);

  const handleUserFirestore = async (user: User) => {
    try {
      console.log('Guardando información del usuario en Firestore...');
      
      // Verificar si el usuario ya existe en Firestore
      const existingUser = await firestoreService.getUserProfile(user.uid);
      
      if (existingUser) {
        // Actualizar información existente
        await firestoreService.updateUserProfile(user.uid, {
          displayName: user.displayName || undefined,
          photoURL: user.photoURL || undefined,
          email: user.email || '',
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    try {
      console.log('Iniciando Google Sign-In...');
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      console.log('Autenticación con Google exitosa:', result.user);
    } catch (error: any) {
      console.error('Google Sign-In Error:', error);
      
      let errorMessage = 'Error al iniciar sesión con Google';
      
      if (error?.code) {
        switch (error.code) {
          case 'auth/popup-closed-by-user':
            errorMessage = 'Inicio de sesión cancelado por el usuario';
            break;
          case 'auth/popup-blocked':
            errorMessage = 'Popup bloqueado por el navegador. Permite popups para este sitio.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Error de red. Verifica tu conexión a internet.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
            break;
          default:
            errorMessage = error.message || `Error de autenticación: ${error.code}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
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
    signOut: signOutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
