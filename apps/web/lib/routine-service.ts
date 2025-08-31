import { createBrowserClient } from '@supabase/ssr'
import { GeneratedSession, TrainingPlan, SessionFeedback } from '@bodyweight/shared'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export class RoutineService {
  private supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  /**
   * Genera una rutina diaria usando el algoritmo adaptativo
   */
  async generateDailyRoutine(daysToGenerate: number = 1): Promise<TrainingPlan> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session) {
        throw new Error('No authenticated session')
      }

      const response = await fetch('/api/generate-routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ daysToGenerate })
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

      const response = await fetch('/api/update-progressions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
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

      const response = await fetch('/api/calculate-ica', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
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
      const { data, error } = await this.supabase
        .from('training_sessions')
        .update({
          rpe_reported: feedback.rpe_reported,
          completion_rate: feedback.completion_rate,
          technical_quality: feedback.technical_quality,
          enjoyment_level: feedback.enjoyment_level,
          recovery_feeling: feedback.recovery_feeling,
          session_type: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
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
          session_exercise_blocks (
            *,
            exercise:exercises (*)
          )
        `)
        .eq('session_type', 'completed')
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
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('training_sessions')
        .select(`
          *,
          session_exercise_blocks (
            *,
            exercise:exercises (*)
          )
        `)
        .eq('session_date', today)
        .eq('session_type', 'planned')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return null
      }

      // Convertir a formato GeneratedSession
      const warmUp = data.session_exercise_blocks
        ?.filter((block: any) => block.block_type === 'warmup')
        .map((block: any) => block.exercise) || []

      const mainWork = data.session_exercise_blocks
        ?.filter((block: any) => block.block_type !== 'warmup' && block.block_type !== 'cooldown')
        .map((block: any) => ({
          exercise: block.exercise,
          sets: block.sets_completed || 3,
          reps: block.reps_completed || 10,
          rest_seconds: block.rest_seconds || 60,
          difficulty_rating: block.difficulty_rating || block.exercise.difficulty_level
        })) || []

      const coolDown = data.session_exercise_blocks
        ?.filter((block: any) => block.block_type === 'cooldown')
        .map((block: any) => block.exercise) || []

      return {
        warm_up: warmUp,
        main_work: mainWork,
        cool_down: coolDown,
        total_volume_load: data.total_volume_load || 0,
        estimated_duration: data.total_duration || 30,
        intensity_target: data.intensity_target || 0.7,
        recovery_requirement: data.recovery_requirement || 24
      }
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
      const { data, error } = await this.supabase
        .from('training_sessions')
        .insert({
          session_date: new Date().toISOString().split('T')[0],
          session_type: 'planned',
          total_duration: session.estimated_duration,
          total_volume_load: session.total_volume_load,
          intensity_target: session.intensity_target,
          recovery_requirement: session.recovery_requirement
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Crear bloques de ejercicios
      const exerciseBlocks = [
        ...session.warm_up.map((exercise, index) => ({
          session_id: data.id,
          exercise_id: exercise.id,
          block_order: index + 1,
          block_type: 'warmup'
        })),
        ...session.main_work.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: session.warm_up.length + index + 1,
          block_type: block.exercise.category,
          sets_completed: block.sets,
          reps_completed: block.reps,
          rest_seconds: block.rest_seconds
        })),
        ...session.cool_down.map((exercise, index) => ({
          session_id: data.id,
          exercise_id: exercise.id,
          block_order: session.warm_up.length + session.main_work.length + index + 1,
          block_type: 'cooldown'
        }))
      ]

      if (exerciseBlocks.length > 0) {
        const { error: blocksError } = await this.supabase
          .from('session_exercise_blocks')
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
}

export const routineService = new RoutineService()
