# Algoritmo Adaptativo de Entrenamiento de Fuerza Corporal

## 1. ARQUITECTURA DEL ALGORITMO

### 1.1 Variables de Estado del Usuario
```
UserState = {
  // Datos antropométricos
  age: number,
  weight: number,
  body_fat_percentage: number,
  
  // Métricas fisiológicas
  resting_hr: number,
  training_hr_avg: number,
  hrv_trend: number, // Variabilidad de frecuencia cardíaca
  
  // Historial de rendimiento
  training_history: TrainingSession[],
  current_fitness_level: number, // 1-10 escala calculada
  adherence_rate: number, // % entrenamientos completados últimas 4 semanas
  
  // Estado de recuperación
  last_training_date: date,
  sleep_quality: number, // 1-5
  sleep_hours: number,
  fatigue_level: number, // 1-5 autoreportado
  
  // Progresión actual
  current_progressions: ExerciseProgression[]
}
```

### 1.2 Sistema de Puntuación de Ejercicios
Cada ejercicio tiene un valor de dificultad base (1-10) que se modifica según variantes:

**Ejemplo: Push-ups**
- Knee push-ups: 2.0
- Standard push-ups: 4.0
- Diamond push-ups: 6.0
- Archer push-ups: 7.5
- One-arm push-ups: 9.0

## 2. MOTOR DE DECISIÓN ADAPTATIVO

### 2.1 Cálculo del Índice de Capacidad Actual (ICA)
```
ICA = (fitness_level × adherence_rate × recovery_factor × progression_velocity) / detraining_factor

Donde:
- fitness_level: 1-10 basado en rendimiento histórico
- adherence_rate: 0.5-1.0 (últimas 4 semanas)
- recovery_factor: 0.7-1.2 basado en sueño y fatiga
- progression_velocity: 0.8-1.3 velocidad de mejora reciente
- detraining_factor: 1.0-1.4 penalización por inactividad
```

### 2.2 Factores de Ajuste por Condición

#### A) Factor de Recuperación (FR)
```
sleep_score = (sleep_hours × sleep_quality) / 20
fatigue_adjustment = (6 - fatigue_level) / 5
days_since_last = min(days_since_last_training, 7)

FR = (sleep_score × fatigue_adjustment × recovery_curve[days_since_last])

recovery_curve = [1.0, 1.05, 1.02, 0.98, 0.94, 0.89, 0.84] // días 0-6
```

#### B) Factor de Adherencia (FA)
```
completion_rate_4w = entrenamientos_completados / entrenamientos_planificados
consistency_bonus = streak_days > 14 ? 1.1 : 1.0

FA = completion_rate_4w × consistency_bonus
```

#### C) Factor de Progresión (FP)
```
recent_improvements = sum(mejoras_últimas_3_sesiones) / 3
stagnation_penalty = weeks_without_progress > 2 ? 0.9 : 1.0

FP = (1 + recent_improvements) × stagnation_penalty
```

### 2.3 Matriz de Decisión de Adaptación

| Condición Detectada | ICA Range | Acción del Algoritmo |
|-------------------|-----------|---------------------|
| Rendimiento excelente + alta adherencia | ICA > 8.5 | Incremento agresivo: +15-20% volumen/dificultad |
| Progresión estable | ICA 7.0-8.5 | Incremento moderado: +8-12% |
| Meseta de rendimiento | ICA 5.5-7.0 | Variación de estímulos, mismo volumen |
| Declive en rendimiento | ICA 4.0-5.5 | Reducción: -10-15% volumen |
| Desentrenamiento severo | ICA < 4.0 | Reseteo: -25-40% volver a fundamentos |

## 3. LÓGICA DE PROGRESIÓN POR EJERCICIO

### 3.1 Sistema de Progresión Jerárquica
Cada ejercicio sigue una secuencia lógica de dificultad:

**Push Pattern Progression:**
```
Level 1: Wall push-ups (12-20 reps)
Level 2: Incline push-ups (8-15 reps)
Level 3: Knee push-ups (6-12 reps)
Level 4: Standard push-ups (5-10 reps)
Level 5: Diamond push-ups (4-8 reps)
Level 6: Archer push-ups (3-6 each side)
Level 7: One-arm push-ups (1-3 each side)
```

### 3.2 Criterios de Progresión
Un usuario avanza al siguiente nivel cuando:
- Completa el rango superior de repeticiones en 3 sesiones consecutivas
- Mantiene forma técnica adecuada (self-assessed o HR response)
- ICA > 6.0 (indica capacidad de adaptación)

### 3.3 Criterios de Regresión
El algoritmo reduce dificultad cuando:
- Falla en completar rango inferior en 2 sesiones seguidas
- ICA < 5.0 por factores de recuperación
- Autoinforme de dolor o molestias

## 4. GENERACIÓN DE ENTRENAMIENTOS

### 4.1 Estructura Base de Sesión
```
Sesión = {
  warm_up: MovementPattern[] (5-8 min),
  main_work: ExerciseBlock[] (20-35 min),
  cool_down: StretchSequence[] (5-10 min),
  
  total_volume_load: number,
  estimated_duration: number,
  intensity_target: number, // % esfuerzo percibido
  recovery_requirement: number // horas hasta próxima sesión
}
```

