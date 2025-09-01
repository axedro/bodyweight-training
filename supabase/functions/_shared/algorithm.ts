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
  user_id: string
  start_date: string
  sessions: GeneratedSession[]
  total_sessions: number
  weekly_frequency: number
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

    // Calculate base fitness level
    const fitness_level_multiplier = this.FITNESS_LEVELS[profile.fitness_level] || 1.0
    const base_fitness = (profile.current_fitness_score || 4.0) / 10

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
  }): TrainingPlan {
    const { profile, icaData, daysToGenerate } = data

    const sessions: GeneratedSession[] = []
    
    for (let i = 0; i < daysToGenerate; i++) {
      const sessionDate = new Date()
      sessionDate.setDate(sessionDate.getDate() + i)
      
      const session = this.generateSingleSession({
        profile,
        icaData,
        sessionNumber: i + 1,
        date: sessionDate.toISOString().split('T')[0]
      })
      
      sessions.push(session)
    }

    return {
      user_id: profile.id,
      start_date: new Date().toISOString().split('T')[0],
      sessions,
      total_sessions: daysToGenerate,
      weekly_frequency: profile.available_days_per_week
    }
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
}