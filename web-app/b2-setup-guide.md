# Configuración de Backblaze B2 para MixerCurse Web

## Arquitectura:
- **Firebase Auth** → Autenticación de usuarios
- **Firestore** → Metadatos de canciones (título, artista, BPM, etc.)
- **Backblaze B2** → Archivos de audio (MP3, WAV, etc.)

## Pasos para configurar B2:

### 1. Obtener credenciales de Backblaze B2

1. **Ve a [Backblaze B2 Console](https://secure.backblaze.com/user_signin.htm)**
2. **Inicia sesión en tu cuenta**
3. **Ve a "App Keys"**
4. **Crea una nueva Application Key:**
   - Nombre: "MixerCurse Web"
   - Permisos: "Read and Write"
   - Bucket: Selecciona tu bucket
5. **Copia los valores:**
   - `keyID`
   - `applicationKey`
   - `bucketId`
   - `bucketName`

### 2. Configurar variables de entorno

Crea un archivo `.env` en la carpeta `web-app/` con:

```env
REACT_APP_B2_KEY_ID=tu_key_id_aqui
REACT_APP_B2_APPLICATION_KEY=tu_application_key_aqui
REACT_APP_B2_BUCKET_ID=tu_bucket_id_aqui
REACT_APP_B2_BUCKET_NAME=tu_bucket_name_aqui
```

### 3. Instalar dependencias

```bash
cd web-app
npm install
```

### 4. Ejecutar la aplicación

```bash
npm start
```

## Flujo de funcionamiento:

1. **Usuario se autentica** → Firebase Auth
2. **Usuario sube archivo** → Backblaze B2
3. **Metadatos se guardan** → Firestore
4. **Archivo se reproduce** → URL directa de B2

## Ventajas de esta arquitectura:

- ✅ **B2 tiene CORS configurado por defecto**
- ✅ **Firebase Auth** para autenticación robusta
- ✅ **Firestore** para metadatos en tiempo real
- ✅ **B2** para almacenamiento de archivos confiable
- ✅ **Costos optimizados** (B2 es más barato para archivos)

## Solución de problemas:

### Error: "Failed to authenticate with B2"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de que la Application Key tenga permisos de lectura/escritura

### Error: "Upload failed"
- Verifica que el bucket existe y es accesible
- Revisa que el bucket tenga CORS configurado (B2 lo tiene por defecto)

### Error: "Invalid file URL"
- Verifica que el `bucketName` en `.env` sea correcto
