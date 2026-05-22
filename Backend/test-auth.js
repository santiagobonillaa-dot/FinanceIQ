// Test de autenticación
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000';

async function testAuth() {
  try {
    // Test de registro
    console.log('🔍 Test de registro...');
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456',
        name: 'Test',
        lastName: 'User'
      })
    });

    const registerData = await registerResponse.json();
    console.log('✅ Registro:', registerData);

    // Test de login
    console.log('\n🔍 Test de login...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login:', loginData);

    // Test de verificación
    if (loginData.data?.token) {
      console.log('\n🔍 Test de verificación...');
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${loginData.data.token}`
        }
      });

      const verifyData = await verifyResponse.json();
      console.log('✅ Verificación:', verifyData);
    }

    console.log('\n🎉 Todos los tests completados!');
  } catch (error) {
    console.error('❌ Error en tests:', error);
  }
}

testAuth();
