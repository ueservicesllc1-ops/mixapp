# MixerCurse Web App

Una aplicación web para gestionar y subir canciones multitrack que se sincroniza con la aplicación móvil MixerCurse.

## Características

- 🔐 **Autenticación**: Login con email/contraseña y Google Sign-In
- 📁 **Subida de archivos**: Drag & drop para archivos de audio
- 🎵 **Biblioteca de canciones**: Gestión y reproducción de canciones
- 📊 **Estadísticas**: Visualización del uso de la biblioteca
- 🔄 **Sincronización**: Misma base de datos que la app móvil

## Tecnologías

- **React 18** con TypeScript
- **Firebase** (Auth, Firestore, Storage)
- **Tailwind CSS** para estilos
- **Lucide React** para iconos

## Configuración

### 1. Instalar dependencias

```bash
cd web-app
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto `mixercurse2`
3. Ve a "Project Settings" > "General"
4. En "Your apps", agrega una nueva app web
5. Copia la configuración y actualiza `src/config/firebase.ts`

### 3. Configurar autenticación

1. En Firebase Console, ve a "Authentication" > "Sign-in method"
2. Habilita "Email/Password" y "Google"
3. Para Google, configura el dominio autorizado

### 4. Configurar Storage

1. En Firebase Console, ve a "Storage"
2. Crea un bucket si no existe
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

### 5. Configurar Firestore

1. En Firebase Console, ve a "Firestore Database"
2. Configura las reglas de seguridad:

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
    }
  }
}
```

## Ejecutar la aplicación

```bash
npm start
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del proyecto

```
web-app/
├── public/
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── FileUpload.tsx
│   │   ├── Header.tsx
│   │   ├── LoginForm.tsx
│   │   └── SongLibrary.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── services/
│   │   ├── firestoreService.ts
│   │   └── storageService.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── package.json
├── tailwind.config.js
└── README.md
```

## Funcionalidades

### Autenticación
- Login con email y contraseña
- Registro de nuevos usuarios
- Login con Google
- Gestión de sesiones

### Subida de archivos
- Drag & drop de archivos de audio
- Validación de tipos de archivo (MP3, WAV, M4A, AAC, OGG, FLAC)
- Límite de tamaño (100MB)
- Barra de progreso de subida
- Manejo de errores

### Biblioteca de canciones
- Visualización de canciones por setlist
- Reproducción de audio
- Descarga de archivos
- Eliminación de canciones
- Metadatos (BPM, key, duración, tamaño)

### Estadísticas
- Número total de canciones
- Espacio usado en storage
- Número de setlists

## Sincronización con app móvil

La web app usa la misma configuración de Firebase que la aplicación móvil, por lo que:

- Los usuarios pueden usar las mismas credenciales
- Las canciones subidas desde la web aparecen en la app móvil
- Los setlists se sincronizan entre ambas plataformas
- Los metadatos se comparten

## Despliegue

Para desplegar en producción:

1. Construir la aplicación:
```bash
npm run build
```

2. Subir la carpeta `build` a tu servicio de hosting preferido (Vercel, Netlify, Firebase Hosting, etc.)

3. Configurar las variables de entorno si es necesario

## Soporte

Para soporte técnico o reportar bugs, contacta al equipo de desarrollo.
