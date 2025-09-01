
# 📋 **Plan de Sprints - Bodyweight Training App**

## ⚠️ **SPRINT 2.6: ARQUITECTURA UNIFICADA - EN PROGRESO**

### **🔧 LIMPIEZA ARQUITECTURAL CRÍTICA**

**Problema Detectado**: Implementaciones duplicadas causando conflictos
- ❌ Next.js API Routes (proxy innecesario)
- ❌ Edge Function Algorithm (implementación incorrecta)
- ❌ Shared Package Algorithm (correcto pero no usado)

**Solución**: **Solo Edge Functions** (preparado para móvil)

#### **T2.6 Tareas de Unificación**:
- [x] **T2.6.1**: Eliminar Next.js API Routes redundantes
- [x] **T2.6.2**: Copiar algoritmo correcto a Edge Functions  
- [x] **T2.6.3**: Actualizar frontend para llamar directamente Edge Functions
- [x] **T2.6.4**: Validar funcionamiento end-to-end
- [x] **T2.6.5**: Limpiar código obsoleto

### ✅ **RESULTADO**: Arquitectura Unificada Completada

**Estado Final**:
- ✅ **Una sola API**: Solo Supabase Edge Functions  
- ✅ **Un solo algoritmo**: Unificado en Edge Functions
- ✅ **Ejercicios reales**: Sin UUIDs falsos
- ✅ **Preparado para móvil**: Arquitectura multiplataforma
- ✅ **Frontend directo**: Sin proxies innecesarios

---

## 🎯 **Estado Previo (COMPLETADO)**

### ✅ **Infraestructura Base**
- [x] Monorepo configurado con Turbo
- [x] Supabase local configurado y funcionando
- [x] Base de datos con esquema inicial
- [x] Autenticación básica (web y móvil)
- [x] Onboarding básico (web y móvil)
- [x] Dashboard básico (web y móvil)
- [x] Algoritmo adaptativo base implementado
- [x] Tipos TypeScript compartidos

---

## 🚀 **SPRINT 1: MVP Web (Semana 1-2)**

### **Objetivo**: Tener una aplicación web funcional con todas las funcionalidades core

#### **Tareas Backend (Supabase)**
- [x] **T1.1**: Completar migraciones de base de datos
  - [x] Tabla `training_sessions` con feedback
  - [x] Tabla `exercise_progressions` 
  - [x] Tabla `wellness_logs`
  - [x] Políticas RLS para seguridad

- [x] **T1.2**: Implementar Edge Functions
  - [x] `generate-routine` - Genera rutina diaria
  - [x] `update-progressions` - Actualiza progresiones
  - [x] `calculate-ica` - Calcula ICA del usuario

#### **Tareas Frontend Web**
- [x] **T1.3**: Completar componentes de UI
  - [x] Componente de rutina diaria con ejercicios
  - [x] Timer de entrenamiento
  - [x] Formulario de feedback post-sesión
  - [x] Gráficas de progreso (Recharts)

- [x] **T1.4**: Integrar algoritmo adaptativo
  - [x] Conectar con Edge Functions
  - [x] Generar rutinas reales
  - [x] Mostrar plan de 3 días
  - [x] Calcular y mostrar ICA

- [x] **T1.5**: Funcionalidades de seguimiento
  - [x] Historial de entrenamientos
  - [x] Log de bienestar diario
  - [x] Métricas de progreso
  - [x] Notificaciones de recordatorio

#### **Tareas de Testing**
- [x] **T1.6**: Testing básico
  - [x] Test del algoritmo adaptativo
  - [x] Test de generación de rutinas
  - [x] Test de autenticación

---

## 🔧 **SPRINT 2: Integración Frontend-Backend (Semana 3-4)**

### **Objetivo**: Resolver los problemas de integración entre componentes y backend

