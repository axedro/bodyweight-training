import { 
  UserState, 
  Exercise, 
  ExerciseCategory, 
  GeneratedSession, 
  ExerciseBlock, 
  TrainingPlan,
  SessionFeedback,
  UserExerciseProgression
} from './types';

export class AdaptiveTrainingAlgorithm {
  private readonly RECOVERY_CURVE = [1.0, 1.05, 1.02, 0.98, 0.94, 0.89, 0.84]; // días 0-6
  private readonly SAFETY_CHECKS = {
    max_weekly_volume_increase: 0.15,
    max_session_duration: 45, // minutes
    min_rest_between_sessions: 24, // hours
    max_consecutive_training_days: 3,
    rpe_ceiling_beginner: 7,
    rpe_ceiling_advanced: 8.5
  };

  /**
   * Calcula el Índice de Capacidad Actual (ICA)
   */
  calculateICA(userState: UserState): number {
    const fitness_level = userState.current_fitness_level;
    const adherence_rate = userState.adherence_rate;
    const recovery_factor = this.calculateRecoveryFactor(userState);
    const progression_factor = this.calculateProgressionFactor(userState);
    const detraining_factor = this.calculateDetrainingFactor(userState);

    const ica = (fitness_level * adherence_rate * recovery_factor * progression_factor) / detraining_factor;
    
    // Aplicar límites de seguridad
    return Math.max(1.0, Math.min(10.0, ica));
  }

  /**
   * Calcula el Factor de Recuperación (FR)
   */
  private calculateRecoveryFactor(userState: UserState): number {
    const sleep_score = userState.sleep_hours && userState.sleep_quality 
      ? (userState.sleep_hours * userState.sleep_quality) / 20 
      : 0.7; // valor por defecto

    const fatigue_adjustment = userState.fatigue_level 
      ? (6 - userState.fatigue_level) / 5 
      : 1.0;

    const days_since_last = userState.last_training_date 
      ? Math.min(this.getDaysSinceLastTraining(userState.last_training_date), 6)
      : 0;

    const recovery_curve_value = this.RECOVERY_CURVE[days_since_last];

    return sleep_score * fatigue_adjustment * recovery_curve_value;
  }

  /**
   * Calcula el Factor de Adherencia (FA)
   */
  private calculateAdherenceFactor(userState: UserState): number {
    const completion_rate_4w = userState.adherence_rate;
    const consistency_bonus = this.getConsistencyBonus(userState) > 14 ? 1.1 : 1.0;

    return completion_rate_4w * consistency_bonus;
  }

  /**
   * Calcula el Factor de Progresión (FP)
   */
  private calculateProgressionFactor(userState: UserState): number {
    const recent_improvements = this.calculateRecentImprovements(userState);
    const stagnation_penalty = this.getWeeksWithoutProgress(userState) > 2 ? 0.9 : 1.0;

    return (1 + recent_improvements) * stagnation_penalty;
  }

  /**
   * Calcula el Factor de Desentrenamiento
   */
  private calculateDetrainingFactor(userState: UserState): number {
    if (!userState.last_training_date) return 1.0;

    const days_inactive = this.getDaysSinceLastTraining(userState.last_training_date);
    
    if (days_inactive <= 7) return 1.0;
    if (days_inactive <= 14) return 1.1;
    if (days_inactive <= 30) return 1.2;
    return 1.4; // más de 30 días
  }

  /**
   * Genera un plan de entrenamiento adaptativo
   */
  generateTrainingPlan(
    userState: UserState, 
    availableExercises: Exercise[], 
    daysToGenerate: number = 4
  ): TrainingPlan {
    const ica_score = this.calculateICA(userState);
    const current_session = this.generateSession(userState, availableExercises, ica_score, 0);
    const next_sessions = [];

    for (let i = 1; i < daysToGenerate; i++) {
      const projected_ica = this.projectICA(userState, ica_score, i);
      const session = this.generateSession(userState, availableExercises, projected_ica, i);
      next_sessions.push(session);
    }

    const recommendations = this.generateRecommendations(userState, ica_score);

    return {
      current_session,
      next_sessions,
      ica_score,
      recommendations
    };
  }

