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

      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-routine`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'X-Client-Info': 'supabase-js/2.0.0'
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
      const { data, error } = await this.supabase
        .from('training_sessions')
        .update({
          status: 'completed',
          actual_intensity: feedback.rpe_reported / 10,
          notes: `RPE: ${feedback.rpe_reported}/10, Completado: ${Math.round(feedback.completion_rate * 100)}%, Técnica: ${feedback.technical_quality}/5`,
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
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await this.supabase
        .from('training_sessions')
        .select(`
          *,
          session_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('session_date', today)
        .eq('status', 'planned')
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      if (!data) {
        return null
      }

      // Convertir a formato GeneratedSession compatible con daily-routine.tsx
      const warmUp = data.session_exercises
        ?.filter((ex: any) => ex.block_type === 'warmup')
        .map((ex: any) => ({
          exercise: ex.exercises,
          sets: ex.sets_planned || 1,
          reps: ex.reps_planned || 10,
          rest_seconds: ex.rest_seconds || 30,
          progression_level: 1,
          target_rpe: 3
        })) || []

      const exerciseBlocks = data.session_exercises
        ?.filter((ex: any) => ex.block_type === 'main')
        .map((ex: any) => ({
          exercise: ex.exercises,
          sets: ex.sets_planned || 3,
          reps: ex.reps_planned || 10,
          rest_seconds: ex.rest_seconds || 60,
          progression_level: ex.exercises?.progression_level || 1,
          target_rpe: ex.target_rpe || 7
        })) || []

      const coolDown = data.session_exercises
        ?.filter((ex: any) => ex.block_type === 'cooldown')
        .map((ex: any) => ({
          exercise: ex.exercises,
          sets: ex.sets_planned || 1,
          reps: ex.reps_planned || 30,
          rest_seconds: ex.rest_seconds || 0,
          progression_level: 1,
          target_rpe: 2
        })) || []

      return {
        id: data.id,
        date: data.session_date,
        duration_minutes: data.total_duration || 30,
        intensity: data.intensity_target || 0.7,
        warm_up: warmUp,
        exercise_blocks: exerciseBlocks,
        cool_down: coolDown,
        focus_areas: ['strength', 'endurance'],
        notes: data.notes || 'Rutina personalizada'
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
          planned_duration: session.duration_minutes,
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
          sets_planned: block.sets,
          reps_planned: block.reps,
          rest_seconds: block.rest_seconds
        })),
        ...session.exercise_blocks.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: session.warm_up.length + index + 1,
          block_type: 'main',
          sets_planned: block.sets,
          reps_planned: block.reps,
          rest_seconds: block.rest_seconds,
          target_rpe: block.target_rpe
        })),
        ...session.cool_down.map((block, index) => ({
          session_id: data.id,
          exercise_id: block.exercise.id,
          block_order: session.warm_up.length + session.exercise_blocks.length + index + 1,
          block_type: 'cooldown',
          sets_planned: block.sets,
          reps_planned: block.reps,
          rest_seconds: block.rest_seconds
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
}

export const routineService = new RoutineService()
