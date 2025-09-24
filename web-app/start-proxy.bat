@echo off
echo 🚀 Iniciando Proxy Backend para B2...
echo.

echo 📦 Instalando dependencias...
npm install express multer cors

echo.
echo 🔧 Iniciando servidor proxy en puerto 3001...
node proxy-server.js

pause
