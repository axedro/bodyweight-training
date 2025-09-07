# 🧪 Tests para Edge Functions

Esta carpeta contiene tests para todas las Edge Functions del sistema de entrenamiento adaptativo.

## 📋 Preparación

### 1. Obtener JWT Token

Para ejecutar los tests, necesitas un token JWT válido:

1. Ve al Dashboard de Supabase: https://supabase.com/dashboard/project/axceopptditbopbmoomh/auth
2. Crea un usuario de prueba o usa uno existente
3. Copia el JWT token del usuario
4. Reemplaza `'TU_JWT_TOKEN_AQUI'` en cada archivo de test

### 2. Instalación (si usas Node.js)

```bash
# Para tests con fetch API nativo (recomendado)
node tests/test-complete-onboarding.js

# O instala dependencias si necesitas módulos adicionales
npm install node-fetch # solo si es necesario
```

## 🚀 Ejecución de Tests

### Tests individuales:
```bash
# Test de onboarding
node tests/test-complete-onboarding.js

# Test de biométricos (próximamente)
node tests/test-update-biometrics.js
```

### Ejecutar todos los tests:
```bash
# Ejecuta el script principal de tests (próximamente)
node tests/run-all-tests.js
```

## 📊 Tests Disponibles

### 1. `/complete-onboarding` - ✅ Listo
- **Archivo**: `test-complete-onboarding.js`
- **Valida**: Cálculo de edad, BMI, validaciones de entrada
- **Cases**: Datos completos, mínimos, y validación de errores

### 2. `/update-biometrics` - 🔄 En desarrollo
- **Archivo**: `test-update-biometrics.js`
- **Valida**: Actualización parcial, validaciones, tracking temporal

### 3. `/get-training-history` - ⏳ Pendiente
- **Archivo**: `test-get-training-history.js`  
- **Valida**: Paginación, filtros, estadísticas

### 4. `/generate-routine` - ⏳ Pendiente
- **Archivo**: `test-generate-routine.js`
- **Valida**: Generación de rutina, ICA, balance muscular

### 5. Más funciones... ⏳ Pendiente

## 🎯 Casos de Test por Función

### `/complete-onboarding`
1. **Datos completos**: Todos los campos opcionales incluidos
2. **Datos mínimos**: Solo campos requeridos  
3. **Validación de errores**: Datos inválidos y fuera de rango
4. **Cálculos**: Verificación de edad y BMI

### Próximos tests...
- Casos de edge cases específicos
- Tests de rendimiento
- Tests de concurrencia

## 📝 Estructura de Response

Cada test valida la estructura esperada de las responses:

```json
{
  "success": true,
  "message": "...",
  "data": { /* datos específicos */ },
  "calculated_values": { /* valores calculados */ }
}
```

Y para errores:
```json
{
  "error": "Error message",
  "details": "Additional details"
}
```

## 🔧 Configuración de Proyecto

- **Project Ref**: `axceopptditbopbmoomh`
- **Base URL**: `https://axceopptditbopbmoomh.supabase.co/functions/v1`
- **Auth**: Bearer JWT tokens