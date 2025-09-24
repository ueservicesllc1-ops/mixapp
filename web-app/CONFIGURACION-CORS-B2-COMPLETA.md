# 🔧 Configuración CORS Completa para Backblaze B2

## 🚨 Problema Identificado
El navegador bloquea las peticiones a B2 desde `localhost:3000` debido a políticas CORS (Cross-Origin Resource Sharing).

## ✅ Solución Implementada

### 1. **Configurar CORS en Backblaze B2**

#### Paso 1: Acceder al Panel de B2
1. Ve a [Backblaze B2 Console](https://secure.backblaze.com/user_signin.htm)
2. Inicia sesión con tu cuenta
3. Navega a **Buckets**
4. Selecciona tu bucket: `mixercur`

#### Paso 2: Configurar CORS Rules
1. En la página del bucket, busca la sección **"CORS Rules"**
2. Haz clic en **"Add CORS Rule"**
3. Copia y pega esta configuración:

```json
[
  {
    "corsRuleName": "webapp-upload-localhost",
    "allowedOrigins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://localhost:3000"
    ],
    "allowedHeaders": ["*"],
    "allowedOperations": [
      "s3_put_object",
      "s3_get_object",
      "s3_post_object",
      "s3_delete_object"
    ],
    "exposeHeaders": [
      "ETag",
      "x-amz-version-id",
      "x-amz-delete-marker"
    ],
    "maxAgeSeconds": 3600
  }
]
```

#### Paso 3: Guardar la Configuración
1. Haz clic en **"Save"** o **"Apply"**
2. Espera unos minutos para que la configuración se propague

### 2. **Verificar Configuración de Credenciales**

Asegúrate de que tus credenciales en `web-app/src/config/b2Config.ts` sean correctas:

```typescript
export const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011', // Tu Key ID
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4', // Tu Application Key
  bucketId: 'cc12bbd592366bde909b0a1a', // Tu Bucket ID
  bucketName: 'mixercur' // Tu Bucket Name
};
```

### 3. **Probar la Conexión**

#### Opción A: Usar la Aplicación Web
1. Ejecuta la aplicación: `npm start`
2. Ve a `http://localhost:3000`
3. Intenta subir un archivo de audio
4. Revisa la consola del navegador para ver los logs

#### Opción B: Probar con cURL (Opcional)
```bash
# Probar autenticación
curl -X POST https://api.backblazeb2.com/b2api/v2/b2_authorize_account \
  -H "Authorization: Basic $(echo -n 'TU_KEY_ID:TU_APPLICATION_KEY' | base64)" \
  -H "Content-Type: application/json"
```

### 4. **Solución Alternativa: Backend Proxy**

Si CORS sigue fallando, puedes crear un backend que maneje las subidas:

```javascript
// backend/upload.js
const express = require('express');
const multer = require('multer');
const b2 = require('backblaze-b2');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/upload', upload.single('audio'), async (req, res) => {
  try {
    // Subir archivo a B2 desde el servidor
    // Retornar URL de descarga
    res.json({ downloadUrl: 'https://...' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🔍 Diagnóstico de Problemas

### Error: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
- **Causa**: CORS no configurado en B2
- **Solución**: Configurar CORS rules en el panel de B2

### Error: "401 Unauthorized"
- **Causa**: Credenciales incorrectas o expiradas
- **Solución**: Verificar `applicationKeyId` y `applicationKey`

### Error: "404 Not Found"
- **Causa**: Bucket ID o nombre incorrecto
- **Solución**: Verificar `bucketId` y `bucketName`

### Error: "Upload URL expired"
- **Causa**: La URL de upload tiene un tiempo de vida limitado
- **Solución**: El código ya maneja esto automáticamente

## 📋 Checklist de Verificación

- [ ] CORS configurado en B2 con las reglas correctas
- [ ] Credenciales B2 correctas en `b2Config.ts`
- [ ] Bucket ID y nombre correctos
- [ ] Aplicación ejecutándose en `localhost:3000`
- [ ] Archivo de audio válido (MP3, WAV, etc.)
- [ ] Consola del navegador sin errores CORS

## 🚀 Para Producción

Cuando despliegues a producción, actualiza las CORS rules para incluir tu dominio:

```json
{
  "corsRuleName": "webapp-upload-production",
  "allowedOrigins": [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com"
  ],
  "allowedHeaders": ["*"],
  "allowedOperations": [
    "s3_put_object",
    "s3_get_object",
    "s3_post_object",
    "s3_delete_object"
  ],
  "exposeHeaders": [
    "ETag",
    "x-amz-version-id",
    "x-amz-delete-marker"
  ],
  "maxAgeSeconds": 3600
}
```

## 📞 Soporte

Si sigues teniendo problemas:
1. Revisa los logs en la consola del navegador
2. Verifica que las credenciales B2 sean válidas
3. Asegúrate de que el bucket existe y tienes permisos
4. Prueba con un archivo pequeño primero (< 1MB)
