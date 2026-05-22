import fetch from 'node-fetch';

async function getToken() {
  try {
    console.log('🔐 Obteniendo token de autenticación...');
    
    const response = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mongodb@financeiq.com',
        password: '12345678'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Token obtenido exitosamente:');
      console.log('Token:', data.data.token);
      console.log('Usuario:', data.data.user.email);
      
      return data.data.token;
    } else {
      console.log('❌ Error al obtener token:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

getToken();