#### **Estado del Problema**
- ✅ Todos los componentes individuales están implementados
- ✅ **CORREGIDO**: Botón de rutinas genera entrenamientos reales
- ✅ **CORREGIDO**: Dashboard muestra información real del usuario  
- ✅ **CORREGIDO**: Flujo end-to-end completamente conectado

#### **Tareas de Debugging e Integración**
- [x] **T2.1**: Debug de API endpoints y conectividad
  - [x] Verificar que /api/generate-routine responde correctamente
  - [x] Probar /api/calculate-ica con usuario real
  - [x] Validar /api/update-progressions con datos de sesión
  - [x] Revisar autenticación JWT en todas las llamadas
  - [x] Verificar configuración de CORS y variables de entorno
  - [x] Testear Edge Functions desde Supabase dashboard

- [x] **T2.2**: Seeding de base de datos y datos de prueba
  - [x] Crear datos de ejercicios base en tabla 'exercises'
  - [x] Poblar tabla 'exercise_progressions' con progresiones iniciales
  - [x] Asegurar que user_profiles tiene datos completos después del onboarding
  - [x] Verificar que el trigger de creación de perfil funciona
  - [x] Crear sesiones de ejemplo para testing

- [x] **T2.3**: Fixes del Dashboard y carga de datos
  - [x] Corregir loadDashboardData() - referencias incorrectas a userSession
  - [x] Implementar carga correcta de perfil de usuario en dashboard.tsx:53-61
  - [x] Verificar que routineService.getCurrentRoutine() funciona
  - [x] Arreglar calculateICA() para mostrar datos reales
  - [x] Corregir getTrainingHistory() query y display
  - [x] Testear ProgressCharts con datos reales

- [x] **T2.4**: Testing del flujo completo end-to-end
  - [x] Registro → Onboarding → Dashboard con datos
  - [x] Generar rutina → Ver ejercicios → Completar sesión
  - [x] Feedback de sesión → Actualización de progreso → Nuevo ICA
  - [x] Historial de entrenamientos → Gráficas de progreso
  - [x] Logout → Login → Persistencia de datos

- [x] **T2.5**: Algoritmo adaptativo para usuarios nuevos
  - [x] Implementar estimación automática de progresiones basada en onboarding
  - [x] Crear sistema de safety factors (30% reducción de intensidad)
  - [x] Método generateNewUserICA() para usuarios sin historial
  - [x] Seeding automático de progresiones en base de datos
  - [x] Testing con usuario completamente nuevo (0 sesiones, 0 progresiones)
  - [x] Validación de rutinas conservadoras y seguras

#### **Validaciones de Funcionalidad**
- [x] ✅ Usuario puede generar una rutina real con ejercicios
- [x] ✅ Dashboard muestra ICA calculado del usuario
- [x] ✅ Historial muestra entrenamientos completados
- [x] ✅ Gráficas muestran progreso con datos reales
- [x] ✅ Timer y feedback de sesión funcionan correctamente
- [x] ✅ **NUEVO**: Usuarios sin historial generan rutinas seguras automáticamente
- [x] ✅ **NUEVO**: Progresiones se crean automáticamente basadas en onboarding
- [x] ✅ **NUEVO**: Safety factors aplicados a usuarios nuevos (<3 sesiones)

---

## 📱 **SPRINT 3: MVP Móvil (Semana 5-6)**

### **Objetivo**: Replicar todas las funcionalidades web en móvil

#### **Tareas de Migración**
- [ ] **T3.1**: Migrar funcionalidades web a móvil
  - [ ] Componente de rutina diaria
  - [ ] Timer de entrenamiento
  - [ ] Formulario de feedback
  - [ ] Historial y progreso

- [ ] **T3.2**: Optimizaciones móviles
  - [ ] Navegación por pestañas
  - [ ] Gestos táctiles
  - [ ] Modo offline básico
  - [ ] Push notifications