  /**
   * Genera una sesión individual
   */
  private generateSession(
    userState: UserState, 
    availableExercises: Exercise[], 
    ica_score: number, 
    dayOffset: number
  ): GeneratedSession {
    const required_patterns: ExerciseCategory[] = ['push', 'pull', 'squat', 'hinge', 'core', 'locomotion'];
    const last_3_sessions_patterns = this.analyzeRecentPatterns(userState);
    const priority_patterns = this.identifyUnderworkedPatterns(last_3_sessions_patterns, required_patterns);

    const warm_up = this.selectWarmUpExercises(availableExercises);
    const main_work = this.generateMainWorkBlocks(userState, availableExercises, priority_patterns, ica_score);
    const cool_down = this.selectCoolDownExercises(availableExercises);

    const total_volume_load = this.calculateTotalVolume(main_work);
    const estimated_duration = this.calculateSessionDuration(warm_up, main_work, cool_down);
    const intensity_target = this.calculateIntensityTarget(ica_score, userState);
    const recovery_requirement = this.calculateRecoveryRequirement(ica_score, total_volume_load);

    return {
      warm_up,
      main_work,
      cool_down,
      total_volume_load,
      estimated_duration,
      intensity_target,
      recovery_requirement
    };
  }

  /**
   * Genera bloques de trabajo principal
   */
  private generateMainWorkBlocks(
    userState: UserState,
    availableExercises: Exercise[],
    priorityPatterns: ExerciseCategory[],
    ica_score: number
  ): ExerciseBlock[] {
    const blocks: ExerciseBlock[] = [];
    const target_volume = this.calculateTargetVolume(ica_score, userState);

    for (const pattern of priorityPatterns) {
      const pattern_exercises = availableExercises.filter(ex => ex.category === pattern);
      const user_progression = this.getUserProgressionForPattern(userState, pattern);
      
      if (pattern_exercises.length === 0) continue;

      const selected_exercise = this.selectExerciseVariant(pattern_exercises, user_progression, ica_score);
      const { sets, reps } = this.calculateSetsAndReps(selected_exercise, userState, ica_score);

      blocks.push({
        exercise: selected_exercise,
        sets,
        reps,
        rest_time: this.calculateRestTime(selected_exercise, sets, ica_score),
        notes: this.generateExerciseNotes(selected_exercise, user_progression)
      });
    }

    return blocks;
  }

  /**
   * Selecciona ejercicios de calentamiento
   */
  private selectWarmUpExercises(availableExercises: Exercise[]): Exercise[] {
    const warm_up_exercises = availableExercises.filter(ex => 
      ex.difficulty_level <= 2.5 && 
      (ex.name.toLowerCase().includes('arm circles') || 
       ex.name.toLowerCase().includes('hip circles') ||
       ex.name.toLowerCase().includes('jumping jacks') ||
       ex.name.toLowerCase().includes('high knees') ||
       ex.name.toLowerCase().includes('mountain climbers'))
    );

    return warm_up_exercises.slice(0, 3); // Máximo 3 ejercicios de calentamiento
  }

  /**
   * Selecciona ejercicios de enfriamiento
   */
  private selectCoolDownExercises(availableExercises: Exercise[]): Exercise[] {
    const cool_down_exercises = availableExercises.filter(ex => 
      ex.difficulty_level <= 2.0 && 
      (ex.name.toLowerCase().includes('stretch') || 
       ex.name.toLowerCase().includes('pose'))
    );

    return cool_down_exercises.slice(0, 3); // Máximo 3 ejercicios de enfriamiento
  }

  /**
   * Selecciona variante de ejercicio basada en progresión del usuario
   */
  private selectExerciseVariant(
    exercises: Exercise[], 
    userProgression: UserExerciseProgression | null, 
    ica_score: number
  ): Exercise {
    if (!userProgression) {
      // Usuario nuevo, empezar con nivel 1
      return exercises.find(ex => ex.progression_level === 1) || exercises[0];
    }

    const current_level = userProgression.current_level;
    const consecutive_completions = userProgression.consecutive_completions;

    // Lógica de progresión basada en el algoritmo
    let target_level = current_level;
    
    if (consecutive_completions >= 3 && ica_score > 6.0) {
      target_level = Math.min(current_level + 1, 7);
    } else if (consecutive_completions < 2 && ica_score < 5.0) {
      target_level = Math.max(current_level - 1, 1);
    }

    const target_exercise = exercises.find(ex => ex.progression_level === target_level);
    return target_exercise || exercises.find(ex => ex.progression_level === current_level) || exercises[0];
  }

