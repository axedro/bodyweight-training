export interface UserProfile {
  id: string
  age?: number
  weight?: number
  height?: number
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  experience_years: number
  available_days_per_week: number
  current_fitness_score?: number
  adherence_rate?: number
  last_training_date?: string
  preferred_session_duration: number
  preferred_intensity: number
  sleep_quality?: number
  sleep_hours?: number
  fatigue_level?: number
}

export interface Exercise {
  id: string
  name: string
  category: 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'locomotion'
  difficulty_level: number
  progression_level: number
  muscle_groups: string[]
  instructions?: string
}

export interface UserExerciseProgression {
  id: string
  user_id: string
  exercise_id: string
  current_level: number
  consecutive_completions: number
  last_attempted_date?: string
  last_completed_date?: string
  personal_best_reps?: number
  personal_best_sets?: number
  is_active: boolean
  exercises?: Exercise
}

export interface TrainingSession {
  id: string
  user_id: string
  session_date: string
  status: 'planned' | 'in_progress' | 'completed' | 'skipped'
  planned_duration?: number
  actual_duration?: number
  intensity_target?: number
  actual_intensity?: number
  ica_score?: number
  session_exercises?: SessionExercise[]
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  sets_planned: number
  reps_planned: number
  sets_completed?: number
  reps_completed?: number
  rpe_reported?: number
  technical_quality?: number
  enjoyment_level?: number
  exercises?: Exercise
}

export interface ExerciseBlock {
  exercise: Exercise
  sets: number
  reps: number
  rest_seconds: number
  progression_level: number
  target_rpe: number
}

export interface GeneratedSession {
  id: string
  date: string
  duration_minutes: number
  intensity: number
  exercise_blocks: ExerciseBlock[]
  warm_up: ExerciseBlock[]
  cool_down: ExerciseBlock[]
  focus_areas: string[]
  notes?: string
}

export interface TrainingPlan {
  current_session: GeneratedSession
  next_sessions: GeneratedSession[]
  ica_score: number
  recommendations: string[]
}

export interface MuscleGroupMetrics {
  id: string
  user_id: string
  muscle_group: string
  week_start: string
  total_sets: number
  total_reps: number
  avg_rpe: number
  imbalance_score: number
  relative_volume: number
}

export interface ExercisePerformanceData {
  id: string
  user_id: string
  exercise_id: string
  session_date: string
  muscle_groups: string[]
  reps_completed: number
  rpe_reported?: number
  technique_quality?: number
}

export interface ICAData {
  ica_score: number
  adherence_rate: number
  recovery_factor: number
  progression_velocity: number
  detraining_factor: number
  recent_performance: {
    sessions_last_4_weeks: number
    avg_rpe: number
    avg_completion_rate: number
    avg_technical_quality: number
  }
  user_state: {
    current_fitness_level: number
    fatigue_level: number
    last_training_date?: string
    days_since_last_training?: number
  }
  recommendations: string[]
}

export class AdaptiveTrainingAlgorithm {
  private readonly EXERCISE_CATEGORIES = ['push', 'pull', 'squat', 'hinge', 'core', 'locomotion'] as const
  private readonly WARMUP_CATEGORIES = ['warmup'] as const
  private readonly COOLDOWN_CATEGORIES = ['cooldown'] as const
  private readonly FITNESS_LEVELS = {
    beginner: 1.0,
    intermediate: 1.5,
    advanced: 2.0
  }
  
  private readonly NEW_USER_SAFETY_FACTOR = 0.7 // Reduce intensity by 30% for new users
  private readonly NEW_USER_THRESHOLD_SESSIONS = 3 // Consider "new" until 3 completed sessions

  /**
   * Estimate initial progression levels for new users based on onboarding data
   */
  estimateInitialProgressions(profile: UserProfile): { [category: string]: number } {
    const baseLevel = this.FITNESS_LEVELS[profile.fitness_level]
    const experienceBonus = Math.min(2, profile.experience_years * 0.5) // Max +2 levels from experience
    const ageAdjustment = profile.age ? Math.max(0, (30 - profile.age) * 0.05) : 0 // Slight bonus for younger users
    
    // Conservative estimation - start lower than expected
    const estimatedLevel = Math.max(1, Math.floor((baseLevel + experienceBonus + ageAdjustment) * 0.8))
    
    // Category-specific adjustments
    return {
      push: Math.max(1, estimatedLevel - 1), // Push-ups are typically harder
      pull: Math.max(1, estimatedLevel - 1), // Pull-ups are typically hardest
      squat: estimatedLevel, // Most people can squat decently
      hinge: Math.max(1, estimatedLevel - 1), // Hip hinges need practice
      core: estimatedLevel, // Core work is accessible
      locomotion: estimatedLevel + 1 // Walking/movement is easiest
    }
  }

  /**
   * Check if user is considered "new" and needs safety adjustments
   */
  isNewUser(recentSessions: TrainingSession[]): boolean {
    const completedSessions = recentSessions.filter(s => s.status === 'completed')
    return completedSessions.length < this.NEW_USER_THRESHOLD_SESSIONS
  }

