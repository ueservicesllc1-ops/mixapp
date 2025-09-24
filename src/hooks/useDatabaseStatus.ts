/**
 * useDatabaseStatus - Hook personalizado para monitorear el estado de conexión de las bases de datos
 * 
 * @format
 */

import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';

interface DatabaseStatus {
  firestore: boolean;
  b2: boolean;
}

interface UseDatabaseStatusReturn {
  status: DatabaseStatus;
  isLoading: boolean;
  checkConnections: () => Promise<void>;
}

export const useDatabaseStatus = (): UseDatabaseStatusReturn => {
  const [status, setStatus] = useState<DatabaseStatus>({
    firestore: false,
    b2: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const checkFirestoreConnection = async (): Promise<boolean> => {
    try {
      // Verificar si Firebase está inicializado
      if (!firestore().app) {
        console.log('Firebase app not initialized');
        return false;
      }
      
      // Verificación real de conexión a Firestore
      await firestore().collection('test').limit(1).get();
      return true;
    } catch (error: any) {
      console.log('Firestore connection error:', error);
      // Si hay error de red, asumir que está desconectado
      if (error && error.code === 'unavailable' || error && error.code === 'deadline-exceeded') {
        return false;
      }
      // Para otros errores (como permisos), considerar conectado
      return true;
    }
  };

  const checkB2Connection = async (): Promise<boolean> => {
    try {
      // Simular verificación de conexión a B2
      // En una implementación real, aquí harías una petición HTTP a tu API
      // que verifique la conexión a Backblaze B2
      
      // Simular conexión exitosa para mostrar el indicador azul
      // En producción, reemplazar con:
      // const response = await fetch('https://your-api.com/health/b2');
      // return response.ok;
      
      return true; // Simulado - B2 conectado
    } catch (error) {
      console.log('B2 connection error:', error);
      return false;
    }
  };

  const checkConnections = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      const [firestoreStatus, b2Status] = await Promise.all([
        checkFirestoreConnection(),
        checkB2Connection(),
      ]);

      setStatus({
        firestore: firestoreStatus,
        b2: b2Status,
      });
    } catch (error) {
      console.error('Error checking database connections:', error);
      setStatus({
        firestore: false,
        b2: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Verificar conexiones al montar el componente
    checkConnections();

    // Configurar verificación periódica cada 30 segundos
    const interval = setInterval(checkConnections, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    isLoading,
    checkConnections,
  };
};
