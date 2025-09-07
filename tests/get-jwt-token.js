// Script para obtener JWT token de Supabase
const BASE_URL = 'https://axceopptditbopbmoomh.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4Y2VvcHB0ZGl0Ym9wYm1vb21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU3MjI5MjAsImV4cCI6MjA0MTI5ODkyMH0.TanJRrWaIrWsU7_dO5lqYBuVJiW-YKHOUUi4T3VVKQ8';

// Credenciales de prueba
const TEST_USER = {
  email: 'test-user@bodyweight-app.com',
  password: 'TestPassword123!'
};

async function getJWTToken() {
  console.log('🔐 Obteniendo JWT Token...');
  console.log('📧 Email de prueba:', TEST_USER.email);
  
  try {
    // Intentar hacer login primero
    console.log('\n1️⃣ Intentando login...');
    let response = await fetch(`${BASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    let data = await response.json();
    
    // Si login falla, crear usuario
    if (!response.ok) {
      console.log('👤 Usuario no existe, creando nuevo usuario...');
      
      response = await fetch(`${BASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password
        })
      });

      data = await response.json();
      
      if (!response.ok) {
        throw new Error(`Error creating user: ${JSON.stringify(data)}`);
      }
      
      console.log('✅ Usuario creado exitosamente');
    } else {
      console.log('✅ Login exitoso');
    }

    if (data.access_token) {
      console.log('\n🎉 JWT Token obtenido:');
      console.log('🔑 Token:', data.access_token);
      console.log('👤 User ID:', data.user?.id);
      console.log('⏰ Expira en:', data.expires_in, 'segundos');
      
      return {
        token: data.access_token,
        user: data.user,
        expires_in: data.expires_in
      };
    } else {
      throw new Error('No access token in response');
    }
    
  } catch (error) {
    console.error('❌ Error obteniendo token:', error.message);
    console.log('\n💡 Alternativa manual:');
    console.log('1. Ve a: https://supabase.com/dashboard/project/axceopptditbopbmoomh/auth');
    console.log('2. Crea un usuario manualmente');
    console.log('3. Copia el JWT token desde el dashboard');
    throw error;
  }
}

// Ejecutar si se llama directamente
if (typeof module === 'undefined') {
  getJWTToken()
    .then(result => {
      console.log('\n📋 Para usar en tests:');
      console.log(`const JWT_TOKEN = '${result.token}';`);
    })
    .catch(err => process.exit(1));
}

module.exports = { getJWTToken, TEST_USER };