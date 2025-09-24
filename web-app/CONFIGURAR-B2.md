# 🔧 Configurar Backblaze B2

## ✅ Archivos creados:
- `src/config/b2Config.ts` - Archivo de configuración de B2
- `src/services/b2Service.ts` - Servicio para subir archivos a B2

## 📋 Pasos para configurar:

### 1. Obtener credenciales de B2:
1. Ve a [Backblaze B2 Console](https://secure.backblaze.com/user_signin.htm)
2. Inicia sesión en tu cuenta
3. Ve a "App Keys" → "Add a New Application Key"
4. Configura:
   - **Name**: MixerCurse Web
   - **Allow access to Bucket(s)**: Selecciona tu bucket
   - **Type of Access**: Read and Write
5. Copia los valores que aparecen

### 2. Editar configuración:
Abre el archivo `src/config/b2Config.ts` y reemplaza:

```typescript
export const B2_CONFIG = {
  applicationKeyId: 'TU_KEY_ID_AQUI',
  applicationKey: 'TU_APPLICATION_KEY_AQUI', 
  bucketId: 'TU_BUCKET_ID_AQUI',
  bucketName: 'TU_BUCKET_NAME_AQUI'
};
```

### 3. Ejecutar la aplicación:
```bash
npm start
```

## 🎯 ¿Qué necesitas de B2?
- **Key ID**: Identificador de tu aplicación
- **Application Key**: Clave secreta de tu aplicación  
- **Bucket ID**: ID del bucket donde guardar archivos
- **Bucket Name**: Nombre del bucket

## ⚠️ Importante:
- **NO compartas** estas credenciales
- **NO las subas** a Git
- **Guárdalas** de forma segura

## 🚀 Una vez configurado:
- Los archivos se subirán a B2
- Los metadatos se guardarán en Firestore
- La autenticación seguirá usando Firebase Auth
