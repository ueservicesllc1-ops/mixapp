# Configuración de MixerCurse Web App

## Pasos para configurar la aplicación web

### 1. Instalar dependencias

```bash
cd web-app
npm install
```

### 2. Configurar Firebase Web App

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `mixercurse2`
3. Ve a "Project Settings" (⚙️) > "General"
4. En la sección "Your apps", haz clic en "Add app" y selecciona "Web" (</>)
5. Registra la app con el nombre "MixerCurse Web"
6. Copia la configuración que aparece y actualiza el archivo `src/config/firebase.ts`

La configuración debería verse así:
```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDc0B-F47iI9Oz-JcgNpOM0ENUoRG5tInE",
  authDomain: "mixercurse2.firebaseapp.com",
  projectId: "mixercurse2",
  storageBucket: "mixercurse2.firebasestorage.app",
  messagingSenderId: "509189891821",
  appId: "1:509189891821:web:TU_WEB_APP_ID_AQUI" // ← Este será diferente
};
```

### 3. Configurar Authentication

1. En Firebase Console, ve a "Authentication" > "Sign-in method"
2. Habilita "Email/Password"
3. Habilita "Google" y configura:
   - Web SDK configuration
   - Authorized domains: agrega tu dominio (localhost para desarrollo)

### 4. Configurar Firestore Database

1. Ve a "Firestore Database"
2. Si no existe, crea la base de datos
3. Configura las reglas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    match /setlists/{setlistId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.ownerId;
      match /songs/{songId} {
        allow read, write: if request.auth != null && request.auth.uid == get(/databases/$(database)/documents/setlists/$(setlistId)).data.ownerId;
      }
    }
  }
}
```

### 5. Configurar Storage

1. Ve a "Storage"
2. Si no existe, crea el bucket
3. Configura las reglas de seguridad:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Ejecutar la aplicación

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Funcionalidades disponibles

- ✅ **Login/Registro**: Con email/contraseña y Google
- ✅ **Subida de archivos**: Drag & drop de archivos de audio
- ✅ **Biblioteca**: Visualización y gestión de canciones
- ✅ **Sincronización**: Misma base de datos que la app móvil
- ✅ **Estadísticas**: Resumen del uso de la biblioteca

## Formatos de audio soportados

- MP3
- WAV
- M4A
- AAC
- OGG
- FLAC

Límite de tamaño: 100MB por archivo

## Solución de problemas

### Error de autenticación
- Verifica que el dominio esté autorizado en Firebase Console
- Asegúrate de que las reglas de Firestore permitan la operación

### Error de subida de archivos
- Verifica las reglas de Storage
- Asegúrate de que el usuario esté autenticado

### Error de configuración
- Verifica que el `appId` en `firebase.ts` sea correcto
- Asegúrate de que todas las dependencias estén instaladas