  calculateICA(data: {
    profile: UserProfile
    progressions: UserExerciseProgression[]
    recentSessions: TrainingSession[]
    wellnessLogs: any[]
  }): ICAData {
    const { profile, recentSessions } = data
    
    // Check if user is new and needs special handling
    const isNew = this.isNewUser(recentSessions)
    
    // For brand new users (0 sessions), use conservative baseline ICA
    if (recentSessions.length === 0) {
      return this.generateNewUserICA(profile)
    }
    
    // Calculate adherence rate (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
    const recentSessionsLast4Weeks = recentSessions.filter(session => 
      new Date(session.session_date) >= fourWeeksAgo && 
      session.status === 'completed'
    )
    
    const expectedSessions = Math.floor(28 / 7 * (profile.available_days_per_week || 3))
    const actualSessions = recentSessionsLast4Weeks.length
    const adherence_rate = Math.min(actualSessions / Math.max(expectedSessions, 1), 1.0)

    // Calculate recovery factor (based on sleep and fatigue)
    const sleep_factor = profile.sleep_quality ? (profile.sleep_quality / 5) * 0.3 : 0.75
    const fatigue_factor = profile.fatigue_level ? (1 - (profile.fatigue_level - 1) / 4) * 0.3 : 0.75
    const recovery_factor = Math.max(sleep_factor + fatigue_factor + 0.4, 0.3)

    // Calculate progression velocity
    const completed_exercises = recentSessionsLast4Weeks
      .flatMap(s => s.session_exercises || [])
      .filter(se => se.sets_completed && se.reps_completed)

    const avg_rpe = completed_exercises.length > 0 ? 
      completed_exercises.reduce((sum, se) => sum + (se.rpe_reported || 5), 0) / completed_exercises.length : 5.0

    const avg_completion_rate = completed_exercises.length > 0 ?
      completed_exercises.reduce((sum, se) => {
        const completion = ((se.sets_completed || 0) * (se.reps_completed || 0)) / 
                          (se.sets_planned * se.reps_planned)
        return sum + Math.min(completion, 1)
      }, 0) / completed_exercises.length : 0.5

    const avg_technical_quality = completed_exercises.length > 0 ?
      completed_exercises.reduce((sum, se) => sum + (se.technical_quality || 3), 0) / completed_exercises.length : 3.0

    const progression_velocity = Math.min(
      (avg_completion_rate * 0.4) + 
      ((6 - Math.abs(avg_rpe - 7)) / 6 * 0.3) + 
      (avg_technical_quality / 5 * 0.3),
      2.0
    )

    // Calculate detraining factor
    const last_session = recentSessions.find(s => s.status === 'completed')
    const days_since_last = last_session ? 
      Math.floor((Date.now() - new Date(last_session.session_date).getTime()) / (24 * 60 * 60 * 1000)) : 30

    const detraining_factor = Math.max(1 - (days_since_last / 14) * 0.1, 0.7)

    // Calculate dynamic fitness score based on actual progress
    const dynamic_fitness_score = this.calculateDynamicFitnessScore(data, avg_completion_rate, avg_rpe, avg_technical_quality)
    
    // Calculate base fitness level
    const fitness_level_multiplier = this.FITNESS_LEVELS[profile.fitness_level] || 1.0
    const base_fitness = dynamic_fitness_score / 10

    // Final ICA calculation
    const ica_score = Math.max(
      (base_fitness * fitness_level_multiplier * adherence_rate * recovery_factor * progression_velocity) / detraining_factor,
      0.1
    )

    // Generate recommendations
    const recommendations: string[] = []
    if (adherence_rate < 0.6) recommendations.push("Aumenta la consistencia en tus entrenamientos")
    if (recovery_factor < 0.6) recommendations.push("Mejora tu calidad de sueño y manejo del estrés")
    if (avg_rpe > 8) recommendations.push("Reduce la intensidad para evitar sobreentrenamiento")
    if (avg_completion_rate < 0.7) recommendations.push("Ajusta la dificultad de los ejercicios")
    if (days_since_last > 7) recommendations.push("Retoma tu rutina de entrenamiento gradualmente")

    // Apply safety factor for new users
    const final_ica = isNew ? ica_score * this.NEW_USER_SAFETY_FACTOR : ica_score

    return {
      ica_score: Math.round(final_ica * 100) / 100,
      adherence_rate,
      recovery_factor,
      progression_velocity,
      detraining_factor,
      recent_performance: {
        sessions_last_4_weeks: actualSessions,
        avg_rpe,
        avg_completion_rate,
        avg_technical_quality
      },
      user_state: {
        current_fitness_level: base_fitness * 10,
        fatigue_level: profile.fatigue_level || 3,
        last_training_date: last_session?.session_date,
        days_since_last_training: days_since_last
      },
      recommendations
    }
  }

  /**
   * Generate conservative baseline ICA for brand new users
   */
  generateNewUserICA(profile: UserProfile): ICAData {
    const fitness_multiplier = this.FITNESS_LEVELS[profile.fitness_level] || 1.0
    const base_ica = 0.8 * fitness_multiplier // Conservative base
    const experience_bonus = Math.min(0.3, profile.experience_years * 0.1)
    
    // Age adjustment (younger users might handle more)
    const age_factor = profile.age ? Math.max(0.8, 1.2 - (profile.age - 25) * 0.01) : 1.0
    
    const ica_score = Math.max(0.1, Math.min(2.0, (base_ica + experience_bonus) * age_factor))

    const recommendations = [
      "¡Bienvenido! Empezaremos con rutinas suaves para evaluar tu nivel",
      "Es importante completar los primeros entrenamientos para personalizar tu programa",
      "Escucha a tu cuerpo y ajusta la intensidad según te sientas"
    ]

    // Add specific recommendations based on fitness level
    if (profile.fitness_level === 'beginner') {
      recommendations.push("Enfócate en la técnica correcta antes que en la intensidad")
    } else if (profile.fitness_level === 'advanced') {
      recommendations.push("Aunque seas avanzado, empezaremos conservadoramente para evaluar tus patrones de movimiento")
    }

    return {
      ica_score: Math.round(ica_score * 100) / 100,
      adherence_rate: 1.0, // Assume full adherence for new users
      recovery_factor: 0.8, // Assume good recovery initially
      progression_velocity: 1.0, // Neutral starting point
      detraining_factor: 1.0, // No detraining for new users
      recent_performance: {
        sessions_last_4_weeks: 0,
        avg_rpe: 5.0,
        avg_completion_rate: 1.0,
        avg_technical_quality: 3.5
      },
      user_state: {
        current_fitness_level: this.FITNESS_LEVELS[profile.fitness_level] * 2,
        fatigue_level: profile.fatigue_level || 2,
        last_training_date: undefined,
        days_since_last_training: undefined
      },
      recommendations
    }
  }

  generateTrainingPlan(data: {
    profile: UserProfile
    progressions: UserExerciseProgression[]
    recentSessions: TrainingSession[]
    icaData: ICAData
    daysToGenerate: number
    muscleGroupMetrics?: MuscleGroupMetrics[]
    exercisePerformance?: ExercisePerformanceData[]
  }): TrainingPlan {
    const { profile, progressions, icaData, muscleGroupMetrics, exercisePerformance, recentSessions } = data

    // NUEVO: Detectar alertas tempranas y factor de confianza
    const earlyWarnings = this.detectEarlyWarnings(recentSessions)
    const confidenceData = this.calculateConfidenceFactor(recentSessions)
    
    // NUEVO: Si el usuario está en crisis, generar rutina de rescate
    if (earlyWarnings.shouldTriggerRescue) {
      console.log(`🆘 ACTIVANDO RUTINA DE RESCATE para usuario. Alertas: ${earlyWarnings.warnings.join(', ')}`)
      
      const rescueSession = this.generateRescueRoutine(profile, progressions, icaData)
      
      return {
        current_session: rescueSession,
        next_sessions: [],
        ica_score: icaData.ica_score,
        recommendations: [
          ...icaData.recommendations,
          '🆘 MODO RESCATE ACTIVADO: Rutina simplificada para recuperar motivación',
          ...earlyWarnings.warnings,
          ...confidenceData.recommendations
        ]
      }
    }

    // Generate session using actual exercises from progressions with muscle group balance
    const current_session = this.generateSessionFromProgressions({
      profile,
      progressions,
      icaData,
      date: new Date().toISOString().split('T')[0],
      muscleGroupMetrics: muscleGroupMetrics || [],
      exercisePerformance: exercisePerformance || [],
      confidenceData: confidenceData,
      earlyWarnings: earlyWarnings
    })

    return {
      current_session,
      next_sessions: [], // Can add more sessions later if needed
      ica_score: icaData.ica_score,
      recommendations: [
        ...icaData.recommendations,
        ...confidenceData.recommendations,
        ...(earlyWarnings.isAtRisk ? [`⚠️ Riesgo ${earlyWarnings.riskLevel}: ${earlyWarnings.warnings[0]}`] : [])
      ]
    }
  }

