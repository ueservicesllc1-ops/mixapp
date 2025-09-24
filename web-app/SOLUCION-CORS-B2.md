# 🔧 Solución para CORS con Backblaze B2

## ❌ Problema actual:
B2 API y S3 API no permiten peticiones directas desde navegadores debido a CORS.

## ✅ Soluciones disponibles:

### **Opción 1: Configurar CORS en B2 (Recomendado)**

1. **Ve a [Backblaze B2 Console](https://secure.backblaze.com/user_signin.htm)**
2. **Selecciona tu bucket:** `mixercur`
3. **Ve a "CORS Rules"**
4. **Agrega esta regla:**

```json
[
  {
    "corsRuleName": "webapp-upload",
    "allowedOrigins": ["http://localhost:3000", "https://tu-dominio.com"],
    "allowedHeaders": ["*"],
    "allowedOperations": ["s3_put_object", "s3_get_object"],
    "exposeHeaders": ["ETag"],
    "maxAgeSeconds": 3600
  }
]
```

### **Opción 2: Usar un proxy/backend**

Crear un backend que maneje la subida a B2:

```javascript
// backend/upload.js
app.post('/api/upload', async (req, res) => {
  // Subir archivo a B2 desde el servidor
  // Retornar URL de descarga
});
```

### **Opción 3: Usar Firebase Functions**

```javascript
// functions/uploadToB2.js
exports.uploadToB2 = functions.https.onCall(async (data, context) => {
  // Subir archivo a B2 desde Firebase Function
  // Retornar URL de descarga
});
```

## 🎯 Estado actual:

- ✅ **Interfaz funcionando** - Mock service simula la subida
- ✅ **Validación de archivos** - Funciona correctamente
- ✅ **Progreso de subida** - Se muestra correctamente
- ✅ **Metadatos en Firestore** - Se guardan correctamente
- ❌ **Subida real a B2** - Bloqueada por CORS

## 🚀 Para producción:

1. **Configurar CORS en B2** (Opción 1)
2. **O crear un backend** (Opción 2)
3. **O usar Firebase Functions** (Opción 3)

## 📱 Mientras tanto:

La aplicación funciona perfectamente para:
- ✅ Autenticación
- ✅ Interfaz de usuario
- ✅ Validación de archivos
- ✅ Simulación de subida
- ✅ Guardado de metadatos

**¿Quieres que te ayude a configurar CORS en B2 o prefieres otra solución?**
