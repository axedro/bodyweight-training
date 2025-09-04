import { createBrowserClient } from '@supabase/ssr'
import { GeneratedSession, TrainingPlan, SessionFeedback } from '@bodyweight/shared'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class RoutineService {
  public supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  /**
   * Genera una rutina diaria usando el algoritmo adaptativo
   */
  async generateDailyRoutine(daysToGenerate: number = 1, biometricData?: any): Promise<TrainingPlan> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        },
        body: JSON.stringify({ daysToGenerate, biometricData })
      })

      if (!response.ok) {
        throw new Error('Failed to generate routine')
      }

      const result = await response.json()
      return result.trainingPlan
    } catch (error) {
      console.error('Error generating routine:', error)
      throw error
    }
  }

  /**
   * Actualiza las progresiones después de completar una sesión
   */
  async updateProgressions(sessionId: string, exerciseBlocks: any[]): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-progressions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        },
        body: JSON.stringify({ sessionId, exerciseBlocks })
      })

      if (!response.ok) {
        throw new Error('Failed to update progressions')
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating progressions:', error)
      throw error
    }
  }

  /**
   * Calcula el ICA del usuario
   */
  async calculateICA(): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/calculate-ica`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to calculate ICA')
      }

      return await response.json()
    } catch (error) {
      console.error('Error calculating ICA:', error)
      throw error
    }
  }

  /**
   * Guarda el feedback de una sesión
   */
  async saveSessionFeedback(sessionId: string, feedback: SessionFeedback): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/save-session-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        },
        body: JSON.stringify({ sessionId, feedback })
      })

      if (!response.ok) {
        throw new Error('Failed to save session feedback')
      }

      const result = await response.json()
      return result.session
    } catch (error) {
      console.error('Error saving session feedback:', error)
      throw error
    }
  }

  /**
   * Obtiene el historial de entrenamientos del usuario
   */
  async getTrainingHistory(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('training_sessions')
        .select(`
          *,
          session_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching training history:', error)
      throw error
    }
  }

  /**
   * Obtiene la rutina actual del usuario
   */
  async getCurrentRoutine(): Promise<GeneratedSession | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-current-routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to get current routine')
      }

      const result = await response.json()
      return result.routine
    } catch (error) {
      console.error('Error fetching current routine:', error)
      throw error
    }
  }

  /**
   * Crea una nueva sesión de entrenamiento
   */
  async createTrainingSession(session: GeneratedSession): Promise<any> {
    try {
      // Get current user to ensure we include user_id for RLS
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await this.supabase
        .from('training_sessions')
        .insert({
          user_id: user.id,
          session_date: session.date || new Date().toISOString().split('T')[0],
          status: 'planned',
          planned_duration: Math.round(session.duration_minutes), // Convert to integer
          intensity_target: session.intensity,
          notes: session.notes
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Crear bloques de ejercicios con la estructura correcta
      const exerciseBlocks = [
        ...session.warm_up.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: index + 1,
          block_type: 'warmup',
          sets_planned: Math.round(block.sets || 1),
          reps_planned: Math.round(block.reps || 10),
          rest_seconds: Math.round(block.rest_seconds || 30)
        })),
        ...session.exercise_blocks.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: session.warm_up.length + index + 1,
          block_type: 'main',
          sets_planned: Math.round(block.sets || 3),
          reps_planned: Math.round(block.reps || 10),
          rest_seconds: Math.round(block.rest_seconds || 60),
          target_rpe: Math.round(block.target_rpe || 7)
        })),
        ...session.cool_down.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: session.warm_up.length + session.exercise_blocks.length + index + 1,
          block_type: 'cooldown',
          sets_planned: Math.round(block.sets || 1),
          reps_planned: Math.round(block.reps || 10),
          rest_seconds: Math.round(block.rest_seconds || 30)
        }))
      ]

      if (exerciseBlocks.length > 0) {
        const { error: blocksError } = await this.supabase
          .from('session_exercises')
          .insert(exerciseBlocks)

        if (blocksError) {
          throw blocksError
        }
      }

      return data
    } catch (error) {
      console.error('Error creating training session:', error)
      throw error
    }
  }

  /**
   * Analiza los grupos musculares del usuario
   */
  async analyzeMuscleGroups(): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-muscle-groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to analyze muscle groups')
      }

      return await response.json()
    } catch (error) {
      console.error('Error analyzing muscle groups:', error)
      throw error
    }
  }

  /**
   * Analiza la evolución temporal de los KPIs del usuario
   */
  async analyzeEvolution(): Promise<any> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze-evolution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to analyze evolution')
      }

      const result = await response.json()
      const analysis = result.analysis || result
      
      // Map the data structure to match frontend expectations
      return {
        ica_evolution: analysis.ica_evolution,
        exercise_progression: analysis.exercise_progression,
        muscle_group_balance: {
          balance_score: analysis.muscle_groups_evolution?.weekly_balance_scores?.[analysis.muscle_groups_evolution.weekly_balance_scores.length - 1]?.balance_score || 0.5,
          trend: analysis.muscle_groups_evolution?.balance_trend || 'stable',
          balance_evolution: analysis.muscle_groups_evolution?.weekly_balance_scores || [],
          top_imbalanced_groups: analysis.muscle_groups_evolution?.weekly_balance_scores?.map(w => ({ 
            muscle_group: w.most_imbalanced, 
            imbalance_severity: 1 - w.balance_score 
          })) || []
        },
        performance_metrics: {
          completion_rate: {
            current: analysis.performance_evolution?.completion_rate?.current || 0,
            trend: analysis.performance_evolution?.completion_rate?.improvement_rate > 0 ? 'improving' : 
                   analysis.performance_evolution?.completion_rate?.improvement_rate < 0 ? 'declining' : 'stable'
          },
          rpe_optimization: {
            current: analysis.performance_evolution?.rpe_optimization?.optimization_score || 0,
            trend: 'stable' // Simplified
          },
          technical_quality: {
            current: analysis.performance_evolution?.technical_quality?.current_avg / 5 || 0, // Normalize to 0-1
            trend: analysis.performance_evolution?.technical_quality?.improvement_rate > 0 ? 'improving' : 
                   analysis.performance_evolution?.technical_quality?.improvement_rate < 0 ? 'declining' : 'stable'
          },
          consistency: {
            current: Math.min(1.0, analysis.performance_evolution?.completion_rate?.current * 1.2) || 0,
            trend: 'stable' // Simplified
          }
        },
        overall_progress: {
          score: (analysis.summary?.overall_progress_score || 0) / 10, // Normalize to 0-1
          classification: analysis.summary?.overall_progress_score >= 8 ? 'Excelente' :
                         analysis.summary?.overall_progress_score >= 6 ? 'Bueno' :
                         analysis.summary?.overall_progress_score >= 4 ? 'Regular' : 'Necesita Mejorar',
          recommendations: analysis.summary?.recommendations || ['No hay datos suficientes para generar recomendaciones']
        }
      }
    } catch (error) {
      console.error('Error analyzing evolution:', error)
      throw error
    }
  }
}

export const routineService = new RoutineService()