  private generateSessionFromProgressions(data: {
    profile: UserProfile
    progressions: UserExerciseProgression[]
    icaData: ICAData
    date: string
    muscleGroupMetrics?: MuscleGroupMetrics[]
    exercisePerformance?: ExercisePerformanceData[]
    confidenceData?: any
    earlyWarnings?: any
  }): GeneratedSession {
    const { profile, progressions, icaData, muscleGroupMetrics, exercisePerformance, confidenceData, earlyWarnings } = data

    // Analyze muscle group priorities based on performance data
    const muscleGroupPriorities = this.analyzeMuscleGroupPriorities(muscleGroupMetrics || [], exercisePerformance || [])
    
    // Select exercises based on muscle group balance and user progressions
    const exercise_blocks: ExerciseBlock[] = []
    const selectedCategories = this.selectOptimalCategories(progressions, muscleGroupPriorities, 3)

    for (const category of selectedCategories) {
      const categoryProgressions = progressions.filter(p => 
        p.exercises?.category === category && p.is_active
      )
      
      // Select the best exercise for this category considering muscle group balance
      const selectedProgression = this.selectBestExerciseForBalance(
        categoryProgressions, 
        muscleGroupPriorities, 
        icaData.ica_score
      )
      
      if (selectedProgression && selectedProgression.exercises) {
        // NUEVO: Aplicar factor de confianza a las progresiones
        const adjustedICA = confidenceData ? icaData.ica_score * confidenceData.progressionMultiplier : icaData.ica_score
        
        const targetReps = this.calculateRepsForProgression(selectedProgression, adjustedICA)
        const sets = this.calculateOptimalSets(category, muscleGroupPriorities, adjustedICA)
        
        // NUEVO: Ajustar RPE basado en nivel de riesgo
        let targetRPE = Math.min(8, Math.round(adjustedICA + 2))
        if (earlyWarnings?.riskLevel === 'medium') {
          targetRPE = Math.max(4, targetRPE - 1) // Reducir RPE para usuarios en riesgo medio
        } else if (earlyWarnings?.riskLevel === 'high') {
          targetRPE = Math.max(3, targetRPE - 2) // Reducir más para usuarios en riesgo alto
        }
        
        exercise_blocks.push({
          exercise: selectedProgression.exercises,
          sets,
          reps: targetReps,
          rest_seconds: this.calculateRestTime(category, adjustedICA),
          progression_level: selectedProgression.current_level,
          target_rpe: targetRPE
        })
      }
    }

    // Create simple warm-up and cool-down from easy exercises
    const easyExercises = progressions.filter(p => 
      p.exercises && p.exercises.difficulty_level <= 2.5
    )
    
    const warm_up: ExerciseBlock[] = easyExercises.slice(0, 2).map(prog => ({
      exercise: prog.exercises!,
      sets: 1,
      reps: 8,
      rest_seconds: 30,
      progression_level: 1,
      target_rpe: 3
    }))

    const cool_down: ExerciseBlock[] = easyExercises.slice(-1).map(prog => ({
      exercise: prog.exercises!,
      sets: 1,
      reps: 15,
      rest_seconds: 0,
      progression_level: 1,
      target_rpe: 2
    }))

    // NUEVO: Generar notas mejoradas con información del algoritmo inteligente
    const algorithmNotes = [
      `ICA: ${icaData.ica_score.toFixed(1)}${confidenceData ? ` (Confianza: ${(confidenceData.confidenceScore * 100).toFixed(0)}%)` : ''}`,
      `Balance muscular: ${Object.entries(muscleGroupPriorities).filter(([_, priority]) => priority > 1.2).map(([group]) => group).join(', ') || 'equilibrado'}`,
      confidenceData && confidenceData.progressionMultiplier !== 1.0 ? 
        `Progresión ${confidenceData.progressionMultiplier > 1.0 ? 'acelerada' : 'conservadora'} (${(confidenceData.progressionMultiplier * 100).toFixed(0)}%)` : '',
      earlyWarnings?.isAtRisk ? `⚠️ ${earlyWarnings.riskLevel.toUpperCase()} risk detected` : ''
    ].filter(note => note).join(' | ')

    return {
      id: `session-${Date.now()}`,
      date: data.date,
      duration_minutes: profile.preferred_session_duration,
      intensity: icaData.ica_score / 10,
      warm_up,
      exercise_blocks,
      cool_down,
      focus_areas: selectedCategories,
      notes: `🧠 ALGORITMO MEJORADO: ${algorithmNotes}`
    }
  }

  private calculateRepsForProgression(progression: UserExerciseProgression, icaScore: number): number {
    const baseReps = progression.personal_best_reps || 8
    const icaMultiplier = Math.max(0.6, Math.min(1.4, icaScore / 5))
    return Math.max(3, Math.round(baseReps * icaMultiplier))
  }