#### **Tareas de UX/UI Móvil**
- [ ] **T3.3**: Experiencia móvil nativa
  - [ ] Animaciones fluidas
  - [ ] Feedback háptico
  - [ ] Modo oscuro
  - [ ] Accesibilidad

#### **Tareas de Testing**
- [ ] **T3.4**: Testing móvil
  - [ ] Test en iOS simulator
  - [ ] Test en Android emulator
  - [ ] Test de rendimiento

---

## 🔧 **SPRINT 4: Funcionalidades Avanzadas (Semana 7-8)**

### **Objetivo**: Implementar características avanzadas del algoritmo

#### **Tareas del Algoritmo**
- [ ] **T4.1**: Sistema de progresión inteligente
  - [ ] Detección automática de mesetas
  - [ ] Ajuste de dificultad automático
  - [ ] Recomendaciones de descanso
  - [ ] Alertas de sobreentrenamiento

- [ ] **T4.2**: Análisis de patrones
  - [ ] Detección de tendencias
  - [ ] Predicción de rendimiento
  - [ ] Optimización de rutinas
  - [ ] Personalización avanzada

#### **Tareas de Machine Learning**
- [ ] **T4.3**: Aprendizaje automático
  - [ ] Modelo de predicción de ICA
  - [ ] Clustering de patrones de usuario
  - [ ] Recomendaciones personalizadas
  - [ ] Optimización de parámetros

#### **Tareas de Analytics**
- [ ] **T4.4**: Analytics avanzados
  - [ ] Dashboard de métricas detalladas
  - [ ] Reportes de progreso
  - [ ] Comparativas con otros usuarios
  - [ ] Insights personalizados

---

## 🎨 **SPRINT 5: UX/UI Avanzada (Semana 9-10)**

### **Objetivo**: Mejorar significativamente la experiencia de usuario

#### **Tareas de Diseño**
- [ ] **T5.1**: Rediseño completo
  - [ ] Design system unificado
  - [ ] Componentes reutilizables
  - [ ] Iconografía personalizada
  - [ ] Micro-interacciones

- [ ] **T5.2**: Experiencia gamificada
  - [ ] Sistema de logros
  - [ ] Streaks de entrenamiento
  - [ ] Niveles de usuario
  - [ ] Competencia social

#### **Tareas de Accesibilidad**
- [ ] **T5.3**: Accesibilidad completa
  - [ ] Soporte para lectores de pantalla
  - [ ] Navegación por teclado
  - [ ] Contraste de colores
  - [ ] Tamaños de fuente adaptables

---

## 🚀 **SPRINT 6: Optimización y Despliegue (Semana 11-12)**

### **Objetivo**: Optimizar rendimiento y preparar para producción

#### **Tareas de Optimización**
- [ ] **T6.1**: Performance
  - [ ] Optimización de bundle
  - [ ] Lazy loading
  - [ ] Caching inteligente
  - [ ] CDN para assets

- [ ] **T6.2**: Escalabilidad
  - [ ] Arquitectura de microservicios
  - [ ] Load balancing
  - [ ] Base de datos optimizada
  - [ ] Monitoreo de performance

#### **Tareas de Despliegue**
- [ ] **T6.3**: CI/CD
  - [ ] Pipeline de deployment
  - [ ] Testing automatizado
  - [ ] Rollback automático
  - [ ] Monitoreo de errores

- [ ] **T6.4**: Producción
  - [ ] Configuración de producción
  - [ ] SSL y seguridad
  - [ ] Backup automático
  - [ ] Documentación de API

---

## 📊 **Métricas de Éxito por Sprint**

### **Sprint 1 (MVP Web)**
- ✅ Usuario puede registrarse y completar onboarding
- ✅ Algoritmo genera rutinas personalizadas
- ✅ Usuario puede completar entrenamientos
- ✅ Sistema guarda historial y progreso

