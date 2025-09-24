/**
 * Script simple para probar B2 con la librería oficial
 */

const B2 = require('backblaze-b2');

// Configuración de B2
const b2Config = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketId: 'cc12bbd592366bde909b0a1a',
  bucketName: 'mixercur'
};

async function testB2Simple() {
  console.log('🔐 Probando B2 con librería oficial...');
  console.log('📋 Configuración:');
  console.log('   Key ID:', b2Config.applicationKeyId);
  console.log('   Bucket ID:', b2Config.bucketId);
  console.log('   Bucket Name:', b2Config.bucketName);
  console.log('   Key (primeros 10 chars):', b2Config.applicationKey.substring(0, 10) + '...');
  console.log('');

  try {
    // Crear instancia de B2
    const b2 = new B2({
      applicationKeyId: b2Config.applicationKeyId,
      applicationKey: b2Config.applicationKey
    });

    console.log('1️⃣ Autenticando con B2...');
    const auth = await b2.authorize();
    console.log('✅ Autenticación exitosa!');
    console.log('   API URL:', auth.data.apiUrl);
    console.log('   Download URL:', auth.data.downloadUrl);

    console.log('');
    console.log('2️⃣ Listando buckets...');
    const buckets = await b2.listBuckets();
    console.log('✅ Buckets obtenidos:');
    buckets.data.buckets.forEach(bucket => {
      console.log(`   - ${bucket.bucketName} (ID: ${bucket.bucketId})`);
    });

    // Verificar si nuestro bucket existe
    const ourBucket = buckets.data.buckets.find(b => b.bucketId === b2Config.bucketId);
    if (ourBucket) {
      console.log('✅ Nuestro bucket encontrado:', ourBucket.bucketName);
    } else {
      console.log('❌ Nuestro bucket NO encontrado en la lista');
    }

    console.log('');
    console.log('3️⃣ Obteniendo URL de upload...');
    const uploadUrl = await b2.getUploadUrl({
      bucketId: b2Config.bucketId
    });
    console.log('✅ Upload URL obtenida exitosamente!');
    console.log('   Upload URL:', uploadUrl.data.uploadUrl);

    console.log('');
    console.log('🎉 ¡Todas las pruebas de B2 pasaron exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la prueba:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Status Text:', error.response.statusText);
      console.error('   Response:', error.response.data);
    }
  }
}

// Ejecutar la prueba
testB2Simple();