  private generateSingleSession(data: {
    profile: UserProfile
    icaData: ICAData
    sessionNumber: number
    date: string
  }): GeneratedSession {
    const { profile, icaData, sessionNumber, date } = data

    // Adjust intensity based on ICA
    const base_intensity = profile.preferred_intensity
    const ica_adjustment = (icaData.ica_score - 1) * 0.1
    const session_intensity = Math.max(0.4, Math.min(1.0, base_intensity + ica_adjustment))

    // Generate exercise blocks
    const exercise_blocks: ExerciseBlock[] = []

    // Basic exercise structure for demo
    const session_exercises = [
      {
        name: "Push-ups",
        category: "push" as const,
        difficulty_level: 3.0 * icaData.ica_score,
        progression_level: Math.min(7, Math.floor(icaData.ica_score) + 1),
        muscle_groups: ["chest", "triceps", "shoulders"],
        instructions: "Mantén el cuerpo recto, baja hasta tocar el suelo con el pecho"
      },
      {
        name: "Bodyweight Squats",
        category: "squat" as const,
        difficulty_level: 2.5 * icaData.ica_score,
        progression_level: Math.min(7, Math.floor(icaData.ica_score) + 1),
        muscle_groups: ["quadriceps", "glutes", "hamstrings"],
        instructions: "Baja hasta que los muslos estén paralelos al suelo"
      },
      {
        name: "Plank",
        category: "core" as const,
        difficulty_level: 2.0 * icaData.ica_score,
        progression_level: Math.min(7, Math.floor(icaData.ica_score)),
        muscle_groups: ["core", "shoulders"],
        instructions: "Mantén el cuerpo recto como una tabla"
      }
    ]

    for (const exercise of session_exercises) {
      const base_reps = this.calculateReps(exercise.difficulty_level, session_intensity, profile.fitness_level)
      const sets = this.calculateSets(exercise.category, session_intensity)
      
      exercise_blocks.push({
        exercise: {
          id: `ex-${exercise.name.toLowerCase().replace(/\s+/g, '-')}`,
          ...exercise
        },
        sets,
        reps: base_reps,
        rest_seconds: this.calculateRest(exercise.category, session_intensity),
        progression_level: exercise.progression_level,
        target_rpe: Math.round(session_intensity * 10)
      })
    }

    // Generate warm-up
    const warm_up: ExerciseBlock[] = [
      {
        exercise: {
          id: "warmup-mobility",
          name: "Movilidad articular",
          category: "locomotion",
          difficulty_level: 1.0,
          progression_level: 1,
          muscle_groups: ["full-body"]
        },
        sets: 1,
        reps: 10,
        rest_seconds: 30,
        progression_level: 1,
        target_rpe: 3
      }
    ]

    // Generate cool-down
    const cool_down: ExerciseBlock[] = [
      {
        exercise: {
          id: "cooldown-stretch",
          name: "Estiramientos",
          category: "locomotion",
          difficulty_level: 1.0,
          progression_level: 1,
          muscle_groups: ["full-body"]
        },
        sets: 1,
        reps: 30,
        rest_seconds: 0,
        progression_level: 1,
        target_rpe: 2
      }
    ]

    return {
      id: `session-${date}-${sessionNumber}`,
      date,
      duration_minutes: profile.preferred_session_duration,
      intensity: session_intensity,
      exercise_blocks,
      warm_up,
      cool_down,
      focus_areas: ["strength", "endurance"],
      notes: `Rutina personalizada basada en tu ICA: ${icaData.ica_score.toFixed(1)}`
    }
  }

  private calculateReps(difficulty: number, intensity: number, fitness_level: string): number {
    const base_reps_by_level = {
      beginner: 8,
      intermediate: 12,
      advanced: 15
    }
    
    const base_reps = base_reps_by_level[fitness_level] || 10
    return Math.max(5, Math.round(base_reps * (0.7 + difficulty * 0.3) * intensity))
  }

  private calculateSets(category: string, intensity: number): number {
    const base_sets = category === 'core' ? 2 : 3
    return Math.max(1, Math.round(base_sets * (0.8 + intensity * 0.4)))
  }

  private calculateRest(category: string, intensity: number): number {
    const base_rest = {
      push: 90,
      pull: 90,
      squat: 120,
      hinge: 120,
      core: 60,
      locomotion: 60
    }
    
    const rest_seconds = base_rest[category as keyof typeof base_rest] || 90
    return Math.round(rest_seconds * (0.7 + intensity * 0.6))
  }

  /**
   * Analiza las prioridades de grupos musculares basado en métricas de rendimiento
   * MEJORADO: Incluye balance forzado y mínimos para piernas
   */
  private analyzeMuscleGroupPriorities(
    muscleGroupMetrics: MuscleGroupMetrics[], 
    exercisePerformance: ExercisePerformanceData[]
  ): { [muscleGroup: string]: number } {
    const priorities: { [muscleGroup: string]: number } = {}

    // Si no hay datos históricos, usar prioridades balanceadas CON ÉNFASIS EN PIERNAS
    if (!muscleGroupMetrics.length && !exercisePerformance.length) {
      return {
        'chest': 1.0, 'back': 1.0, 'shoulders': 1.0, 
        'quadriceps': 1.3, 'hamstrings': 1.3, 'glutes': 0.8, // Piernas prioritarias, glutes menos
        'core': 1.0, 'abs': 1.0
      }
    }

    // Analizar métricas semanales para identificar grupos con bajo volumen
    const totalVolume = muscleGroupMetrics.reduce((sum, metric) => sum + metric.total_sets, 0)
    const avgVolume = totalVolume / Math.max(1, muscleGroupMetrics.length)

    muscleGroupMetrics.forEach(metric => {
      // Mayor prioridad para grupos con menor volumen relativo
      const volumeRatio = metric.total_sets / Math.max(1, avgVolume)
      const imbalanceFactor = metric.imbalance_score / 100 // Normalizar
      
      // Prioridad basada en desequilibrio y bajo volumen
      priorities[metric.muscle_group] = Math.max(0.5, 2.0 - volumeRatio + imbalanceFactor)
    })

    // Analizar rendimiento reciente para ajustar prioridades
    const recentPerformance = exercisePerformance.slice(0, 20) // Últimas 20 entries
    recentPerformance.forEach(perf => {
      perf.muscle_groups?.forEach(group => {
        if (priorities[group]) {
          // Aumentar prioridad si RPE fue bajo (necesita más intensidad)
          if (perf.rpe_reported && perf.rpe_reported < 6) {
            priorities[group] = Math.min(2.0, priorities[group] * 1.1)
          }
          // Reducir prioridad si técnica fue mala (necesita recovery)
          if (perf.technique_quality && perf.technique_quality < 3) {
            priorities[group] = Math.max(0.3, priorities[group] * 0.9)
          }
        }
      })
    })

    // NUEVO: BALANCE FORZADO PARA PIERNAS
    return this.enforceMuscleBalance(priorities)
  }

  /**
   * Selecciona las categorías óptimas considerando balance de grupos musculares
   */
  private selectOptimalCategories(
    progressions: UserExerciseProgression[], 
    muscleGroupPriorities: { [muscleGroup: string]: number }, 
    maxCategories: number
  ): string[] {
    const categories = ['push', 'pull', 'squat', 'hinge', 'core']
    const categoryScores: { category: string, score: number }[] = []

    // NUEVO: Detectar desequilibrio crítico de piernas para forzar categorías
    const legMuscles = ['quadriceps', 'hamstrings']
    const avgLegPriority = legMuscles
      .map(muscle => muscleGroupPriorities[muscle] || 0)
      .reduce((sum, priority) => sum + priority, 0) / legMuscles.length

    const allMuscleAvg = Object.values(muscleGroupPriorities)
      .reduce((sum, priority) => sum + priority, 0) / Object.values(muscleGroupPriorities).length

    const legImbalanceRatio = avgLegPriority / allMuscleAvg
    const hasLegCrisis = legImbalanceRatio > 1.4 || avgLegPriority > 1.5 // Crisis si prioridad muy alta

    categories.forEach(category => {
      const categoryProgressions = progressions.filter(p => 
        p.exercises?.category === category && p.is_active
      )

      if (categoryProgressions.length === 0) {
        categoryScores.push({ category, score: 0 })
        return
      }

      // Calcular score basado en prioridades de grupos musculares que trabaja
      let totalScore = 0
      let muscleGroupsCount = 0

      categoryProgressions.forEach(prog => {
        if (prog.exercises?.muscle_groups) {
          prog.exercises.muscle_groups.forEach(group => {
            totalScore += muscleGroupPriorities[group] || 1.0
            muscleGroupsCount++
          })
        }
      })

      let avgScore = muscleGroupsCount > 0 ? totalScore / muscleGroupsCount : 1.0

      // FORZAR CATEGORÍAS DE PIERNAS en caso de crisis
      if (hasLegCrisis && (category === 'squat' || category === 'hinge')) {
        avgScore *= 2.0  // Duplicar score para forzar selección
      }

      categoryScores.push({ category, score: avgScore })
    })

    // GARANTIZAR AL MENOS UNA CATEGORÍA DE PIERNAS en crisis
    let selectedCategories = categoryScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxCategories)
      .map(item => item.category)

