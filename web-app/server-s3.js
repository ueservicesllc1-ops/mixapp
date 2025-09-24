/**
 * Servidor S3-Compatible para Backblaze B2
 * Usa AWS SDK para subir archivos a B2
 */

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const app = express();
const upload = multer();
app.use(cors());
app.use(express.json());

// Configuración de B2
const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketName: 'mixercur'
};

// Configura el cliente S3 para Backblaze
const s3 = new S3Client({
  region: "us-east-005",
  endpoint: "https://s3.us-east-005.backblazeb2.com",
  credentials: {
    accessKeyId: B2_CONFIG.applicationKeyId,
    secretAccessKey: B2_CONFIG.applicationKey,
  },
});

// Endpoint para subir archivos
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    // Generar nombre de archivo
    const fileName = `audio/${userId}/${Date.now()}_${req.file.originalname}`;

    console.log('Uploading to B2 S3:', fileName);

    const command = new PutObjectCommand({
      Bucket: B2_CONFIG.bucketName,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    });

    const result = await s3.send(command);
    
    // URL de descarga
    const downloadUrl = `https://s3.us-east-005.backblazeb2.com/${B2_CONFIG.bucketName}/${fileName}`;
    
    console.log('File uploaded successfully:', downloadUrl);
    
    res.json({ 
      success: true, 
      downloadUrl: downloadUrl,
      fileName: fileName,
      fileSize: req.file.size,
      contentType: req.file.mimetype,
      etag: result.ETag
    });

  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ 
      error: "Upload failed", 
      details: err.message 
    });
  }
});

// Endpoint de salud
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "B2 S3 Proxy Server running",
    bucket: B2_CONFIG.bucketName,
    endpoint: "https://s3.us-east-005.backblazeb2.com"
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 B2 S3 Proxy Server running on http://localhost:${PORT}`);
  console.log(`📁 Upload endpoint: http://localhost:${PORT}/api/upload`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🪣 Bucket: ${B2_CONFIG.bucketName}`);
  console.log(`🌐 Endpoint: https://s3.us-east-005.backblazeb2.com`);
});

module.exports = app;
