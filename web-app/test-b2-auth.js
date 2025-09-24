/**
 * Script de prueba para verificar autenticación B2
 */

// Configuración de B2 (misma que en proxy-server.js)
const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketId: 'cc12bbd592366bde909b0a1a',
  bucketName: 'mixercur'
};

async function testB2Auth() {
  console.log('🔐 Probando autenticación con B2...');
  console.log('📋 Configuración:');
  console.log('   Key ID:', B2_CONFIG.applicationKeyId);
  console.log('   Bucket ID:', B2_CONFIG.bucketId);
  console.log('   Bucket Name:', B2_CONFIG.bucketName);
  console.log('   Key (primeros 10 chars):', B2_CONFIG.applicationKey.substring(0, 10) + '...');
  console.log('');

  try {
    // Paso 1: Autenticar
    console.log('1️⃣ Intentando autenticar con B2...');
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_CONFIG.applicationKeyId}:${B2_CONFIG.applicationKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MixerCurse-App/1.0'
      }
    });

    console.log('   Status:', authResponse.status);
    console.log('   Status Text:', authResponse.statusText);

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error('❌ Error de autenticación:');
      console.error('   Response:', errorText);
      return;
    }

    const authData = await authResponse.json();
    console.log('✅ Autenticación exitosa!');
    console.log('   Token (primeros 20 chars):', authData.authorizationToken.substring(0, 20) + '...');
    console.log('   API URL:', authData.apiUrl);

    // Paso 2: Obtener URL de upload
    console.log('');
    console.log('2️⃣ Obteniendo URL de upload...');
    const uploadUrlResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_get_upload_url', {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bucketId: B2_CONFIG.bucketId
      })
    });

    console.log('   Status:', uploadUrlResponse.status);
    console.log('   Status Text:', uploadUrlResponse.statusText);

    if (!uploadUrlResponse.ok) {
      const errorText = await uploadUrlResponse.text();
      console.error('❌ Error obteniendo upload URL:');
      console.error('   Response:', errorText);
      return;
    }

    const uploadUrlData = await uploadUrlResponse.json();
    console.log('✅ Upload URL obtenida exitosamente!');
    console.log('   Upload URL:', uploadUrlData.uploadUrl);
    console.log('   Upload Token (primeros 20 chars):', uploadUrlData.authorizationToken.substring(0, 20) + '...');

    console.log('');
    console.log('🎉 ¡Todas las pruebas de B2 pasaron exitosamente!');
    console.log('   Las credenciales son válidas y funcionan correctamente.');

  } catch (error) {
    console.error('❌ Error durante la prueba:');
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Ejecutar la prueba
testB2Auth();
