/**
 * Script de prueba para verificar la conexión a Backblaze B2
 * Ejecutar con: node test-b2-connection.js
 */

const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000011',
  applicationKey: 'K005LMrcuASqx5cA35/nlvZg63lHeS4',
  bucketId: 'cc12bbd592366bde909b0a1a',
  bucketName: 'mixercur'
};

async function testB2Connection() {
  console.log('🔍 Probando conexión a Backblaze B2...');
  
  try {
    // Paso 1: Autenticación
    console.log('\n1. Probando autenticación...');
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_CONFIG.applicationKeyId}:${B2_CONFIG.applicationKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!authResponse.ok) {
      throw new Error(`Auth failed: ${authResponse.status} ${authResponse.statusText}`);
    }

    const authData = await authResponse.json();
    console.log('✅ Autenticación exitosa');
    console.log(`   Account ID: ${authData.accountId}`);
    console.log(`   API URL: ${authData.apiUrl}`);

    // Paso 2: Obtener URL de upload
    console.log('\n2. Obteniendo URL de upload...');
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

    if (!uploadUrlResponse.ok) {
      throw new Error(`Get upload URL failed: ${uploadUrlResponse.status} ${uploadUrlResponse.statusText}`);
    }

    const uploadUrlData = await uploadUrlResponse.json();
    console.log('✅ URL de upload obtenida');
    console.log(`   Upload URL: ${uploadUrlData.uploadUrl}`);

    // Paso 3: Verificar bucket
    console.log('\n3. Verificando bucket...');
    const bucketResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_list_buckets', {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });

    if (!bucketResponse.ok) {
      throw new Error(`List buckets failed: ${bucketResponse.status} ${bucketResponse.statusText}`);
    }

    const bucketData = await bucketResponse.json();
    const targetBucket = bucketData.buckets.find(b => b.bucketId === B2_CONFIG.bucketId);
    
    if (targetBucket) {
      console.log('✅ Bucket encontrado');
      console.log(`   Bucket Name: ${targetBucket.bucketName}`);
      console.log(`   Bucket Type: ${targetBucket.bucketType}`);
      console.log(`   CORS Rules: ${targetBucket.corsRules ? targetBucket.corsRules.length : 0} reglas`);
    } else {
      console.log('❌ Bucket no encontrado');
      console.log('   Buckets disponibles:');
      bucketData.buckets.forEach(b => {
        console.log(`   - ${b.bucketName} (${b.bucketId})`);
      });
    }

    console.log('\n🎉 Prueba de conexión completada exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Configurar CORS en el panel de B2');
    console.log('2. Usar la configuración de cors-config.json');
    console.log('3. Probar la subida desde la aplicación web');

  } catch (error) {
    console.error('\n❌ Error en la prueba de conexión:');
    console.error(`   ${error.message}`);
    
    if (error.message.includes('401')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verificar applicationKeyId y applicationKey');
      console.log('   - Asegurar que las credenciales no hayan expirado');
    }
    
    if (error.message.includes('404')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   - Verificar bucketId y bucketName');
      console.log('   - Asegurar que el bucket existe');
    }
  }
}

// Ejecutar la prueba
testB2Connection();