### **Sprint 2 (Integración Frontend-Backend)**
- ✅ Botón de rutinas genera entrenamientos reales
- ✅ Dashboard muestra información real del usuario
- ✅ Flujo completo funciona de extremo a extremo
- ✅ Todas las APIs responden correctamente

### **Sprint 3 (MVP Móvil)**
- ✅ Todas las funcionalidades web funcionan en móvil
- ✅ Experiencia nativa fluida
- ✅ Sincronización entre web y móvil

### **Sprint 4 (Funcionalidades Avanzadas)**
- ✅ Algoritmo se adapta automáticamente
- ✅ Predicciones precisas de rendimiento
- ✅ Alertas inteligentes funcionan

### **Sprint 5 (UX/UI)**
- ✅ Puntuación de satisfacción > 4.5/5
- ✅ Tiempo de onboarding < 3 minutos
- ✅ Tasa de retención > 70% después de 7 días

### **Sprint 6 (Optimización y Producción)**
- ✅ Tiempo de carga < 2 segundos
- ✅ Disponibilidad > 99.9%
- ✅ Escalabilidad probada

---

## 🛠️ **Stack Tecnológico por Sprint**

### **Sprint 1-2 (MVP Web + Integración)**
- **Frontend**: Next.js, React Native, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **UI**: TailwindCSS, ShadCN, React Native Paper
- **Algoritmo**: TypeScript puro
- **Testing**: Manual testing, Supabase dashboard

### **Sprint 3 (MVP Móvil)**
- **Mobile**: React Native, Expo
- **State Management**: Context API, Zustand
- **Navigation**: React Navigation
- **Offline**: AsyncStorage, SQLite

### **Sprint 4 (Funcionalidades Avanzadas)**
- **ML**: TensorFlow.js o Python con API
- **Analytics**: Supabase Analytics + custom
- **Notificaciones**: Expo Notifications

### **Sprint 5-6 (UX/UI + Producción)**
- **Deployment**: Vercel, Expo EAS
- **Monitoring**: Sentry, LogRocket
- **Testing**: Jest, Cypress, Detox

---

## 📅 **Cronograma Detallado**

| Sprint | Semana | Foco | Entregables |
|--------|--------|------|-------------|
| 1 | 1-2 | MVP Web | App web con componentes base |
| 2 | 3-4 | Integración Frontend-Backend | App web funcional completa |
| 3 | 5-6 | MVP Móvil | App móvil funcional completa |
| 4 | 7-8 | Funcionalidades Avanzadas | ML y analytics |
| 5 | 9-10 | UX/UI | Diseño premium |
| 6 | 11-12 | Optimización y Producción | App lista para usuarios |

---

## 🎯 **Próximos Pasos Inmediatos**

1. **Iniciar Sprint 2**: Enfocarse en la integración frontend-backend
2. **Debug de rutinas**: Resolver por qué el botón de rutinas no funciona
3. **Testing de APIs**: Verificar que todos los endpoints responden
4. **Seeding de datos**: Poblar base de datos con ejercicios base

---

## 📝 **Notas de Seguimiento**

### **Sprint 1 - Progreso Actual**
- **Fecha de inicio**: 2025-08-31
- **Fecha de finalización objetivo**: 2025-09-14
- **Estado**: ✅ COMPLETADO (componentes implementados)
- **Tareas completadas**: 6/6
- **Próximo objetivo**: Sprint 2 (Integración Frontend-Backend)

### **Sprint 2 - Estado Actual**
- **Fecha de inicio**: 2025-08-31
- **Fecha de finalización objetivo**: 2025-09-14
- **Estado**: ✅ **COMPLETADO**
- **Logros**: Integración frontend-backend completa, algoritmo para usuarios nuevos
- **Tareas completadas**: T2.1, T2.2, T2.3, T2.4 + **T2.5** (Algoritmo para Usuarios Nuevos)

