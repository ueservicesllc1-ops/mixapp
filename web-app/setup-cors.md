# Configurar CORS para Firebase Storage

## Problema:
El bucket de Firebase Storage está bloqueando peticiones desde localhost:3000 debido a CORS.

## Solución:

### Opción 1: Usar Google Cloud Console (Recomendado)

1. **Ve a [Google Cloud Console](https://console.cloud.google.com/)**
2. **Selecciona el proyecto:** `mixercurse2`
3. **Ve a "Cloud Storage" > "Buckets"**
4. **Haz clic en el bucket:** `mixercurse2.firebasestorage.app`
5. **Ve a la pestaña "Permissions"**
6. **Haz clic en "Edit CORS configuration"**
7. **Agrega esta configuración:**

```json
[
  {
    "origin": ["http://localhost:3000", "http://127.0.0.1:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "X-Requested-With"]
  }
]
```

### Opción 2: Usar gsutil (si tienes Google Cloud SDK)

```bash
# Crear archivo cors.json
echo '[
  {
    "origin": ["http://localhost:3000", "http://127.0.0.1:3000"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "X-Requested-With"]
  }
]' > cors.json

# Aplicar configuración CORS
gsutil cors set cors.json gs://mixercurse2.firebasestorage.app
```

### Opción 3: Configuración temporal más permisiva

Si las opciones anteriores no funcionan, puedes usar esta configuración más permisiva (solo para desarrollo):

```json
[
  {
    "origin": ["*"],
    "method": ["*"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["*"]
  }
]
```

## Verificar configuración:

Después de aplicar CORS, recarga la página y prueba subir un archivo nuevamente.

## Nota de seguridad:
La configuración permisiva (Opción 3) es solo para desarrollo. En producción, usa dominios específicos.
