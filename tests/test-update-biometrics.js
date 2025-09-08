// Test para /update-biometrics Edge Function
// Proyecto: axceopptditbopbmoomh

// Configuración para testing local vs producción
const IS_LOCAL = true; // Cambiar a false para probar en producción

const BASE_URL = IS_LOCAL 
  ? 'http://127.0.0.1:54321/functions/v1' 
  : 'https://axceopptditbopbmoomh.supabase.co/functions/v1';
  
const ENDPOINT = '/update-biometrics';

// JWT Token obtenido del usuario de prueba (local o producción según IS_LOCAL)
const JWT_TOKEN = IS_LOCAL 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJmZDQxYzNhZi0xMGViLTQxZGYtOWExNy01ZDhhNGU2ZDU2ZjciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3MjcyODgxLCJpYXQiOjE3NTcyNjkyODEsImVtYWlsIjoidGVzdEBib2R5d2VpZ2h0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGJvZHl3ZWlnaHQuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmQ0MWMzYWYtMTBlYi00MWRmLTlhMTctNWQ4YTRlNmQ1NmY3In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTcyNjkyODF9XSwic2Vzc2lvbl9pZCI6IjBhYjI0NWFlLWQxYjgtNGNkMy1hZGJmLTNjZDhlNWJjMjhkZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Vl4HuK7rUjKylWQ00ubC_LlH_0xr8jUH9sIWdhCRWkg'
  : 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im5GdXM3b1VnbzZ5aVdodmwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2F4Y2VvcHB0ZGl0Ym9wYm1vb21oLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjNTVmYmUwMy02YmY4LTRlZmItYTE1Ni0yMWUxMmExNTAxMGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3Mjc0NjEzLCJpYXQiOjE3NTcyNzEwMTMsImVtYWlsIjoidGVzdC1jbG91ZEBib2R5d2VpZ2h0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU3MjcxMDEzfV0sInNlc3Npb25faWQiOiJiM2RhZGM1MS1hOGE3LTRkNDktODBkMy0zMWEwZjAzYmViN2MiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.5YR3FTU2OJ7KjedGLS1CylFgjyJjnG9jc9xx4ZDgT9Q';

console.log(`🌍 Modo: ${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'}`);
console.log(`📍 URL Base: ${BASE_URL}`);

// Función para hacer la petición
async function testUpdateBiometrics(testData, testName) {
  console.log(`\n🧪 ${testName}`);
  console.log('📤 Enviando datos:', JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JWT_TOKEN}`,
        'X-Client-Info': 'test-suite/1.0.0'
      },
      body: JSON.stringify(testData)
    });

    const responseData = await response.json();
    
    console.log('📊 Status:', response.status);
    console.log('📥 Respuesta:', JSON.stringify(responseData, null, 2));
    
    if (response.ok) {
      console.log('✅ Test exitoso');
      
      // Validate BMI calculation if data includes weight and height
      if (responseData.biometric_snapshot?.bmi && testData.weight) {
        console.log(`📊 BMI calculado: ${responseData.biometric_snapshot.bmi}`);
      }

      // Validate updated fields
      if (responseData.updated_fields) {
        console.log(`🔄 Campos actualizados: ${responseData.updated_fields.join(', ')}`);
      }
    } else {
      console.log('❌ Test falló');
    }
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.log('💥 Error de red:', error.message);
    return { error: error.message };
  }
}

// 🧪 Casos de test
async function runTests() {
  console.log('🚀 Iniciando tests para /update-biometrics');
  console.log('📍 URL:', `${BASE_URL}${ENDPOINT}`);
  
  // Test 1: Actualización de peso únicamente
  const weightUpdate = {
    weight: 76.5,
    data_source: "manual",
    notes: "Peso matutino después del desayuno"
  };

  // Test 2: Actualización completa de biométricos
  const completeUpdate = {
    weight: 75.8,
    body_fat_percentage: 17.2,
    resting_hr: 62,
    training_hr_avg: 148,
    sleep_hours: 8.0,
    sleep_quality: 4,
    fatigue_level: 2,
    data_source: "pre_routine",
    notes: "Datos pre-rutina - me siento bien"
  };

  // Test 3: Solo métricas de sueño y fatiga
  const recoveryUpdate = {
    sleep_hours: 6.5,
    sleep_quality: 3,
    fatigue_level: 4,
    hrv_trend: 45.2,
    data_source: "manual",
    notes: "Mala noche de sueño"
  };

  // Test 4: Datos inválidos (para probar validación)
  const invalidUpdate = {
    weight: -10, // peso negativo
    body_fat_percentage: 60, // fuera de rango
    sleep_hours: 25, // horas imposibles
    sleep_quality: 10, // fuera de rango 1-5
    fatigue_level: 0,  // fuera de rango 1-5
    data_source: "invalid_source", // fuente inválida
    notes: "Test de validación"
  };

  // Test 5: Request vacío (debería fallar)
  const emptyUpdate = {};

  // Ejecutar tests
  await testUpdateBiometrics(weightUpdate, "Test 1: Actualización de Peso");
  await testUpdateBiometrics(completeUpdate, "Test 2: Actualización Completa");
  await testUpdateBiometrics(recoveryUpdate, "Test 3: Métricas de Recuperación");
  await testUpdateBiometrics(invalidUpdate, "Test 4: Validación de Errores");
  await testUpdateBiometrics(emptyUpdate, "Test 5: Request Vacío");
  
  console.log('\n🏁 Tests completados');
}

// Ejecutar solo si se llama directamente
if (typeof module === 'undefined') {
  runTests();
}

// Para Node.js
if (typeof module !== 'undefined') {
  module.exports = { testUpdateBiometrics, runTests };
}