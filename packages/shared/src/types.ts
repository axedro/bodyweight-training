export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseCategory = 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'locomotion';
export type SessionStatus = 'planned' | 'in_progress' | 'completed' | 'skipped';

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  
  // Onboarding data
  age?: number;
  weight?: number; // kg
  height?: number; // cm
  body_fat_percentage?: number;
  fitness_level: FitnessLevel;
  experience_years: number;
  available_days_per_week: number;
  
  // Physiological metrics
  resting_hr?: number;
  training_hr_avg?: number;
  hrv_trend?: number;
  
  // Calculated metrics
  current_fitness_score: number; // 1-10 scale
  adherence_rate: number; // 0.5-1.0
  last_training_date?: string;
  
  // Recovery state
  sleep_quality?: number; // 1-5
  sleep_hours?: number;
  fatigue_level?: number; // 1-5
  
  // Preferences
  preferred_session_duration: number; // minutes
  preferred_intensity: number; // 0.5-1.0
  notifications_enabled: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: ExerciseCategory;
  difficulty_level: number; // 1-10 scale
  progression_level: number; // 1-7 for progression hierarchy
  muscle_groups: string[];
  instructions?: string;
  video_url?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserExerciseProgression {
  id: string;
  user_id: string;
  exercise_id: string;
  current_level: number;
  consecutive_completions: number;
  last_attempted_date?: string;
  last_completed_date?: string;
  personal_best_reps?: number;
  personal_best_sets?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  session_date: string;
  status: SessionStatus;
  planned_duration?: number; // minutes
  actual_duration?: number; // minutes
  intensity_target?: number; // 0.5-1.0
  actual_intensity?: number;
  ica_score?: number; // Index of Current Ability
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  sets_planned: number;
  reps_planned: number;
  sets_completed?: number;
  reps_completed?: number;
  rpe_reported?: number; // 1-10
  technical_quality?: number; // 1-5
  enjoyment_level?: number; // 1-5
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WellnessLog {
  id: string;
  user_id: string;
  log_date: string;
  sleep_hours?: number;
  sleep_quality?: number; // 1-5
  fatigue_level?: number; // 1-5
  stress_level?: number; // 1-5
  hydration_level?: number; // 1-5
  mood_level?: number; // 1-5
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AlgorithmState {
  id: string;
  user_id: string;
  current_ica?: number;
  recovery_factor?: number;
  adherence_factor?: number;
  progression_factor?: number;
  detraining_factor: number;
  last_calculation_date: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  exercise_id: string;
  preference_type: string; // 'favorite', 'avoid', 'modify'
  preference_value?: any; // JSONB
  created_at: string;
  updated_at: string;
}

// Algorithm-specific types
export interface UserState {
  // Datos antropométricos
  age: number;
  weight: number;
  body_fat_percentage?: number;
  
  // Métricas fisiológicas
  resting_hr?: number;
  training_hr_avg?: number;
  hrv_trend?: number;
  
  // Historial de rendimiento
  training_history: TrainingSession[];
  current_fitness_level: number; // 1-10 escala calculada
  adherence_rate: number; // % entrenamientos completados últimas 4 semanas
  
  // Estado de recuperación
  last_training_date?: string;
  sleep_quality?: number; // 1-5
  sleep_hours?: number;
  fatigue_level?: number; // 1-5 autoreportado
  
  // Progresión actual
  current_progressions: UserExerciseProgression[];
  
  // Preferencias de usuario
  preferred_session_duration: number; // minutos
  preferred_intensity: number; // 0.5-1.0
}

export interface ExerciseProgression {
  exercise: Exercise;
  current_level: number;
  consecutive_completions: number;
  personal_best_reps?: number;
  personal_best_sets?: number;
}

export interface SessionFeedback {
  rpe_reported: number; // 1-10 esfuerzo percibido
  completion_rate: number; // % ejercicios completados
  technical_quality: number; // autoevaluación forma
  enjoyment_level: number; // adherencia predictor
  recovery_feeling: number; // preparación próxima sesión
}

export interface GeneratedSession {
  warm_up: Exercise[];
  main_work: ExerciseBlock[];
  cool_down: Exercise[];
  
  total_volume_load: number;
  estimated_duration: number;
  intensity_target: number; // % esfuerzo percibido
  recovery_requirement: number; // horas hasta próxima sesión
}

export interface ExerciseBlock {
  exercise: Exercise;
  sets: number;
  reps: number;
  rest_time: number; // seconds
  notes?: string;
}

export interface TrainingPlan {
  current_session: GeneratedSession;
  next_sessions: GeneratedSession[];
  ica_score: number;
  recommendations: string[];
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface OnboardingData {
  age: number;
  weight: number;
  height: number;
  body_fat_percentage?: number;
  fitness_level: FitnessLevel;
  experience_years: number;
  available_days_per_week: number;
  preferred_session_duration: number;
  preferred_intensity: number;
}