### **🆕 Sprint 2.5 - Algoritmo para Usuarios Nuevos (2025-09-01)**
- **Estado**: ✅ **COMPLETADO**
- **Problema resuelto**: Usuarios nuevos sin historial no podían generar rutinas
- **Implementación**: Estimación conservadora de progresiones + safety factors
- **Resultado**: Rutinas seguras desde el primer día para cualquier usuario

### **🔄 Cambios Recientes de Autenticación (2025-08-31)**

#### **Sistema de Autenticación Completamente Reescrito**
- **Problema Original**: Sistema de autenticación con múltiples errores:
  - Spinners infinitos en carga
  - Problemas de persistencia de sesión
  - Timeouts en consultas de base de datos
  - Problemas con cookies vs localStorage
  - Onboarding fallaba al completar

- **Solución Implementada**: Reescritura completa con arquitectura basada en estados
  ```typescript
  type AppState = 'loading' | 'auth' | 'onboarding' | 'dashboard'
  ```

#### **Componentes Reescritos**

**1. Componente Principal (`page.tsx`)**
- ✅ Estados de navegación centralizados
- ✅ Gestión apropiada de sesiones Supabase
- ✅ Logging comprehensivo con emojis para debugging
- ✅ Verificación de perfil de usuario automática
- ✅ Flujo de logout funcional

**2. Componente de Autenticación (`auth.tsx`)**
- ✅ Arquitectura basada en callbacks
- ✅ Auto-login después de registro exitoso
- ✅ Manejo robusto de errores
- ✅ Formularios duales (login/signup) con validación

**3. Componente de Onboarding (`onboarding.tsx`)**
- ✅ **NUEVO**: Flujo multi-paso (3 pantallas)
  - **Paso 1**: Información Básica (edad, peso, altura)
  - **Paso 2**: Experiencia Fitness (nivel, años, días disponibles)  
  - **Paso 3**: Preferencias (duración, intensidad)
- ✅ Barra de progreso visual y contador de pasos
- ✅ Validación por pasos
- ✅ Navegación anterior/siguiente
- ✅ UX mejorada con emojis y descripciones detalladas
- ✅ Mensaje motivacional en paso final

**4. Componente Dashboard (`dashboard.tsx`)**
- ✅ Arquitectura basada en props
- ✅ Integración con sistema de logout por callback
- ✅ Corrección de referencias de variables

#### **Mejoras de Base de Datos**
- ✅ Trigger automático para creación de perfiles de usuario
- ✅ Manejo de errores de timeout mejorado
- ✅ Operaciones UPDATE en lugar de UPSERT para mejor control

#### **Sistema de Debugging**
- ✅ Logging consistente con prefijos de emoji:
  - 🚀 Inicialización
  - 🔐 Autenticación
  - 📝 Registro/Updates
  - 👤 Operaciones de perfil
  - ❌ Errores
  - ✅ Operaciones exitosas

### **Log de Cambios**
- **2025-08-31** - ✅ Completado Sprint 1 MVP Web
- **2025-08-31** - ✅ Reescritura completa sistema de autenticación
- **2025-08-31** - ✅ Implementado onboarding multi-paso con UX mejorada
- **2025-08-31** - ✅ Todos los componentes de UI funcionales y conectados
- **2025-08-31** - ✅ Integración completa con algoritmo adaptativo
- **2025-08-31** - ✅ Base de datos con triggers automáticos funcionando

---

## 🚨 **Riesgos y Mitigaciones**

### **Riesgos Técnicos**
- **Algoritmo complejo**: Mitigación - Implementación incremental
- **Integración Supabase**: Mitigación - Testing temprano
- **Performance móvil**: Mitigación - Optimización continua

### **Riesgos de Timeline**
- **Scope creep**: Mitigación - Definir MVP claramente
- **Dependencias externas**: Mitigación - Plan B para cada dependencia
- **Testing insuficiente**: Mitigación - Testing automatizado desde el inicio