### 4.2 Algoritmo de Selección de Ejercicios

**Paso 1: Análisis de Patrón de Movimiento**
```
required_patterns = ["push", "pull", "squat", "hinge", "core", "locomotion"]
last_3_sessions_patterns = analyze_recent_patterns(training_history)
priority_patterns = identify_underworked_patterns(last_3_sessions_patterns)
```

**Paso 2: Selección Inteligente**
```
for each pattern in priority_patterns:
  current_level = user_progression[pattern]
  target_volume = calculate_target_volume(ICA, pattern, recovery_state)
  
  selected_exercise = select_exercise_variant(current_level, target_volume)
  adjust_sets_reps(selected_exercise, user_capacity, fatigue_level)
```

### 4.3 Periodización Adaptativa Semanal

**Microciclo Inteligente (7 días):**
- Día 1: Intensidad alta (ICA × 1.1) - Fuerza máxima
- Día 2: Activo o descanso según FR
- Día 3: Intensidad media (ICA × 0.9) - Volumen
- Día 4: Descanso activo - Movilidad
- Día 5: Intensidad alta (ICA × 1.05) - Potencia
- Día 6-7: Descanso según adherencia histórica

## 5. SISTEMA DE FEEDBACK Y APRENDIZAJE

### 5.1 Métricas de Evaluación Post-Entrenamiento
```
session_feedback = {
  rpe_reported: number, // 1-10 esfuerzo percibido
  completion_rate: number, // % ejercicios completados
  technical_quality: number, // autoevaluación forma
  enjoyment_level: number, // adherencia predictor
  recovery_feeling: number // preparación próxima sesión
}
```

### 5.2 Actualización Automática de Parámetros
```
// Después de cada sesión
update_fitness_level(completion_rate, progression_achieved)
update_exercise_progressions(performance_vs_target)
update_recovery_patterns(rpe_vs_predicted, sleep_correlation)
recalculate_ICA()

// Semanalmente
analyze_adherence_patterns()
adjust_difficulty_calibration()
update_exercise_preferences()
```

### 5.3 Detección de Patrones Problemáticos
```
warning_signals = {
  consecutive_incomplete_sessions: >= 3,
  declining_rpe_vs_performance: trend_negative,
  adherence_drop: < 60% última semana,
  stagnation_period: > 3 semanas sin progreso,
  overreaching_indicators: rpe > 8 + poor_sleep + high_fatigue
}
```

## 6. IMPLEMENTACIÓN PRÁCTICA: EJEMPLO DE FUNCIONAMIENTO

### Usuario Ejemplo: María, 32 años
```
Datos iniciales:
- Peso: 65kg, BF: 22%
- HR reposo: 68 bpm
- Nivel fitness: 4/10 (principiante-intermedio)
- Adherencia histórica: 75%
- Último entrenamiento: hace 3 días
- Sueño anoche: 7h, calidad 4/5
- Fatiga autoreportada: 2/5
```

### Cálculo ICA para María:
```
ICA = (4.0 × 0.75 × 1.05 × 1.1) / 1.0 = 3.47

Interpretación: Nivel medio-bajo, necesita progresión conservadora
```

### Decisión del Algoritmo:
- **Factor limitante detectado:** Fitness level bajo + adherencia moderada
- **Estrategia:** Consolidar fundamentos, incrementos pequeños
- **Intensidad objetivo:** 70-75% capacidad máxima
- **Volumen:** Sesiones 25-30 minutos

## 7. MEDIDAS DE SEGURIDAD Y LIMITACIONES

### 7.1 Controles de Seguridad Hardcoded
```
safety_checks = {
  max_weekly_volume_increase: 15%,
  max_session_duration: 45_minutes,
  min_rest_between_sessions: 24_hours,
  max_consecutive_training_days: 3,
  rpe_ceiling_beginner: 7/10,
  rpe_ceiling_advanced: 8.5/10
}
```

### 7.2 Señales de Alerta Automáticas
- RPE > 8 durante 2 sesiones consecutivas → Reducir intensidad obligatoria
- Adherencia < 50% en 2 semanas → Simplificar rutina drásticamente  
- Autoinforme de dolor → Pausa automática + recomendación médica
- HR en reposo +10% del baseline → Evaluar sobreentrenamiento

### 7.3 Validación de Progresiones
Antes de aumentar dificultad, verificar:
1. ¿Usuario completó rango de repeticiones objetivo 3 veces?
2. ¿ICA > 6.0 indica capacidad de adaptación?
3. ¿No hay señales de fatiga acumulada?
4. ¿Adherencia > 70% últimas 2 semanas?

**Solo si todas son SÍ → progresión automática aprobada**

---

*Este algoritmo aprende continuamente del usuario, priorizando siempre seguridad sobre rapidez de progresión, y adaptándose a las realidades de la vida diaria para maximizar adherencia a largo plazo.*