    if (hasLegCrisis) {
      const hasSquat = selectedCategories.includes('squat')
      const hasHinge = selectedCategories.includes('hinge')
      
      if (!hasSquat && !hasHinge && selectedCategories.length > 0) {
        // Reemplazar categoría de menor score con squat o hinge
        const legCategories = categoryScores
          .filter(c => c.category === 'squat' || c.category === 'hinge')
          .sort((a, b) => b.score - a.score)
        
        if (legCategories.length > 0) {
          selectedCategories[selectedCategories.length - 1] = legCategories[0].category
        }
      }
    }

    return selectedCategories
  }

  /**
   * Selecciona el mejor ejercicio para balance considerando grupos musculares
   */
  private selectBestExerciseForBalance(
    categoryProgressions: UserExerciseProgression[], 
    muscleGroupPriorities: { [muscleGroup: string]: number },
    icaScore: number
  ): UserExerciseProgression | null {
    if (!categoryProgressions.length) return null

    let bestProgression: UserExerciseProgression | null = null
    let highestScore = 0

    categoryProgressions.forEach(progression => {
      if (!progression.exercises) return

      // Calcular score basado en múltiples factores
      let muscleGroupScore = 0
      let groupCount = 0

      progression.exercises.muscle_groups?.forEach(group => {
        muscleGroupScore += muscleGroupPriorities[group] || 1.0
        groupCount++
      })

      const avgMuscleScore = groupCount > 0 ? muscleGroupScore / groupCount : 1.0
      
      // Factor de progresión (preferir ejercicios que el usuario puede progresar)
      const progressionFactor = progression.consecutive_completions >= 2 ? 1.2 : 
                              progression.consecutive_completions === 1 ? 1.0 : 0.8

      // Factor de adecuación al ICA
      const difficultyFactor = Math.max(0.5, 1.0 - Math.abs(progression.exercises.difficulty_level - icaScore) * 0.1)

      const totalScore = avgMuscleScore * progressionFactor * difficultyFactor

      if (totalScore > highestScore) {
        highestScore = totalScore
        bestProgression = progression
      }
    })

    return bestProgression
  }

  /**
   * Calcula el número óptimo de series considerando prioridades de grupos musculares
   */
  private calculateOptimalSets(
    category: string, 
    muscleGroupPriorities: { [muscleGroup: string]: number },
    icaScore: number
  ): number {
    // Sets base por categoría
    const baseSets = {
      push: 3, pull: 3, squat: 3, hinge: 3, core: 2, locomotion: 2
    }

    let baseValue = baseSets[category as keyof typeof baseSets] || 3

    // Ajustar basado en el ICA
    if (icaScore > 6) baseValue += 1
    else if (icaScore < 4) baseValue = Math.max(2, baseValue - 1)

    return baseValue
  }

  /**
   * Calcula el tiempo de descanso óptimo
   */
  private calculateRestTime(category: string, icaScore: number): number {
    const baseRest = {
      push: 90, pull: 90, squat: 120, hinge: 120, core: 60, locomotion: 60
    }
    
    const rest = baseRest[category as keyof typeof baseRest] || 90
    
    // Ajustar basado en ICA (mayor ICA = más intensidad = más descanso)
    const icaFactor = Math.max(0.8, Math.min(1.3, icaScore / 5))
    return Math.round(rest * icaFactor)
  }

  /**
   * NUEVO: Fuerza el balance muscular con mínimos obligatorios
   * Especialmente enfocado en corregir el sub-desarrollo de piernas
   */
  private enforceMuscleBalance(priorities: { [muscleGroup: string]: number }): { [muscleGroup: string]: number } {
    const balanced = { ...priorities }
    
    // UPDATED: Mínimos más agresivos basados en resultados de simulación
    // Simulación previa mostró piernas aún 30% sub-desarrolladas con mínimos 1.2
    const minimumPriorities = {
      'quadriceps': 1.5,    // CRÍTICO: Aumentado de 1.2 a 1.5 - Piernas aún sub-desarrolladas
      'hamstrings': 1.5,    // CRÍTICO: Aumentado de 1.2 a 1.5 - Piernas aún sub-desarrolladas
      'glutes': 0.6,        // REDUCIR MÁS: Reducido de 0.7 a 0.6 - Aún sobre-desarrollados
      'chest': 0.8,         // REDUCIR: Ligeramente sobre-desarrollados
      'back': 1.1,          // MANTENER: Buenos resultados (+39% mejora)
      'shoulders': 0.8,     // REDUCIR MÁS: Reducido de 0.9 a 0.8
      'core': 1.0,          // MANTENER: Buenos
      'abs': 1.0            // MANTENER: Buenos
    }
    
    // Calcular desequilibrio de piernas para activar modo super agresivo
    const legMuscles = ['quadriceps', 'hamstrings']
    const avgLegPriority = legMuscles
      .map(muscle => balanced[muscle] || 0)
      .reduce((sum, priority) => sum + priority, 0) / legMuscles.length

    const allMuscleAvg = Object.values(balanced)
      .reduce((sum, priority) => sum + priority, 0) / Object.values(balanced).length

    const legImbalanceRatio = avgLegPriority / allMuscleAvg
    
    // MODO SUPER AGRESIVO: Si piernas están >40% por debajo del promedio
    if (legImbalanceRatio < 0.6) {
      minimumPriorities.quadriceps = 1.8  // Forzar aún más
      minimumPriorities.hamstrings = 1.8
      minimumPriorities.glutes = 0.5      // Reducir músculo competidor
    }
    
    // Aplicar mínimos forzados
    Object.entries(minimumPriorities).forEach(([group, minimum]) => {
      if (balanced[group] !== undefined) {
        if (minimum > 1.0) {
          // Forzar mayor prioridad para grupos sub-desarrollados
          balanced[group] = Math.max(balanced[group], minimum)
        } else {
          // Limitar prioridad para grupos sobre-desarrollados
          balanced[group] = Math.min(balanced[group], minimum)
        }
      } else {
        balanced[group] = minimum
      }
    })
    
    // Detectar desequilibrios críticos (>40% diferencia)
    const avgPriority = Object.values(balanced).reduce((a, b) => a + b, 0) / Object.keys(balanced).length
    const criticalImbalances: string[] = []
    
    Object.entries(balanced).forEach(([group, priority]) => {
      const deviation = Math.abs(priority - avgPriority) / avgPriority
      if (deviation > 0.4) {
        criticalImbalances.push(group)
        // Ajustar hacia el promedio para reducir desequilibrio
        balanced[group] = priority * 0.8 + avgPriority * 0.2
      }
    })
    
    return balanced
  }

  /**
   * NUEVO: Sistema de detección de alerta temprana
   * Detecta usuarios en riesgo de abandono o declive
   */
  private detectEarlyWarnings(recentSessions: any[]): {
    isAtRisk: boolean
    riskLevel: 'low' | 'medium' | 'high'
    warnings: string[]
    shouldTriggerRescue: boolean
  } {
    const warnings: string[] = []
    let riskScore = 0
    
    if (recentSessions.length === 0) {
      return { isAtRisk: false, riskLevel: 'low', warnings: [], shouldTriggerRescue: false }
    }
    
    // Analizar últimas 6 sesiones (2 semanas aproximadamente)
    const recentSessions6 = recentSessions.slice(0, 6)
    const completedSessions = recentSessions6.filter(s => s.status === 'completed')
    
    // 1. ADHERENCIA CRÍTICA
    const adherenceRate = completedSessions.length / recentSessions6.length
    if (adherenceRate < 0.4) {
      warnings.push('Adherencia crítica: menos de 40% de sesiones completadas')
      riskScore += 3
    } else if (adherenceRate < 0.6) {
      warnings.push('Adherencia baja: menos de 60% de sesiones completadas')
      riskScore += 2
    }
    
    // 2. COMPLETION RATE DECLINANTE
    if (completedSessions.length >= 3) {
      const recentCompletionRates = completedSessions.slice(0, 3).map(s => {
        const sessionExercises = s.session_exercises || []
        return sessionExercises.length > 0 ? 
          sessionExercises.reduce((avg: number, se: any) => avg + (se.sets_completed || 0) / (se.sets_planned || 1), 0) / sessionExercises.length : 0
      })
      
      const avgRecentCompletion = recentCompletionRates.reduce((a, b) => a + b, 0) / recentCompletionRates.length
      
      if (avgRecentCompletion < 0.6) {
        warnings.push('Completion rate bajo: menos de 60% de ejercicios completados')
        riskScore += 2
      }
    }
    
    // 3. PATRÓN DE ABANDONO (3 sesiones consecutivas fallidas)
    let consecutiveFailures = 0
    for (const session of recentSessions6) {
      if (session.status !== 'completed') {
        consecutiveFailures++
      } else {
        break
      }
    }
    
    if (consecutiveFailures >= 3) {
      warnings.push('CRÍTICO: 3 o más sesiones consecutivas no completadas')
      riskScore += 4
    } else if (consecutiveFailures >= 2) {
      warnings.push('2 sesiones consecutivas no completadas')
      riskScore += 2
    }
    
    // 4. DECLIVE EN ICA
    if (recentSessions.length >= 6) {
      const earlyICA = recentSessions.slice(-3).map(s => s.ica_score || 1).reduce((a, b) => a + b, 0) / 3
      const recentICA = recentSessions.slice(0, 3).map(s => s.ica_score || 1).reduce((a, b) => a + b, 0) / 3
      const icaDecline = (earlyICA - recentICA) / earlyICA
      
      if (icaDecline > 0.15) {
        warnings.push('Declive significativo en ICA (>15%)')
        riskScore += 2
      }
    }
    
    // Determinar nivel de riesgo
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    let shouldTriggerRescue = false
    
    if (riskScore >= 5) {
      riskLevel = 'high'
      shouldTriggerRescue = true
    } else if (riskScore >= 3) {
      riskLevel = 'medium'
    }
    
    return {
      isAtRisk: riskScore > 0,
      riskLevel,
      warnings,
      shouldTriggerRescue
    }
  }

  /**
   * NUEVO: Factor de confianza basado en historial del usuario
   * Ajusta las progresiones según la confiabilidad demostrada
   */
  private calculateConfidenceFactor(recentSessions: any[]): {
    confidenceScore: number
    progressionMultiplier: number
    recommendations: string[]
  } {
    if (recentSessions.length === 0) {
      return {
        confidenceScore: 0.5,
        progressionMultiplier: 0.8, // Conservador para usuarios nuevos
        recommendations: ['Usuario nuevo: progresión conservadora']
      }
    }
    
    const recommendations: string[] = []
    let confidenceScore = 0.5 // Base neutral
    
    // Analizar consistencia de adherencia
    const completedSessions = recentSessions.filter(s => s.status === 'completed')
    const adherenceRate = completedSessions.length / Math.max(1, recentSessions.length)
    
    // Analizar consistencia de completion rate
    let avgCompletionRate = 0
    let completionConsistency = 0
    
    if (completedSessions.length > 0) {
      const completionRates = completedSessions.map(s => {
        const exercises = s.session_exercises || []
        return exercises.length > 0 ? 
          exercises.reduce((sum: number, ex: any) => sum + ((ex.sets_completed || 0) / (ex.sets_planned || 1)), 0) / exercises.length : 0
      })
      
      avgCompletionRate = completionRates.reduce((a, b) => a + b, 0) / completionRates.length
      const stdDev = Math.sqrt(completionRates.reduce((sum, rate) => sum + Math.pow(rate - avgCompletionRate, 2), 0) / completionRates.length)
      completionConsistency = 1 - (stdDev / Math.max(0.1, avgCompletionRate))
    }
    
    // Calcular score de confianza (0.0 - 1.0)
    confidenceScore = (
      adherenceRate * 0.4 +           // 40% peso a adherencia
      avgCompletionRate * 0.3 +       // 30% peso a completion rate
      completionConsistency * 0.3     // 30% peso a consistencia
    )
    
    // Bonificaciones por patrones positivos
    if (adherenceRate > 0.8 && avgCompletionRate > 0.8) {
      confidenceScore += 0.1
      recommendations.push('Usuario altamente confiable: progresión acelerada')
    }
    
    if (completionConsistency > 0.8) {
      confidenceScore += 0.05
      recommendations.push('Muy consistente: predicciones confiables')
    }
    
    // Penalizaciones por patrones negativos
    if (adherenceRate < 0.5) {
      confidenceScore -= 0.15
      recommendations.push('Baja adherencia: progresión muy conservadora')
    }
    
    if (completionConsistency < 0.5) {
      confidenceScore -= 0.1
      recommendations.push('Inconsistente: monitoreo cercano requerido')
    }
    
    // Clampear entre 0.1 y 1.0
    confidenceScore = Math.max(0.1, Math.min(1.0, confidenceScore))
    
    // Calcular multiplicador de progresión
    let progressionMultiplier = 1.0
    
    if (confidenceScore > 0.8) {
      progressionMultiplier = 1.2 // Progresión 20% más rápida
    } else if (confidenceScore > 0.6) {
      progressionMultiplier = 1.0 // Progresión normal
    } else if (confidenceScore > 0.4) {
      progressionMultiplier = 0.8 // Progresión 20% más lenta
    } else {
      progressionMultiplier = 0.6 // Progresión 40% más lenta
    }
    
    return {
      confidenceScore,
      progressionMultiplier,
      recommendations
    }
  }

  /**
   * NUEVO: Genera rutinas de rescate para usuarios en crisis
   * Rutinas más cortas, fáciles y motivadoras
   */
  private generateRescueRoutine(
    profile: UserProfile, 
    progressions: UserExerciseProgression[], 
    icaData: ICAData
  ): GeneratedSession {
    // Rutinas de rescate: más cortas (15-20 min), más fáciles, más variadas
    const rescueCategories = ['push', 'core'] // Solo 2 categorías para brevedad
    const rescueBlocks: ExerciseBlock[] = []
    
    rescueCategories.forEach(category => {
      const categoryProgression = progressions.find(p => 
        p.exercises?.category === category && p.is_active
      )
      
      if (categoryProgression?.exercises) {
        // Reducir dificultad significativamente
        const rescueReps = Math.max(3, Math.round(categoryProgression.personal_best_reps! * 0.6))
        
        rescueBlocks.push({
          exercise: categoryProgression.exercises,
          sets: 2, // Menos series
          reps: rescueReps,
          rest_seconds: 45, // Descanso corto
          progression_level: Math.max(1, categoryProgression.current_level - 1), // Nivel más fácil
          target_rpe: Math.min(6, icaData.ica_score + 1) // RPE más bajo
        })
      }
    })
    
    // Calentamiento y enfriamiento muy simples
    const simpleWarmup: ExerciseBlock[] = [{
      exercise: {
        id: 'rescue-warmup',
        name: 'Movilidad suave',
        category: 'locomotion',
        difficulty_level: 1.0,
        progression_level: 1,
        muscle_groups: ['full-body']
      },
      sets: 1,
      reps: 5,
      rest_seconds: 0,
      progression_level: 1,
      target_rpe: 2
    }]
    
    const simpleCooldown: ExerciseBlock[] = [{
      exercise: {
        id: 'rescue-cooldown',
        name: 'Respiración relajante',
        category: 'core',
        difficulty_level: 1.0,
        progression_level: 1,
        muscle_groups: ['core']
      },
      sets: 1,
      reps: 10,
      rest_seconds: 0,
      progression_level: 1,
      target_rpe: 1
    }]
    
    return {
      id: `rescue-session-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      duration_minutes: Math.min(20, profile.preferred_session_duration * 0.6), // Máximo 20 min
      intensity: icaData.ica_score * 0.6, // Intensidad reducida
      warm_up: simpleWarmup,
      exercise_blocks: rescueBlocks,
      cool_down: simpleCooldown,
      focus_areas: rescueCategories,
      notes: `🆘 RUTINA DE RESCATE - Sesión corta y fácil para recuperar motivación (ICA: ${icaData.ica_score.toFixed(1)})`
    }
  }

  /**
   * NUEVO: Selecciona ejercicios de calentamiento apropiados
   */
  private async selectWarmupExercises(supabase: any, duration_minutes: number = 5): Promise<ExerciseBlock[]> {
    // Obtener ejercicios de calentamiento de la base de datos
    const { data: warmupExercises } = await supabase
      .from('exercises')
      .select('*')
      .eq('category', 'warmup')
      .order('difficulty_level', { ascending: true })

    if (!warmupExercises || warmupExercises.length === 0) {
      // Fallback a ejercicios básicos si no hay ejercicios de calentamiento
      return [{
        exercise_id: 'warmup-basic',
        exercise: {
          name: 'Basic Warm-up',
          instructions: 'Light movement to warm up the body',
          muscle_groups: ['full body']
        },
        sets: 1,
        reps: 1,
        duration_seconds: duration_minutes * 60,
        rest_seconds: 0
      }]
    }

    // Seleccionar 3-4 ejercicios de calentamiento variados
    const selectedWarmups = warmupExercises.slice(0, Math.min(4, Math.ceil(duration_minutes / 1.5)))
    
    return selectedWarmups.map(exercise => ({
      exercise_id: exercise.id,
      exercise: {
        name: exercise.name,
        instructions: exercise.instructions,
        muscle_groups: exercise.muscle_groups
      },
      sets: 1,
      reps: exercise.name.includes('Circles') || exercise.name.includes('Rolls') ? 10 : 15,
      duration_seconds: exercise.target_duration_seconds || 30,
      rest_seconds: 15
    }))
  }

  /**
   * NUEVO: Selecciona ejercicios de enfriamiento y estiramiento
   */
  private async selectCooldownExercises(supabase: any, duration_minutes: number = 5, focusAreas: string[] = []): Promise<ExerciseBlock[]> {
    // Obtener ejercicios de enfriamiento de la base de datos
    const { data: cooldownExercises } = await supabase
      .from('exercises')
      .select('*')
      .eq('category', 'cooldown')
      .order('name')

    if (!cooldownExercises || cooldownExercises.length === 0) {
      // Fallback a estiramientos básicos
      return [{
        exercise_id: 'cooldown-basic',
        exercise: {
          name: 'Basic Cool-down',
          instructions: 'Gentle stretching and deep breathing',
          muscle_groups: ['full body']
        },
        sets: 1,
        reps: 1,
        duration_seconds: duration_minutes * 60,
        rest_seconds: 0
      }]
    }

    // Priorizar estiramientos que trabajen los grupos musculares del entrenamiento
    const prioritizedCooldowns = cooldownExercises.sort((a, b) => {
      const aRelevance = a.muscle_groups?.some((mg: string) => focusAreas.includes(mg)) ? 1 : 0
      const bRelevance = b.muscle_groups?.some((mg: string) => focusAreas.includes(mg)) ? 1 : 0
      return bRelevance - aRelevance
    })

    // Seleccionar 4-5 ejercicios de enfriamiento
    const selectedCooldowns = prioritizedCooldowns.slice(0, Math.min(5, Math.ceil(duration_minutes / 1)))
    
    return selectedCooldowns.map(exercise => ({
      exercise_id: exercise.id,
      exercise: {
        name: exercise.name,
        instructions: exercise.instructions,
        muscle_groups: exercise.muscle_groups
      },
      sets: 1,
      reps: 1,
      duration_seconds: exercise.target_duration_seconds || 30,
      rest_seconds: 10
    }))
  }

  /**
   * NUEVO: Encuentra alternativas para un ejercicio problemático
   */
  private async findAlternativeExercise(
    supabase: any, 
    originalExercise: UserExerciseProgression,
    userFailureReason: 'equipment' | 'difficulty' | 'mobility' | 'injury' = 'difficulty'
  ): Promise<UserExerciseProgression | null> {
    // Buscar alternativas directas en la base de datos
    const { data: alternatives } = await supabase
      .from('exercises')
      .select('*')
      .eq('alternative_for', originalExercise.exercise_id)
      .eq('is_alternative', true)
      .order('difficulty_level', { ascending: true })

    if (alternatives && alternatives.length > 0) {
      // Seleccionar la alternativa más apropiada según el motivo
      let selectedAlternative = alternatives[0] // Por defecto, la más fácil
      
      if (userFailureReason === 'equipment') {
        // Buscar alternativa que no requiera equipo
        const noEquipmentAlts = alternatives.filter(alt => !alt.equipment_needed)
        if (noEquipmentAlts.length > 0) selectedAlternative = noEquipmentAlts[0]
      }

      // Crear progresión para la alternativa
      return {
        id: `alt-${originalExercise.id}`,
        user_id: originalExercise.user_id,
        exercise_id: selectedAlternative.id,
        current_level: 1, // Empezar en nivel básico
        max_reps: Math.max(5, originalExercise.max_reps * 0.7), // Reducir reps
        is_active: true,
        exercises: selectedAlternative,
        notes: `Alternativa sugerida para ${originalExercise.exercises?.name}`
      }
    }

    // Buscar alternativas por categoría y grupo muscular
    if (originalExercise.exercises?.category) {
      const { data: categoryAlternatives } = await supabase
        .from('exercises')
        .select('*')
        .eq('category', originalExercise.exercises.category)
        .lt('difficulty_level', originalExercise.exercises.difficulty_level || 5)
        .order('difficulty_level', { ascending: false })
        .limit(3)

      if (categoryAlternatives && categoryAlternatives.length > 0) {
        const alternative = categoryAlternatives[0]
        return {
          id: `cat-alt-${originalExercise.id}`,
          user_id: originalExercise.user_id,
          exercise_id: alternative.id,
          current_level: 1,
          max_reps: Math.max(5, originalExercise.max_reps * 0.8),
          is_active: true,
          exercises: alternative,
          notes: `Alternativa de categoria para ${originalExercise.exercises?.name}`
        }
      }
    }

    return null
  }

  /**
   * NUEVO: Actualiza el plan de entrenamiento para incluir calentamiento y enfriamiento
   */
  async enhanceTrainingPlanWithWarmupCooldown(
    supabase: any,
    trainingPlan: TrainingPlan
  ): Promise<TrainingPlan> {
    // Mejorar sesión actual
    if (trainingPlan.current_session) {
      const focusAreas = trainingPlan.current_session.focus_areas || []
      
      // Si no tiene calentamiento o es muy básico, añadir uno mejor
      if (!trainingPlan.current_session.warm_up || trainingPlan.current_session.warm_up.length < 2) {
        trainingPlan.current_session.warm_up = await this.selectWarmupExercises(supabase, 5)
      }

      // Si no tiene enfriamiento o es muy básico, añadir uno mejor
      if (!trainingPlan.current_session.cool_down || trainingPlan.current_session.cool_down.length < 2) {
        trainingPlan.current_session.cool_down = await this.selectCooldownExercises(supabase, 5, focusAreas)
      }
    }

    // Mejorar próximas sesiones
    if (trainingPlan.next_sessions) {
      for (const session of trainingPlan.next_sessions) {
        const focusAreas = session.focus_areas || []
        
        if (!session.warm_up || session.warm_up.length < 2) {
          session.warm_up = await this.selectWarmupExercises(supabase, 4)
        }

        if (!session.cool_down || session.cool_down.length < 2) {
          session.cool_down = await this.selectCooldownExercises(supabase, 4, focusAreas)
        }
      }
    }

    return trainingPlan
  }

  /**
   * Calculate dynamic fitness score based on actual progress
   * This replaces the static current_fitness_score with a dynamic assessment
   */
  calculateDynamicFitnessScore(
    data: { profile: UserProfile, progressions: UserExerciseProgression[], recentSessions: TrainingSession[] },
    avg_completion_rate: number,
    avg_rpe: number,
    avg_technical_quality: number
  ): number {
    const { profile, progressions, recentSessions } = data
    
    // Start with profile-based baseline
    const initial_fitness = profile.current_fitness_score || this.FITNESS_LEVELS[profile.fitness_level] * 2.5
    
    // If no training history, return baseline
    if (recentSessions.length === 0 || progressions.length === 0) {
      return Math.max(initial_fitness, 2.0)
    }
    
    // 1. Exercise Progression Factor (40% weight)
    // Average progression level across all exercises (1-7 scale)
    const avg_progression_level = progressions.length > 0 ? 
      progressions.reduce((sum, p) => sum + p.current_level, 0) / progressions.length : 1.0
    
    // Convert to fitness score contribution (1-7 → 2-8 points)
    const progression_contribution = 1 + avg_progression_level
    
    // 2. Performance Quality Factor (30% weight)
    // Based on completion rate, RPE optimization, and technique
    const completion_factor = Math.min(avg_completion_rate * 4, 4) // 0-4 points
    const rpe_factor = Math.max(4 - Math.abs(avg_rpe - 6.5), 0) / 4 * 2 // 0-2 points, optimal RPE ~6.5
    const technique_factor = (avg_technical_quality / 5) * 2 // 0-2 points
    
    const performance_contribution = completion_factor + rpe_factor + technique_factor
    
    // 3. Consistency Factor (20% weight)
    // Training frequency and adherence over time
    const recent_sessions_count = recentSessions.filter(s => s.status === 'completed').length
    const weeks_training = Math.max(recentSessions.length / 3, 1) // Assuming 3 sessions per week
    const consistency_factor = Math.min(recent_sessions_count / weeks_training / 3, 1) * 2 // 0-2 points
    
    // 4. Time-based Improvement Factor (10% weight)
    // Bonus for sustained training over time
    const training_duration_weeks = weeks_training
    const duration_bonus = Math.min(training_duration_weeks / 24, 1) * 1 // 0-1 points, max at 6 months
    
    // Calculate weighted fitness score
    const dynamic_score = 
      (progression_contribution * 0.4) +      // 40% - exercise progression
      (performance_contribution * 0.3) +     // 30% - performance quality  
      (consistency_factor * 0.2) +           // 20% - consistency
      (duration_bonus * 0.1) +               // 10% - time bonus
      2.0 // Base minimum score
    
    // Ensure reasonable bounds (2.0 - 10.0)
    const final_score = Math.max(2.0, Math.min(10.0, dynamic_score))
    
    return final_score
  }
}