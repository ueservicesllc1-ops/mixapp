// Test directo de autenticación B2
const B2_CONFIG = {
  applicationKeyId: '005c2b526be0baa0000000013',
  applicationKey: 'K005m8BXxtQ9NsUuawN8oAr/XovXpks',
  bucketId: 'bc52ab9502b67bee909b0a1a',
  bucketName: 'newmixcur'
};

async function testB2Auth() {
  try {
    console.log('🔑 Testing B2 Authentication...');
    console.log('Key ID:', B2_CONFIG.applicationKeyId);
    console.log('Key (first 10 chars):', B2_CONFIG.applicationKey.substring(0, 10) + '...');
    console.log('Bucket ID:', B2_CONFIG.bucketId);
    console.log('Bucket Name:', B2_CONFIG.bucketName);
    
    // Test 1: Basic Authentication
    console.log('\n📡 Testing basic authentication...');
    const authResponse = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${B2_CONFIG.applicationKeyId}:${B2_CONFIG.applicationKey}`).toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Auth Status:', authResponse.status);
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.log('❌ Auth Error:', errorText);
      return;
    }

    const authData = await authResponse.json();
    console.log('✅ Authentication successful!');
    console.log('API URL:', authData.apiUrl);
    console.log('Download URL:', authData.downloadUrl);
    console.log('Account ID:', authData.accountId);

    // Test 2: List Buckets
    console.log('\n📦 Testing bucket access...');
    const bucketResponse = await fetch(`${authData.apiUrl}/b2api/v2/b2_list_buckets`, {
      method: 'POST',
      headers: {
        'Authorization': authData.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        accountId: authData.accountId
      })
    });

    if (bucketResponse.ok) {
      const buckets = await bucketResponse.json();
      console.log('✅ Buckets accessible!');
      console.log('Available buckets:', buckets.buckets.map(b => ({ 
        id: b.bucketId, 
        name: b.bucketName,
        type: b.bucketType 
      })));
      
      // Check if our bucket exists
      const ourBucket = buckets.buckets.find(b => b.bucketId === B2_CONFIG.bucketId);
      if (ourBucket) {
        console.log('✅ Our bucket found:', ourBucket.bucketName);
      } else {
        console.log('❌ Our bucket not found!');
      }
    } else {
      console.log('❌ Bucket access failed:', bucketResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testB2Auth();