  /**
   * Calcula series y repeticiones basadas en ICA y capacidad del usuario
   */
  private calculateSetsAndReps(
    exercise: Exercise, 
    userState: UserState, 
    ica_score: number
  ): { sets: number; reps: number } {
    const base_reps = this.getBaseRepsForExercise(exercise);
    const base_sets = this.getBaseSetsForExercise(exercise);

    // Ajustar basado en ICA
    const ica_multiplier = this.getICAMultiplier(ica_score);
    const adjusted_reps = Math.round(base_reps * ica_multiplier);
    const adjusted_sets = Math.round(base_sets * ica_multiplier);

    // Aplicar límites de seguridad
    const max_reps = this.getMaxRepsForExercise(exercise);
    const max_sets = this.getMaxSetsForExercise(exercise);

    return {
      sets: Math.min(adjusted_sets, max_sets),
      reps: Math.min(adjusted_reps, max_reps)
    };
  }

  /**
   * Calcula el tiempo de descanso entre series
   */
  private calculateRestTime(exercise: Exercise, sets: number, ica_score: number): number {
    const base_rest = 60; // segundos base
    const difficulty_multiplier = exercise.difficulty_level / 5;
    const ica_adjustment = ica_score > 7 ? 0.8 : ica_score < 5 ? 1.3 : 1.0;
    
    return Math.round(base_rest * difficulty_multiplier * ica_adjustment);
  }

  /**
   * Calcula el volumen objetivo basado en ICA
   */
  private calculateTargetVolume(ica_score: number, userState: UserState): number {
    const base_volume = userState.preferred_session_duration * 2; // volumen base
    const ica_multiplier = this.getICAMultiplier(ica_score);
    
    return base_volume * ica_multiplier;
  }

  /**
   * Calcula la intensidad objetivo
   */
  private calculateIntensityTarget(ica_score: number, userState: UserState): number {
    const base_intensity = userState.preferred_intensity;
    const ica_adjustment = ica_score > 8.5 ? 1.2 : ica_score < 4.0 ? 0.7 : 1.0;
    
    return Math.min(1.0, base_intensity * ica_adjustment);
  }

  /**
   * Calcula el tiempo de recuperación requerido
   */
  private calculateRecoveryRequirement(ica_score: number, total_volume: number): number {
    const base_recovery = 24; // horas base
    const volume_factor = total_volume / 100;
    const ica_factor = ica_score < 5 ? 1.5 : ica_score > 8 ? 0.8 : 1.0;
    
    return Math.round(base_recovery * volume_factor * ica_factor);
  }

  /**
   * Genera recomendaciones personalizadas
   */
  private generateRecommendations(userState: UserState, ica_score: number): string[] {
    const recommendations: string[] = [];

    if (ica_score < 4.0) {
      recommendations.push("Considera reducir la intensidad y enfócate en la consistencia");
      recommendations.push("Asegúrate de dormir al menos 7-8 horas por noche");
    } else if (ica_score > 8.5) {
      recommendations.push("¡Excelente progreso! Puedes aumentar gradualmente la intensidad");
      recommendations.push("Mantén una buena nutrición para apoyar tu rendimiento");
    }

    if (userState.fatigue_level && userState.fatigue_level > 3) {
      recommendations.push("Tu nivel de fatiga es alto. Considera un día de descanso activo");
    }

    if (userState.adherence_rate < 0.7) {
      recommendations.push("Intenta mantener una rutina más consistente para mejores resultados");
    }

    return recommendations;
  }

