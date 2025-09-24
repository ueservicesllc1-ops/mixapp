/**
 * Backend Proxy para Backblaze B2
 * Este servidor maneja la subida a B2 desde el backend, evitando CORS
 */

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = 3001;

// Configuración de B2
const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketId: 'cc12bbd592366bde909b0a1a',
  bucketName: 'mixercur'
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

// Variables para tokens
let authData = null;
let uploadUrl = null;
let uploadAuthToken = null;

// Autenticar con B2
async function authenticate() {
  if (authData) return authData;

  try {
    const response = await axios.post('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {}, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_CONFIG.applicationKeyId}:${B2_CONFIG.applicationKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    authData = response.data;
    console.log('B2 Authentication successful');
    console.log('API URL:', authData.apiUrl);
    return authData;
  } catch (error) {
    console.error('B2 Authentication error:', error.response?.data || error.message);
    throw error;
  }
}

// Obtener URL de upload usando la API nativa
async function getUploadUrl() {
  if (uploadUrl && uploadAuthToken) {
    return { uploadUrl, uploadAuthToken };
  }

  const auth = await authenticate();

  try {
    // Usar el apiUrl correcto de la autenticación
    const response = await axios.post(`${auth.apiUrl}/b2api/v2/b2_get_upload_url`, {
      bucketId: B2_CONFIG.bucketId
    }, {
      headers: {
        'Authorization': auth.authorizationToken,
        'Content-Type': 'application/json'
      }
    });

    uploadUrl = response.data.uploadUrl;
    uploadAuthToken = response.data.authorizationToken;
    
    console.log('Upload URL obtained successfully:', uploadUrl);
    return { uploadUrl, uploadAuthToken };
  } catch (error) {
    console.error('Get upload URL error:', error.response?.data || error.message);
    throw error;
  }
}

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

    // Obtener URL de upload
    const { uploadUrl, uploadAuthToken } = await getUploadUrl();

    // Generar nombre de archivo
    const fileName = `audio/${userId}/${Date.now()}_${req.file.originalname}`;

    console.log('Uploading to B2:', fileName);

    // Subir archivo a B2
    const response = await axios.post(uploadUrl, req.file.buffer, {
      headers: {
        'Authorization': uploadAuthToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'X-Bz-Content-Type': req.file.mimetype,
        'X-Bz-Content-Sha1': 'do_not_verify'
      }
    });

    // Construir URL de descarga
    const downloadUrl = `https://f000.backblazeb2.com/file/${B2_CONFIG.bucketName}/${fileName}`;
    
    console.log('File uploaded successfully:', downloadUrl);
    
    res.json({
      success: true,
      fileId: response.data.fileId,
      fileName: response.data.fileName,
      downloadUrl: downloadUrl,
      fileSize: req.file.size,
      contentType: req.file.mimetype
    });

  } catch (error) {
    console.error('Upload error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.response?.data?.message || error.message 
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
