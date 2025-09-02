import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface SaveFeedbackRequest {
  sessionId: string
  feedback: {
    rpe_reported: number
    completion_rate: number
    technical_quality: number
    enjoyment_level?: number
    recovery_feeling?: number
  }
  exercisePerformance?: {
    sessionExerciseId: string
    exerciseId: string
    setNumber: number
    repsCompleted: number
    rpeReported?: number
    techniqueQuality?: number
    restTimeActual?: number
    difficultyPerceived?: number
  }[]
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

    const { sessionId, feedback, exercisePerformance }: SaveFeedbackRequest = await req.json()

    if (!sessionId || !feedback) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId or feedback' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the training session with feedback
    const { data: sessionData, error: sessionError } = await supabase
      .from('training_sessions')
      .update({
        status: 'completed',
        actual_intensity: feedback.rpe_reported / 10,
        notes: `RPE: ${feedback.rpe_reported}/10, Completado: ${Math.round(feedback.completion_rate * 100)}%, Técnica: ${feedback.technical_quality}/5`,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions
      .select()
      .single()

    if (sessionError) {
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback', details: sessionError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update session exercises with completion data or create exercise performance records
    const { data: sessionExercises } = await supabase
      .from('session_exercises')
      .select(`
        *,
        exercises (id, muscle_groups)
      `)
      .eq('session_id', sessionId)

    if (exercisePerformance && exercisePerformance.length > 0) {
      // Update session exercises with detailed performance data
      const performanceData = exercisePerformance.map(perf => ({
        session_exercise_id: perf.sessionExerciseId,
        user_id: user.id,
        exercise_id: perf.exerciseId,
        session_date: sessionData.session_date,
        set_number: perf.setNumber,
        reps_completed: perf.repsCompleted,
        rpe_reported: perf.rpeReported,
        technique_quality: perf.techniqueQuality,
        rest_time_actual: perf.restTimeActual,
        difficulty_perceived: perf.difficultyPerceived,
        muscle_groups: [] // Will be populated from exercise data
      }))

      // Get muscle groups for each exercise
      const exerciseIds = [...new Set(exercisePerformance.map(p => p.exerciseId))]
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, muscle_groups')
        .in('id', exerciseIds)

      // Add muscle groups to performance data
      const exerciseMap = new Map(exerciseData?.map(ex => [ex.id, ex.muscle_groups]) || [])
      performanceData.forEach(perf => {
        perf.muscle_groups = exerciseMap.get(perf.exercise_id) || []
      })

      const { error: performanceError } = await supabase
        .from('exercise_performance')
        .insert(performanceData)

      if (performanceError) {
        console.error('Error saving exercise performance:', performanceError)
        // Continue anyway - session feedback is more critical
      }
    } else if (sessionExercises && sessionExercises.length > 0) {
      // No detailed exercise data provided, update session exercises with estimated completion data
      const estimatedCompletionRate = feedback.completion_rate || 0.8
      const estimatedRpe = feedback.rpe_reported || 7
      const estimatedTechnicalQuality = feedback.technical_quality || 4

      // Update session exercises with completion data
      const sessionExerciseUpdates = sessionExercises.map(sessionEx => ({
        id: sessionEx.id,
        sets_completed: Math.round(sessionEx.sets_planned * estimatedCompletionRate),
        reps_completed: Math.round(sessionEx.reps_planned * estimatedCompletionRate),
        rpe_reported: estimatedRpe,
        technical_quality: estimatedTechnicalQuality,
        notes: `Completado con ${Math.round(estimatedCompletionRate * 100)}% efectividad`
      }))

      // Update each session exercise
      for (const update of sessionExerciseUpdates) {
        await supabase
          .from('session_exercises')
          .update({
            sets_completed: update.sets_completed,
            reps_completed: update.reps_completed,
            rpe_reported: update.rpe_reported,
            technical_quality: update.technical_quality,
            notes: update.notes
          })
          .eq('id', update.id)
      }

      // Create exercise performance records for muscle group analysis
      const performanceData = sessionExercises.map(sessionEx => ({
        user_id: user.id,
        exercise_id: sessionEx.exercise_id,
        session_date: sessionData.session_date,
        sets_completed: Math.round(sessionEx.sets_planned * estimatedCompletionRate),
        reps_completed: Math.round(sessionEx.reps_planned * estimatedCompletionRate),
        rpe_reported: estimatedRpe,
        muscle_groups: sessionEx.exercises?.muscle_groups || []
      }))

      const { error: performanceError } = await supabase
        .from('exercise_performance')
        .insert(performanceData)

      if (performanceError) {
        console.error('Error saving exercise performance:', performanceError)
        // Continue anyway - session feedback is more critical
      }
    }

    return new Response(
      JSON.stringify({ success: true, session: sessionData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in save-session-feedback:', error)
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