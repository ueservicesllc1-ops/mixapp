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

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Generar nombre de archivo
    const fileName = `audio/${userId}/${Date.now()}_${req.file.originalname}`;

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
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'B2 Proxy Server running' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 B2 Proxy Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
