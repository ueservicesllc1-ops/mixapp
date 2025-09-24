@echo off
echo 🚀 Instalando dependencias del proxy backend...
echo.

cd /d "%~dp0"

echo 📦 Instalando express, multer, cors, axios...
npm install express multer cors axios

echo.
echo 🔧 Iniciando proxy backend en puerto 3001...
echo.
echo ✅ El proxy estará disponible en: http://localhost:3001
echo ✅ Endpoint de subida: http://localhost:3001/api/upload
echo.

node backend-proxy.js

pause
