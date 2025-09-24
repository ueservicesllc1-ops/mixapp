# Configuración de Pruebas para Subida de Audio

## Pasos para configurar Firebase:

### 1. Firebase Console - Agregar App Web
1. Ve a https://console.firebase.google.com/
2. Selecciona proyecto: `mixercurse2`
3. Project Settings (⚙️) > General
4. "Your apps" > "Add app" > Web (</>)
5. Nombre: "MixerCurse Web"
6. Copia el `appId` y actualiza `src/config/firebase.ts`

### 2. Authentication
1. Authentication > Sign-in method
2. Habilita "Email/Password"
3. Habilita "Google" > Configurar dominios autorizados: `localhost`

### 3. Firestore Database
1. Firestore Database > Rules
2. Copia las reglas de `firestore-rules.txt`
3. Publica las reglas

### 4. Storage
1. Storage > Rules
2. Copia las reglas de `storage-rules.txt`
3. Publica las reglas

## Archivos de prueba recomendados:

### Formatos soportados:
- MP3 (recomendado para pruebas)
- WAV
- M4A
- AAC

### Tamaño recomendado para pruebas:
- Máximo 10MB para pruebas rápidas
- Límite real: 100MB

### Archivos de prueba que puedes usar:
1. **Música libre de derechos** (ej: freesound.org)
2. **Archivos de prueba pequeños** (1-5MB)
3. **Diferentes formatos** para probar compatibilidad

## Comandos para ejecutar:

```bash
# 1. Ir a la carpeta web-app
cd web-app

# 2. Instalar dependencias (si no está hecho)
npm install

# 3. Ejecutar la aplicación
npm start
```

## URLs de prueba:
- **Local:** http://localhost:3000
- **Login:** Usa email/contraseña o Google Sign-In
- **Subida:** Pestaña "Subir Canciones"

## Verificación de funcionamiento:

1. ✅ **Login funciona** - Puedes iniciar sesión
2. ✅ **Subida funciona** - Puedes arrastrar archivos
3. ✅ **Progreso se muestra** - Barra de progreso aparece
4. ✅ **Archivos se guardan** - Aparecen en "Biblioteca"
5. ✅ **Sincronización** - Archivos aparecen en app móvil

## Solución de problemas:

### Error: "Firebase: Error (auth/unauthorized-domain)"
- Agrega `localhost` en Authentication > Settings > Authorized domains

### Error: "Permission denied"
- Verifica que las reglas de Firestore/Storage estén publicadas

### Error: "App not found"
- Verifica que el `appId` en `firebase.ts` sea correcto
