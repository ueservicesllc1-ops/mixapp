/**
 * Proxy Server para Backblaze B2
 * Este servidor maneja la subida a B2 desde el backend, evitando CORS
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Configuración de B2 S3 Compatible
const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketId: 'cc12bbd592366bde909b0a1a',
  bucketName: 'mixercur',
  endpoint: 'https://s3.us-east-005.backblazeb2.com'
};

// Middleware
app.use(cors());
app.use(express.json());

// Configurar multer para archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Configuración de AWS SDK para B2 S3 Compatible
const AWS = require('aws-sdk');

// Configurar AWS SDK para B2
const s3 = new AWS.S3({
  endpoint: B2_CONFIG.endpoint,
  accessKeyId: B2_CONFIG.applicationKeyId,
  secretAccessKey: B2_CONFIG.applicationKey,
  region: 'us-east-005',
  s3ForcePathStyle: true
});

// Endpoint para subir archivos
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { userId, songId, trackName, folder } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Determinar el tipo de archivo y generar nombre
    const isImage = req.file.mimetype.startsWith('image/');
    
    let fileName;
    if (isImage) {
      // Para imágenes LED, usar estructura simple
      fileName = `led-images/${userId}/${Date.now()}_${req.file.originalname}`;
    } else {
      // Para canciones, verificar si es para la carpeta "newsongs"
      if (folder === 'newsongs' && songId) {
        // Para nuevas canciones, usar carpeta newsongs
        fileName = `newsongs/${songId}/${req.file.originalname}`;
      } else if (songId && trackName) {
        // Para canciones individuales normales, usar carpeta canciones
        fileName = `canciones/${songId}/${req.file.originalname}`;
      } else {
        // Fallback a estructura antigua
        fileName = `canciones/${userId}/${Date.now()}_${req.file.originalname}`;
      }
    }

    // Subir archivo usando S3 compatible
    const uploadParams = {
      Bucket: B2_CONFIG.bucketName,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    const result = await s3.upload(uploadParams).promise();
    
    console.log('File uploaded successfully:', result.Location);
    console.log('File path in B2:', fileName);
    
    res.json({
      success: true,
      fileId: result.ETag,
      fileName: fileName,
      downloadUrl: result.Location,
      fileSize: req.file.size,
      contentType: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

// Endpoint de salud
// Middleware para capturar todas las rutas que empiecen con /api/proxy/
app.use('/api/proxy', async (req, res) => {
  console.log(`🚀 ENDPOINT /api/proxy LLAMADO`);
  try {
    // Extraer la ruta después de /api/proxy/
    const filePath = req.originalUrl.replace('/api/proxy/', '');
    console.log(`📥 Descargando archivo: ${filePath}`);
    console.log(`🔗 URL completa: ${req.originalUrl}`);
    
    // Construir la clave del archivo en B2
    // Los archivos están en diferentes rutas según el tipo
    let key = filePath;
    
    // Si es una ruta de newsongs, mantenerla como está
    if (filePath.includes('newsongs/')) {
      key = filePath;
    } else if (filePath.includes('mixercur/canciones/')) {
      key = filePath.replace('mixercur/canciones/', 'canciones/');
    } else if (filePath.includes('mixercur/')) {
      key = filePath.replace('mixercur/', '');
    }
    
    console.log(`🔑 Clave B2: ${key}`);
    
    // Descargar archivo desde B2
    const params = {
      Bucket: B2_CONFIG.bucketName,
      Key: key
    };
    
    const data = await s3.getObject(params).promise();
    console.log(`✅ Archivo descargado: ${data.ContentLength} bytes`);
    
    // Configurar headers para descarga
    res.set({
      'Content-Type': data.ContentType || 'application/octet-stream',
      'Content-Length': data.ContentLength,
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
    });
    
    // Enviar el archivo
    res.send(data.Body);
    
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    
    // Manejar diferentes tipos de errores
    if (error.code === 'NoSuchKey') {
      console.log('📁 Archivo no encontrado, intentando rutas alternativas...');
      
      // Intentar rutas alternativas basadas en la estructura real de B2
      const alternativeKeys = [
        // Ruta original
        key,
        // Ruta con audio/ prefix
        `audio/${key}`,
        // Ruta sin mixercur/ prefix
        key.replace('mixercur/', ''),
        // Ruta con estructura completa
        `audio/${key.replace('mixercur/', '')}`,
        // Ruta con newsongs/ structure
        key.replace('newsongs/', 'audio/'),
        // Ruta con estructura de carpetas
        `audio/${key.replace('mixercur/newsongs/', '')}`
      ];
      
      let found = false;
      for (const altKey of alternativeKeys) {
        try {
          console.log(`🔍 Intentando clave alternativa: ${altKey}`);
          const altParams = {
            Bucket: B2_CONFIG.bucketName,
            Key: altKey
          };
          
          const altData = await s3.getObject(altParams).promise();
          console.log(`✅ Archivo encontrado con clave alternativa: ${altKey}`);
          
          // Configurar headers para descarga
          res.set({
            'Content-Type': altData.ContentType || 'application/octet-stream',
            'Content-Length': altData.ContentLength,
            'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`
          });
          
          // Enviar el archivo
          res.send(altData.Body);
          found = true;
          break;
        } catch (altError) {
          console.log(`❌ Clave alternativa no encontrada: ${altKey}`);
        }
      }
      
      if (!found) {
        res.status(404).json({ 
          error: 'Archivo no encontrado',
          message: 'El archivo no existe en ninguna ubicación conocida',
          attemptedKeys: [key, ...alternativeKeys]
        });
      }
    } else {
      console.error('❌ Error interno:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: error.message 
      });
    }
  }
});

// Endpoint para eliminar archivos
app.use('/api/delete', async (req, res) => {
  console.log(`🗑️ ENDPOINT /api/delete LLAMADO`);
  try {
    const filePath = req.originalUrl.replace('/api/delete/', '');
    console.log(`🗑️ Eliminando archivo: ${filePath}`);
    console.log(`🔗 URL completa: ${req.originalUrl}`);
    
    // Construir la clave B2
    let key = filePath.replace('mixercur/canciones/', 'canciones/');
    console.log(`🔑 Clave B2 para eliminar: ${key}`);
    
    // Eliminar archivo de B2
    const params = {
      Bucket: B2_CONFIG.bucketName,
      Key: key
    };
    
    console.log(`🗑️ Parámetros de eliminación:`, params);
    
    await s3.deleteObject(params).promise();
    console.log(`✅ Archivo eliminado de B2: ${key}`);
    
    res.json({ success: true, message: 'Archivo eliminado correctamente' });
    
  } catch (error) {
    console.error('❌ Error eliminando archivo:', error);
    res.status(500).json({ error: 'Error eliminando archivo' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'B2 Proxy Server running' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 B2 Proxy Server running on http://localhost:${PORT}`);
  console.log(`🌐 También disponible en: http://192.168.1.173:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
