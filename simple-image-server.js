/**
 * Servidor simple para servir imágenes desde el disco duro
 * Ejecutar con: node simple-image-server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const IMAGES_FOLDER = 'C:\\Users\\ArtDesing\\Desktop'; // Carpeta Desktop

const server = http.createServer((req, res) => {
  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/') {
    // Listar imágenes disponibles
    fs.readdir(IMAGES_FOLDER, (err, files) => {
      if (err) {
        res.writeHead(500);
        res.end('Error reading directory');
        return;
      }

      const imageFiles = files.filter(file => 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
      );

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Imágenes Disponibles</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .image { margin: 10px; display: inline-block; text-align: center; }
            .image img { max-width: 200px; max-height: 200px; border: 1px solid #ccc; }
            .image a { display: block; margin-top: 5px; }
          </style>
        </head>
        <body>
          <h1>Imágenes Disponibles en tu PC</h1>
          <p>Copia la URL de la imagen que quieres usar en la app móvil:</p>
          ${imageFiles.map(file => `
            <div class="image">
              <img src="/image/${encodeURIComponent(file)}" alt="${file}">
              <a href="/image/${encodeURIComponent(file)}">${file}</a>
            </div>
          `).join('')}
        </body>
        </html>
      `;

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  } else if (req.url.startsWith('/image/')) {
    // Servir imagen específica
    const fileName = decodeURIComponent(req.url.replace('/image/', ''));
    const filePath = path.join(IMAGES_FOLDER, fileName);
    
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Image not found');
        return;
      }

      const ext = path.extname(fileName).toLowerCase();
      const contentType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      }[ext] || 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🖼️ Servidor de imágenes corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo imágenes desde: ${IMAGES_FOLDER}`);
  console.log(`📱 Usa estas URLs en la app móvil para subir imágenes`);
});
