import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface UpdateProgressionsRequest {
  sessionId: string
  exerciseBlocks: Array<{
    exercise_id: string
    sets_completed: number
    reps_completed: number
    rpe_reported: number
    technical_quality: number
    enjoyment_level?: number
    notes?: string
  }>
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { 
        global: { 
          headers: { Authorization: authHeader } 
        } 
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { sessionId, exerciseBlocks }: UpdateProgressionsRequest = await req.json()

    if (!sessionId || !exerciseBlocks || !Array.isArray(exerciseBlocks)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: sessionId and exerciseBlocks' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify session ownership
    const { data: session, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Training session not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const progressionUpdates: any[] = []
    const updatedExerciseBlocks: any[] = []

    // Process each exercise block
    for (const block of exerciseBlocks) {
      const { 
        exercise_id, 
        sets_completed, 
        reps_completed, 
        rpe_reported, 
        technical_quality, 
        enjoyment_level, 
        notes 
      } = block

      // Update session exercise
      const { data: sessionExercise, error: sessionExerciseError } = await supabase
        .from('session_exercises')
        .update({
          sets_completed,
          reps_completed,
          rpe_reported,
          technical_quality,
          enjoyment_level,
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .eq('exercise_id', exercise_id)
        .select('*')
        .single()

      if (sessionExerciseError) {
        console.error('Error updating session exercise:', sessionExerciseError)
        continue
      }

      updatedExerciseBlocks.push(sessionExercise)

      // Get current progression for this exercise
      const { data: currentProgression, error: progressionError } = await supabase
        .from('user_exercise_progressions')
        .select('*')
        .eq('user_id', user.id)
        .eq('exercise_id', exercise_id)
        .single()

      if (progressionError) {
        console.error('Error fetching progression:', progressionError)
        continue
      }

      // Calculate completion rate
      const planned_volume = sessionExercise.sets_planned * sessionExercise.reps_planned
      const completed_volume = sets_completed * reps_completed
      const completion_rate = completed_volume / planned_volume

      // Determine if this was a successful completion
      const is_successful = completion_rate >= 0.8 && 
                           rpe_reported <= 8 && 
                           technical_quality >= 3

      // Update progression logic
      let new_level = currentProgression.current_level
      let new_consecutive_completions = currentProgression.consecutive_completions

      if (is_successful) {
        new_consecutive_completions += 1
        
        // Advance level if 3 consecutive successful completions
        if (new_consecutive_completions >= 3 && new_level < 7) {
          new_level += 1
          new_consecutive_completions = 0
        }
      } else {
        new_consecutive_completions = 0
        
        // Regress if completion rate is very low or RPE too high
        if ((completion_rate < 0.5 || rpe_reported >= 9) && new_level > 1) {
          new_level -= 1
        }
      }

      // Update personal bests
      const new_personal_best_reps = Math.max(
        currentProgression.personal_best_reps || 0, 
        reps_completed
      )
      const new_personal_best_sets = Math.max(
        currentProgression.personal_best_sets || 0, 
        sets_completed
      )

      // Update progression in database
      const { data: updatedProgression, error: updateError } = await supabase
        .from('user_exercise_progressions')
        .update({
          current_level: new_level,
          consecutive_completions: new_consecutive_completions,
          last_attempted_date: new Date().toISOString().split('T')[0],
          last_completed_date: is_successful ? new Date().toISOString().split('T')[0] : currentProgression.last_completed_date,
          personal_best_reps: new_personal_best_reps,
          personal_best_sets: new_personal_best_sets,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('exercise_id', exercise_id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error updating progression:', updateError)
        continue
      }

      progressionUpdates.push({
        exercise_id,
        old_level: currentProgression.current_level,
        new_level,
        consecutive_completions: new_consecutive_completions,
        completion_rate,
        is_successful,
        progression_change: new_level - currentProgression.current_level
      })
    }

    // Calculate session completion metrics
    const total_planned_volume = updatedExerciseBlocks.reduce(
      (sum, ex) => sum + (ex.sets_planned * ex.reps_planned), 0
    )
    const total_completed_volume = updatedExerciseBlocks.reduce(
      (sum, ex) => sum + ((ex.sets_completed || 0) * (ex.reps_completed || 0)), 0
    )
    const session_completion_rate = total_planned_volume > 0 ? 
      total_completed_volume / total_planned_volume : 0

    const avg_rpe = updatedExerciseBlocks.reduce(
      (sum, ex) => sum + (ex.rpe_reported || 5), 0
    ) / updatedExerciseBlocks.length

    // Update training session with completion data
    const { data: updatedSession, error: sessionUpdateError } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        actual_intensity: avg_rpe / 10,
        notes: `Completado con ${Math.round(session_completion_rate * 100)}% de volumen planificado`,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select('*')
      .single()

    if (sessionUpdateError) {
      console.error('Error updating session:', sessionUpdateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        session: updatedSession,
        exerciseBlocks: updatedExerciseBlocks,
        progressionUpdates,
        session_metrics: {
          completion_rate: session_completion_rate,
          average_rpe: avg_rpe,
          total_exercises: updatedExerciseBlocks.length,
          progressions_updated: progressionUpdates.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in update-progressions:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})