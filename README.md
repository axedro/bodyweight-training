# Bodyweight Training - Entrenamiento Adaptativo

Una aplicación full-stack completa que implementa un algoritmo adaptativo de entrenamiento de fuerza sin pesas, con versiones web y móvil.

## 🎯 Características Principales

### Algoritmo Adaptativo
- **Índice de Capacidad Actual (ICA)**: Calcula la capacidad del usuario basándose en múltiples factores
- **Progresión Inteligente**: Sistema de niveles de ejercicios que se adapta al progreso del usuario
- **Factores de Recuperación**: Considera sueño, fatiga y días de descanso
- **Personalización**: Se adapta a las preferencias y disponibilidad del usuario

### Funcionalidades
- **Onboarding Inteligente**: Recopila datos iniciales para personalizar el entrenamiento
- **Rutinas Diarias**: Genera rutinas adaptadas al día actual
- **Plan de 3 Días**: Muestra las próximas sesiones planificadas
- **Seguimiento de Progreso**: Historial completo con métricas de mejora
- **Registro de Bienestar**: Seguimiento de sueño, fatiga y estado de ánimo
- **Dashboard Interactivo**: Visualización de estadísticas y progreso

## 🏗️ Arquitectura

### Stack Tecnológico
- **Frontend Web**: Next.js 14 + TypeScript + TailwindCSS + ShadCN
- **Frontend Móvil**: React Native (Expo) + TypeScript + React Native Paper
- **Backend**: Supabase (PostgreSQL + Auth + API)
- **Algoritmo**: TypeScript compartido entre web y móvil
- **Monorepo**: Turbo para gestión de paquetes

### Estructura del Proyecto
```
bodyweight/
├── apps/
│   ├── web/                 # Aplicación Next.js
│   └── mobile/              # Aplicación React Native
├── packages/
│   └── shared/              # Tipos y algoritmo compartidos
├── supabase/
│   ├── migrations/          # Migraciones de base de datos
│   └── config.toml          # Configuración de Supabase
└── package.json             # Configuración del monorepo
```

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Supabase CLI (opcional para desarrollo local)

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd bodyweight
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Supabase

#### Opción A: Supabase Cloud (Recomendado)
1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Obtener las credenciales del proyecto
3. Crear archivo `.env.local` en `apps/web/`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Crear archivo `.env` en `apps/mobile/`:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Opción B: Supabase Local
```bash
# Instalar Supabase CLI
npm install -g supabase

# Iniciar Supabase local
supabase start

# Aplicar migraciones
supabase db reset
```

### 4. Construir paquetes compartidos
```bash
cd packages/shared
npm run build
```

### 5. Ejecutar las aplicaciones

#### Aplicación Web
```bash
cd apps/web
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`

#### Aplicación Móvil
```bash
cd apps/mobile
npm start
```
Usar Expo Go en tu dispositivo móvil para escanear el QR

## 📊 Base de Datos

### Tablas Principales
- **user_profiles**: Perfiles de usuario con datos de onboarding
- **exercises**: Catálogo de ejercicios con niveles de progresión
- **training_sessions**: Sesiones de entrenamiento completadas
- **session_exercises**: Ejercicios específicos de cada sesión
- **wellness_logs**: Registros diarios de bienestar
- **algorithm_state**: Estado del algoritmo para cada usuario

### Migraciones
Las migraciones se ejecutan automáticamente al iniciar Supabase:
- `001_initial_schema.sql`: Estructura base de la base de datos
- `002_seed_exercises.sql`: Ejercicios iniciales del catálogo

## 🧠 Algoritmo Adaptativo

### Componentes Principales

#### 1. Cálculo del ICA (Índice de Capacidad Actual)
```typescript
ICA = (fitness_level × adherence_rate × recovery_factor × progression_factor) / detraining_factor
```

#### 2. Factores de Ajuste
- **Factor de Recuperación**: Basado en sueño, fatiga y días desde último entrenamiento
- **Factor de Adherencia**: Tasa de completación de sesiones
- **Factor de Progresión**: Mejoras recientes en rendimiento
- **Factor de Desentrenamiento**: Penalización por inactividad

#### 3. Sistema de Progresión
- **7 Niveles**: Desde principiante hasta avanzado
- **Criterios de Avance**: 3 sesiones consecutivas exitosas
- **Criterios de Regresión**: 2 sesiones fallidas consecutivas

### Ejemplo de Uso
```typescript
import { AdaptiveTrainingAlgorithm } from '@bodyweight/shared';

const algorithm = new AdaptiveTrainingAlgorithm();
const trainingPlan = algorithm.generateTrainingPlan(userState, availableExercises);
```

## 🎨 Interfaz de Usuario

### Web (Next.js)
- **Diseño Responsivo**: Optimizado para desktop y móvil
- **Componentes ShadCN**: UI moderna y accesible
- **Navegación por Pestañas**: Dashboard, Historial, Progreso, Bienestar
- **Gráficas Interactivas**: Visualización de progreso con Recharts

### Móvil (React Native)
- **Navegación por Pestañas**: Sesión, Historial, Progreso, Perfil
- **Componentes Material Design**: React Native Paper
- **Experiencia Nativa**: Gestos y animaciones fluidas
- **Modo Offline**: Cache local de rutinas

## 🔧 Desarrollo

### Scripts Disponibles
```bash
# Desarrollo
npm run dev          # Ejecutar todas las aplicaciones
npm run web          # Solo aplicación web
npm run mobile       # Solo aplicación móvil

# Construcción
npm run build        # Construir todas las aplicaciones

# Supabase
npm run supabase:start    # Iniciar Supabase local
npm run supabase:stop     # Detener Supabase local
npm run db:reset          # Resetear base de datos
```

### Estructura de Código
- **TypeScript**: Tipado estático en todo el proyecto
- **ESLint**: Linting consistente
- **Prettier**: Formateo de código
- **Husky**: Git hooks para calidad de código

## 🧪 Testing

### Ejecutar Tests
```bash
npm run test        # Ejecutar todos los tests
npm run test:web    # Tests de la aplicación web
npm run test:mobile # Tests de la aplicación móvil
```

## 📱 Despliegue

### Web (Vercel)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Móvil (Expo)
```bash
cd apps/mobile
expo build:android  # Build para Android
expo build:ios      # Build para iOS
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

- **Documentación**: [Wiki del proyecto](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discord**: [Servidor de la comunidad](link-to-discord)

## 🙏 Agradecimientos

- **Supabase**: Por la infraestructura backend
- **Vercel**: Por el hosting de la aplicación web
- **Expo**: Por las herramientas de desarrollo móvil
- **ShadCN**: Por los componentes de UI
- **React Native Paper**: Por los componentes móviles

---

**Desarrollado con ❤️ para la comunidad de fitness**
