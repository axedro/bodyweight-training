// @ts-ignore - Deno specific imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore - External module import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Deno global declarations for TypeScript
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

interface SaveFeedbackRequest {
  sessionId: string
  feedback: {
    rpe_reported: number
    completion_rate: number
    technical_quality: number
    enjoyment_level?: number
    recovery_feeling?: number
    actual_duration?: number // Optional duration in minutes
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
    // Circuit-specific fields
    circuitData?: {
      reps_per_circuit: number[]
      rpe_per_circuit: number[]
      technique_per_circuit: number[]
      actual_rest_between_circuits?: number[]
      actual_rest_between_exercises?: number[]
      perceived_difficulty_per_circuit?: number[]
    }
  }[]
}

serve(async (req: Request) => {
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
        actual_duration: feedback.actual_duration || null, // Add actual duration
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

    // Get session exercises for progression updates
    const { data: sessionExercises } = await supabase
      .from('session_exercises')
      .select(`
        *,
        exercises (id, muscle_groups)
      `)
      .eq('session_id', sessionId)

    // Process progression updates for main exercises
    if (sessionExercises) {
      for (const sessionEx of sessionExercises.filter((ex: any) => ex.block_type === 'main')) {
        try {
          // Get current progression for this exercise
          let { data: currentProgression, error: progressionError } = await supabase
            .from('user_exercise_progressions')
            .select('*')
            .eq('user_id', user.id)
            .eq('exercise_id', sessionEx.exercise_id)
            .single()

          // Create progression if doesn't exist
          if (progressionError && progressionError.code === 'PGRST116') {
            const { data: newProgression } = await supabase
              .from('user_exercise_progressions')
              .insert({
                user_id: user.id,
                exercise_id: sessionEx.exercise_id,
                current_level: 1,
                consecutive_completions: 0,
                last_attempted_date: sessionData.session_date,
                is_active: true
              })
              .select('*')
              .single()
            currentProgression = newProgression
          }

          if (currentProgression) {
            // Calculate completion metrics for progression logic
            let estimatedCompletionRate = feedback.completion_rate || 0.8
            let estimatedRpe = feedback.rpe_reported || 7
            let estimatedTechnicalQuality = feedback.technical_quality || 4

            // If we have detailed exercise performance data, use it for better accuracy
            if (exercisePerformance && exercisePerformance.length > 0) {
              const exercisePerf = exercisePerformance.find(p => p.exerciseId === sessionEx.exercise_id)
              if (exercisePerf) {
                // For circuit format, calculate more accurate metrics
                if (exercisePerf.circuitData) {
                  const totalTargetReps = sessionEx.reps_planned * (sessionEx.circuits_planned || sessionEx.sets_planned || 1)
                  const totalActualReps = exercisePerf.circuitData.reps_per_circuit.reduce((a, b) => a + b, 0)
                  estimatedCompletionRate = Math.min(1.0, totalActualReps / Math.max(1, totalTargetReps))

                  // Use average RPE from all circuits
                  const validRpes = exercisePerf.circuitData.rpe_per_circuit.filter(rpe => rpe > 0)
                  if (validRpes.length > 0) {
                    estimatedRpe = validRpes.reduce((a, b) => a + b, 0) / validRpes.length
                  }

                  // Use average technique quality from all circuits
                  const validTechniques = exercisePerf.circuitData.technique_per_circuit.filter(tech => tech > 0)
                  if (validTechniques.length > 0) {
                    estimatedTechnicalQuality = validTechniques.reduce((a, b) => a + b, 0) / validTechniques.length
                  }
                } else {
                  // Traditional format
                  estimatedCompletionRate = Math.min(1.0, exercisePerf.repsCompleted / Math.max(1, sessionEx.reps_planned || 10))
                  estimatedRpe = exercisePerf.rpeReported || estimatedRpe
                  estimatedTechnicalQuality = exercisePerf.techniqueQuality || estimatedTechnicalQuality
                }
              }
            }

            const completion_rate = estimatedCompletionRate
            const is_successful = completion_rate >= 0.8 &&
                                estimatedRpe <= 8 &&
                                estimatedTechnicalQuality >= 3

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
              if ((completion_rate < 0.5 || estimatedRpe >= 9) && new_level > 1) {
                new_level -= 1
              }
            }

            // Update progression in database
            await supabase
              .from('user_exercise_progressions')
              .update({
                current_level: new_level,
                consecutive_completions: new_consecutive_completions,
                last_attempted_date: sessionData.session_date,
                last_completed_date: is_successful ? sessionData.session_date : currentProgression.last_completed_date,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)
              .eq('exercise_id', sessionEx.exercise_id)
          }
        } catch (error) {
          console.error('Error updating progression for exercise:', sessionEx.exercise_id, error)
          // Continue with other exercises
        }
      }
    }

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
        muscle_groups: [] as string[], // Will be populated from exercise data
        // Circuit-specific fields
        circuit_data: perf.circuitData || null,
        circuit_rpe: perf.circuitData?.rpe_per_circuit || null,
        circuit_technique_quality: perf.circuitData?.technique_per_circuit || null,
        actual_rest_between_circuits: perf.circuitData?.actual_rest_between_circuits || null,
        actual_rest_between_exercises: perf.circuitData?.actual_rest_between_exercises || null,
        // Calculate aggregated metrics for circuit format
        total_circuit_reps: perf.circuitData?.reps_per_circuit?.reduce((a, b) => a + b, 0) || perf.repsCompleted,
        avg_circuit_rpe: perf.circuitData?.rpe_per_circuit?.length
          ? perf.circuitData.rpe_per_circuit.reduce((a, b) => a + b, 0) / perf.circuitData.rpe_per_circuit.length
          : perf.rpeReported,
        avg_circuit_technique: perf.circuitData?.technique_per_circuit?.length
          ? perf.circuitData.technique_per_circuit.reduce((a, b) => a + b, 0) / perf.circuitData.technique_per_circuit.length
          : perf.techniqueQuality
      }))

      // Get muscle groups for each exercise
      const exerciseIds = [...new Set(exercisePerformance.map(p => p.exerciseId))]
      const { data: exerciseData } = await supabase
        .from('exercises')
        .select('id, muscle_groups')
        .in('id', exerciseIds)

      // Add muscle groups to performance data
      const exerciseMap = new Map(exerciseData?.map((ex: any) => [ex.id, ex.muscle_groups]) || [])
      performanceData.forEach((perf: any) => {
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
      const sessionExerciseUpdates = sessionExercises.map((sessionEx: any) => ({
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
            notes: update.notes,
            // For circuit format, also update circuit completion
            circuits_completed: sessionExercises.find((ex: any) => ex.id === update.id)?.circuits_planned || null
          })
          .eq('id', update.id)
      }

      // Create exercise performance records for muscle group analysis
      const performanceData = sessionExercises.map((sessionEx: any) => ({
        session_exercise_id: sessionEx.id, // Add session_exercise_id reference
        user_id: user.id,
        exercise_id: sessionEx.exercise_id,
        session_date: sessionData.session_date,
        set_number: 1, // Add required set_number field
        reps_completed: Math.round(sessionEx.reps_planned * estimatedCompletionRate),
        rpe_reported: estimatedRpe,
        technique_quality: estimatedTechnicalQuality,
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

    // Update muscle group metrics after session completion
    try {
      const sessionDate = new Date(sessionData.session_date)
      const weekStart = new Date(sessionDate)
      weekStart.setDate(sessionDate.getDate() - sessionDate.getDay()) // Start of week
      const weekStartString = weekStart.toISOString().split('T')[0]

      // Get all muscle groups from exercises in this session
      const muscleGroupData: { [key: string]: any } = {}
      
      for (const sessionEx of sessionExercises || []) {
        const muscleGroups = sessionEx.exercises?.muscle_groups || []
        let actualSets = 0
        let actualReps = 0
        let avgRpe = feedback.rpe_reported || 7
        let avgTechnicalQuality = feedback.technical_quality || 4
        let isCompleted = feedback.completion_rate >= 0.8

        // Check if we have detailed exercise performance data
        if (exercisePerformance && exercisePerformance.length > 0) {
          const exercisePerf = exercisePerformance.find(p => p.exerciseId === sessionEx.exercise_id)
          if (exercisePerf && exercisePerf.circuitData) {
            // Circuit format: use detailed data
            actualSets = sessionEx.circuits_planned || sessionEx.sets_planned || 1
            actualReps = exercisePerf.circuitData.reps_per_circuit.reduce((a, b) => a + b, 0)

            // Calculate average RPE and technique from all circuits
            const validRpes = exercisePerf.circuitData.rpe_per_circuit.filter(rpe => rpe > 0)
            if (validRpes.length > 0) {
              avgRpe = validRpes.reduce((a, b) => a + b, 0) / validRpes.length
            }

            const validTechniques = exercisePerf.circuitData.technique_per_circuit.filter(tech => tech > 0)
            if (validTechniques.length > 0) {
              avgTechnicalQuality = validTechniques.reduce((a, b) => a + b, 0) / validTechniques.length
            }

            // Check completion based on target vs actual reps
            const targetReps = sessionEx.reps_planned * actualSets
            isCompleted = actualReps >= (targetReps * 0.8)
          } else if (exercisePerf) {
            // Traditional format: use provided data
            actualSets = sessionEx.sets_completed || Math.round((sessionEx.sets_planned || 1) * (feedback.completion_rate || 0.8))
            actualReps = exercisePerf.repsCompleted
            avgRpe = exercisePerf.rpeReported || avgRpe
            avgTechnicalQuality = exercisePerf.techniqueQuality || avgTechnicalQuality
            isCompleted = actualReps >= ((sessionEx.reps_planned || 10) * 0.8)
          }
        } else {
          // Fallback to estimated values
          actualSets = Math.round((sessionEx.sets_planned || 1) * (feedback.completion_rate || 0.8))
          actualReps = Math.round((sessionEx.reps_planned || 1) * (feedback.completion_rate || 0.8))
        }

        for (const muscleGroup of muscleGroups) {
          if (!muscleGroupData[muscleGroup]) {
            muscleGroupData[muscleGroup] = {
              total_sets: 0,
              total_reps: 0,
              rpe_sum: 0,
              rpe_count: 0,
              technical_quality_sum: 0,
              technical_quality_count: 0,
              exercises_attempted: 0,
              exercises_completed: 0
            }
          }

          muscleGroupData[muscleGroup].total_sets += actualSets
          muscleGroupData[muscleGroup].total_reps += actualReps
          muscleGroupData[muscleGroup].rpe_sum += avgRpe
          muscleGroupData[muscleGroup].rpe_count += 1
          muscleGroupData[muscleGroup].technical_quality_sum += avgTechnicalQuality
          muscleGroupData[muscleGroup].technical_quality_count += 1
          muscleGroupData[muscleGroup].exercises_attempted += 1
          muscleGroupData[muscleGroup].exercises_completed += (isCompleted ? 1 : 0)
        }
      }

      // Update or create muscle group metrics for each muscle group
      for (const [muscleGroup, data] of Object.entries(muscleGroupData)) {
        const avgRpe = data.rpe_sum / data.rpe_count
        const avgTechnicalQuality = data.technical_quality_sum / data.technical_quality_count

        // Try to get existing metric
        const { data: existingMetric } = await supabase
          .from('muscle_group_metrics')
          .select('*')
          .eq('user_id', user.id)
          .eq('muscle_group', muscleGroup)
          .eq('week_start', weekStartString)
          .single()

        if (existingMetric) {
          // Update existing metric
          await supabase
            .from('muscle_group_metrics')
            .update({
              total_sets: existingMetric.total_sets + data.total_sets,
              total_reps: existingMetric.total_reps + data.total_reps,
              avg_rpe: ((existingMetric.avg_rpe * existingMetric.exercises_attempted) + (avgRpe * data.exercises_attempted)) / (existingMetric.exercises_attempted + data.exercises_attempted),
              max_rpe: Math.max(existingMetric.max_rpe, avgRpe),
              exercises_attempted: existingMetric.exercises_attempted + data.exercises_attempted,
              exercises_completed: existingMetric.exercises_completed + data.exercises_completed,
              avg_technique_quality: ((existingMetric.avg_technique_quality * existingMetric.exercises_attempted) + (avgTechnicalQuality * data.exercises_attempted)) / (existingMetric.exercises_attempted + data.exercises_attempted),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('muscle_group', muscleGroup)
            .eq('week_start', weekStartString)
        } else {
          // Create new metric
          await supabase
            .from('muscle_group_metrics')
            .insert({
              user_id: user.id,
              muscle_group: muscleGroup,
              week_start: weekStartString,
              total_sets: data.total_sets,
              total_reps: data.total_reps,
              avg_rpe: avgRpe,
              max_rpe: avgRpe,
              exercises_attempted: data.exercises_attempted,
              exercises_completed: data.exercises_completed,
              avg_technique_quality: avgTechnicalQuality
            })
        }
      }
    } catch (error) {
      console.error('Error updating muscle group metrics:', error)
      // Continue anyway - session completion is more important
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