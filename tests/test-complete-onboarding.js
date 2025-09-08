// Test para /complete-onboarding Edge Function
// Proyecto: axceopptditbopbmoomh

// Configuración para testing local vs producción
const IS_LOCAL = false; // Cambiar a false para probar en producción

const BASE_URL = IS_LOCAL 
  ? 'http://127.0.0.1:54321/functions/v1' 
  : 'https://axceopptditbopbmoomh.supabase.co/functions/v1';
  
const ENDPOINT = '/complete-onboarding';

// JWT Token obtenido del usuario de prueba (local o producción según IS_LOCAL)
const JWT_TOKEN = IS_LOCAL 
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJmZDQxYzNhZi0xMGViLTQxZGYtOWExNy01ZDhhNGU2ZDU2ZjciLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3MjcyODgxLCJpYXQiOjE3NTcyNjkyODEsImVtYWlsIjoidGVzdEBib2R5d2VpZ2h0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0QGJvZHl3ZWlnaHQuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiZmQ0MWMzYWYtMTBlYi00MWRmLTlhMTctNWQ4YTRlNmQ1NmY3In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NTcyNjkyODF9XSwic2Vzc2lvbl9pZCI6IjBhYjI0NWFlLWQxYjgtNGNkMy1hZGJmLTNjZDhlNWJjMjhkZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.Vl4HuK7rUjKylWQ00ubC_LlH_0xr8jUH9sIWdhCRWkg'
  : 'eyJhbGciOiJIUzI1NiIsImtpZCI6Im5GdXM3b1VnbzZ5aVdodmwiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2F4Y2VvcHB0ZGl0Ym9wYm1vb21oLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJjNTVmYmUwMy02YmY4LTRlZmItYTE1Ni0yMWUxMmExNTAxMGYiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzU3Mjc0NjEzLCJpYXQiOjE3NTcyNzEwMTMsImVtYWlsIjoidGVzdC1jbG91ZEBib2R5d2VpZ2h0LmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJyb2xlIjoiYXV0aGVudGljYXRlZCIsImFhbCI6ImFhbDEiLCJhbXIiOlt7Im1ldGhvZCI6InBhc3N3b3JkIiwidGltZXN0YW1wIjoxNzU3MjcxMDEzfV0sInNlc3Npb25faWQiOiJiM2RhZGM1MS1hOGE3LTRkNDktODBkMy0zMWEwZjAzYmViN2MiLCJpc19hbm9ueW1vdXMiOmZhbHNlfQ.5YR3FTU2OJ7KjedGLS1CylFgjyJjnG9jc9xx4ZDgT9Q';

console.log(`🌍 Modo: ${IS_LOCAL ? 'LOCAL' : 'PRODUCCIÓN'}`);
console.log(`📍 URL Base: ${BASE_URL}`);

// Helper function to calculate age (for verification)
function calculateAge(birthDate) {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Función para hacer la petición
async function testCompleteOnboarding(testData, testName) {
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
      
      // Validate age calculation if data includes birth_date
      if (testData.birth_date && responseData.calculated_values?.age) {
        const expectedAge = calculateAge(testData.birth_date);
        const receivedAge = responseData.calculated_values.age;
        console.log(`🎂 Edad calculada: ${receivedAge}, esperada: ${expectedAge}`);
        if (receivedAge === expectedAge) {
          console.log('✅ Cálculo de edad correcto');
        } else {
          console.log('❌ Cálculo de edad incorrecto');
        }
      }
      
      // Validate BMI calculation
      if (testData.weight && testData.height && responseData.calculated_values?.bmi) {
        const expectedBMI = Math.round((testData.weight / Math.pow(testData.height / 100, 2)) * 10) / 10;
        const receivedBMI = responseData.calculated_values.bmi;
        console.log(`📊 BMI calculado: ${receivedBMI}, esperado: ${expectedBMI}`);
        if (Math.abs(receivedBMI - expectedBMI) < 0.1) {
          console.log('✅ Cálculo de BMI correcto');
        } else {
          console.log('❌ Cálculo de BMI incorrecto');
        }
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
  console.log('🚀 Iniciando tests para /complete-onboarding');
  console.log('📍 URL:', `${BASE_URL}${ENDPOINT}`);
  
  // Test 1: Datos completos de onboarding
  const completeData = {
    birth_date: "1995-06-15",
    weight: 75.0,
    height: 180.0,
    body_fat_percentage: 18.0,
    resting_hr: 65,
    training_hr_avg: 145,
    sleep_hours: 7.5,
    sleep_quality: 4,
    fatigue_level: 2,
    fitness_level: "intermediate",
    experience_years: 3,
    activity_level: "moderate",
    available_days_per_week: 4,
    preferred_session_duration: 45,
    preferred_intensity: 0.7
  };

  // Test 2: Datos mínimos requeridos
  const minimalData = {
    birth_date: "1990-01-01",
    weight: 70.0,
    height: 175.0,
    sleep_hours: 7.0,
    sleep_quality: 4,
    fatigue_level: 2,
    fitness_level: "beginner",
    experience_years: 0,
    activity_level: "sedentary",
    available_days_per_week: 3,
    preferred_session_duration: 30,
    preferred_intensity: 0.5
  };

  // Test 3: Datos inválidos (para probar validación)
  const invalidData = {
    birth_date: "fecha-invalida",
    weight: -10, // peso negativo
    height: 50,  // altura muy baja
    sleep_hours: 25, // horas imposibles
    sleep_quality: 10, // fuera de rango 1-5
    fatigue_level: 0,  // fuera de rango 1-5
    fitness_level: "expert", // nivel inexistente
    experience_years: -1,
    activity_level: "invalid",
    available_days_per_week: 8, // más de 7 días
    preferred_session_duration: 5, // muy corto
    preferred_intensity: 2.0 // fuera de rango 0.1-1.0
  };

  // Ejecutar tests
  await testCompleteOnboarding(completeData, "Test 1: Datos Completos");
  await testCompleteOnboarding(minimalData, "Test 2: Datos Mínimos");
  await testCompleteOnboarding(invalidData, "Test 3: Validación de Errores");
  
  console.log('\n🏁 Tests completados');
}

// Ejecutar solo si se llama directamente
if (typeof module === 'undefined') {
  runTests();
}

// Para Node.js
if (typeof module !== 'undefined') {
  module.exports = { testCompleteOnboarding, runTests };
}