  // Métodos auxiliares
  private getDaysSinceLastTraining(lastTrainingDate: string): number {
    const last = new Date(lastTrainingDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - last.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private getConsistencyBonus(userState: UserState): number {
    // Implementar lógica para calcular días consecutivos de entrenamiento
    return 7; // Placeholder
  }

  private calculateRecentImprovements(userState: UserState): number {
    // Implementar lógica para calcular mejoras recientes
    return 0.1; // Placeholder
  }

  private getWeeksWithoutProgress(userState: UserState): number {
    // Implementar lógica para calcular semanas sin progreso
    return 0; // Placeholder
  }

  private analyzeRecentPatterns(userState: UserState): ExerciseCategory[] {
    // Implementar análisis de patrones recientes
    return ['push', 'pull', 'squat']; // Placeholder
  }

  private identifyUnderworkedPatterns(
    recentPatterns: ExerciseCategory[], 
    requiredPatterns: ExerciseCategory[]
  ): ExerciseCategory[] {
    const patternCounts = new Map<ExerciseCategory, number>();
    requiredPatterns.forEach(pattern => patternCounts.set(pattern, 0));
    
    recentPatterns.forEach(pattern => {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    });

    return requiredPatterns.sort((a, b) => 
      (patternCounts.get(a) || 0) - (patternCounts.get(b) || 0)
    );
  }

  private getUserProgressionForPattern(userState: UserState, pattern: ExerciseCategory): UserExerciseProgression | null {
    // Implementar lógica para obtener progresión del usuario para un patrón específico
    return null; // Placeholder
  }

  private getBaseRepsForExercise(exercise: Exercise): number {
    const baseReps = {
      1: 12, 2: 10, 3: 8, 4: 6, 5: 5, 6: 4, 7: 3
    };
    return baseReps[exercise.progression_level as keyof typeof baseReps] || 8;
  }

  private getBaseSetsForExercise(exercise: Exercise): number {
    return 3; // Base de 3 series
  }

  private getMaxRepsForExercise(exercise: Exercise): number {
    return 20; // Máximo 20 repeticiones
  }

  private getMaxSetsForExercise(exercise: Exercise): number {
    return 5; // Máximo 5 series
  }

  private getICAMultiplier(ica_score: number): number {
    if (ica_score > 8.5) return 1.2;
    if (ica_score > 7.0) return 1.1;
    if (ica_score > 5.5) return 1.0;
    if (ica_score > 4.0) return 0.9;
    return 0.8;
  }

  private projectICA(userState: UserState, currentICA: number, daysOffset: number): number {
    // Proyección simple del ICA
    return Math.max(1.0, Math.min(10.0, currentICA + (daysOffset * 0.1)));
  }

  private calculateTotalVolume(blocks: ExerciseBlock[]): number {
    return blocks.reduce((total, block) => {
      return total + (block.sets * block.reps * block.exercise.difficulty_level);
    }, 0);
  }

  private calculateSessionDuration(
    warmUp: Exercise[], 
    mainWork: ExerciseBlock[], 
    coolDown: Exercise[]
  ): number {
    const warmUpTime = warmUp.length * 2; // 2 min por ejercicio
    const mainWorkTime = mainWork.reduce((total, block) => {
      const exerciseTime = block.sets * 1.5; // 1.5 min por serie
      const restTime = (block.sets - 1) * (block.rest_time / 60); // descanso entre series
      return total + exerciseTime + restTime;
    }, 0);
    const coolDownTime = coolDown.length * 1.5; // 1.5 min por ejercicio

    return Math.round(warmUpTime + mainWorkTime + coolDownTime);
  }

  private generateExerciseNotes(exercise: Exercise, progression: UserExerciseProgression | null): string {
    if (!progression) {
      return `Nuevo ejercicio. Enfócate en la forma técnica.`;
    }

    if (progression.consecutive_completions >= 3) {
      return `¡Excelente progreso! Considera aumentar la dificultad.`;
    }

    return `Mantén la forma técnica. Objetivo: ${progression.consecutive_completions}/3 sesiones consecutivas.`;
  }

  /**
   * Actualiza el estado del algoritmo después de una sesión
   */
  updateAlgorithmState(userState: UserState, sessionFeedback: SessionFeedback): Partial<UserState> {
    const completion_rate = sessionFeedback.completion_rate;
    const rpe_reported = sessionFeedback.rpe_reported;
    const technical_quality = sessionFeedback.technical_quality;

    // Actualizar fitness level basado en rendimiento
    const fitness_adjustment = this.calculateFitnessAdjustment(completion_rate, rpe_reported, technical_quality);
    const new_fitness_level = Math.max(1.0, Math.min(10.0, userState.current_fitness_level + fitness_adjustment));

    // Actualizar adherence rate
    const new_adherence_rate = this.calculateNewAdherenceRate(userState.adherence_rate, completion_rate);

    return {
      current_fitness_level: new_fitness_level,
      adherence_rate: new_adherence_rate
    };
  }

  private calculateFitnessAdjustment(completion_rate: number, rpe: number, technical_quality: number): number {
    const completion_factor = (completion_rate - 0.5) * 2; // -1 a 1
    const rpe_factor = (rpe - 5) / 5; // -1 a 1
    const quality_factor = (technical_quality - 3) / 2; // -1 a 1

    return (completion_factor + rpe_factor + quality_factor) * 0.1; // Ajuste pequeño
  }

  private calculateNewAdherenceRate(current_rate: number, completion_rate: number): number {
    const weight = 0.3; // Peso del nuevo dato
    return current_rate * (1 - weight) + completion_rate * weight;
  }
}
