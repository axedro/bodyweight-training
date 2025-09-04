import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { AdaptiveTrainingAlgorithm } from '../_shared/algorithm.ts'

interface GenerateRoutineRequest {
  daysToGenerate?: number
  biometricData?: any
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

    const { daysToGenerate = 1, biometricData }: GenerateRoutineRequest = await req.json()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Save biometric snapshot if biometric data provided
    if (biometricData && Object.keys(biometricData).length > 0) {
      try {
        // Calculate age from birth_date if available
        let age: number | null = null
        if (profile.birth_date) {
          const birthDate = new Date(profile.birth_date)
          const today = new Date()
          let calculatedAge = today.getFullYear() - birthDate.getFullYear()
          const monthDiff = today.getMonth() - birthDate.getMonth()
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            calculatedAge = calculatedAge - 1
          }
          age = calculatedAge
        }

        // Prepare biometric snapshot data
        const snapshotData: any = {
          user_id: user.id,
          snapshot_date: new Date().toISOString().split('T')[0],
          data_source: 'pre_routine'
        }

        // Add biometric fields if provided
        if (biometricData.weight) snapshotData.weight = parseFloat(biometricData.weight)
        if (biometricData.body_fat_percentage) snapshotData.body_fat_percentage = parseFloat(biometricData.body_fat_percentage)
        if (biometricData.resting_hr) snapshotData.resting_hr = parseInt(biometricData.resting_hr)
        if (biometricData.training_hr_avg) snapshotData.training_hr_avg = parseInt(biometricData.training_hr_avg)
        if (biometricData.sleep_hours) snapshotData.sleep_hours = parseFloat(biometricData.sleep_hours)
        if (biometricData.sleep_quality) snapshotData.sleep_quality = parseInt(biometricData.sleep_quality)
        if (biometricData.fatigue_level) snapshotData.fatigue_level = parseInt(biometricData.fatigue_level)
        if (profile.height) snapshotData.height = parseFloat(profile.height)
        if (age) snapshotData.age = age

        // Insert/update biometric snapshot (upsert by user_id and snapshot_date)
        const { error: snapshotError } = await supabase
          .from('biometric_snapshots')
          .upsert(snapshotData)

        if (snapshotError) {
          console.error('Error saving biometric snapshot:', snapshotError)
          // Don't fail the routine generation if biometric save fails
        } else {
          console.log('Biometric snapshot saved successfully')
        }
      } catch (error) {
        console.error('Error processing biometric data:', error)
        // Continue with routine generation even if biometric save fails
      }
    }

    // Get recent biometric snapshots for enhanced algorithm calculation
    const { data: biometricSnapshots } = await supabase
      .from('biometric_snapshots')
      .select('*')
      .eq('user_id', user.id)
      .gte('snapshot_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('snapshot_date', { ascending: false })

    // Update profile with most recent biometric data if available
    let enhancedProfile = { ...profile }
    if (biometricSnapshots && biometricSnapshots.length > 0) {
      const latestSnapshot = biometricSnapshots[0]
      
      // Use biometric data from snapshots, falling back to profile data
      enhancedProfile = {
        ...profile,
        weight: latestSnapshot.weight || profile.weight,
        body_fat_percentage: latestSnapshot.body_fat_percentage || profile.body_fat_percentage,
        resting_hr: latestSnapshot.resting_hr || profile.resting_hr,
        training_hr_avg: latestSnapshot.training_hr_avg || profile.training_hr_avg,
        sleep_hours: latestSnapshot.sleep_hours || profile.sleep_hours,
        sleep_quality: latestSnapshot.sleep_quality || profile.sleep_quality,
        fatigue_level: latestSnapshot.fatigue_level || profile.fatigue_level,
        age: latestSnapshot.age || profile.age,
        hrv_trend: latestSnapshot.hrv_trend || profile.hrv_trend
      }
    }

    // Get user's current progressions
    const { data: progressions } = await supabase
      .from('user_exercise_progressions')
      .select(`
        *,
        exercises (
          id,
          name,
          category,
          difficulty_level,
          progression_level,
          muscle_groups,
          instructions
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    // If user has no progressions, create initial ones based on their profile
    let userProgressions = progressions || []
    if (!progressions || progressions.length === 0) {
      console.log('Creating initial progressions for new user:', user.id)
      userProgressions = await createInitialProgressions(supabase, user.id, enhancedProfile)
    }

    // Get recent training history
    const { data: recentSessions } = await supabase
      .from('training_sessions')
      .select(`
        *,
        session_exercises (
          *,
          exercises (
            name,
            category
          )
        )
      `)
      .eq('user_id', user.id)
      .gte('session_date', new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('session_date', { ascending: false })

    // Get muscle group analysis data for balanced routine generation
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    const currentWeekStart = monday.toISOString().split('T')[0]
    
    // Get current week muscle group metrics
    const { data: muscleGroupMetrics } = await supabase
      .from('muscle_group_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', currentWeekStart)
    
    // Get recent exercise performance data for analysis
    const { data: exercisePerformance } = await supabase
      .from('exercise_performance')
      .select('*')
      .eq('user_id', user.id)
      .gte('session_date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      .order('session_date', { ascending: false })

    // Initialize algorithm
    const algorithm = new AdaptiveTrainingAlgorithm()

    // Calculate current ICA
    const icaData = algorithm.calculateICA({
      profile: enhancedProfile,
      progressions: userProgressions,
      recentSessions: recentSessions || [],
      wellnessLogs: [] // TODO: Add wellness logs if needed
    })

    // Generate training plan with muscle group balance consideration
    const trainingPlan = algorithm.generateTrainingPlan({
      profile: enhancedProfile,
      progressions: userProgressions,
      recentSessions: recentSessions || [],
      icaData,
      daysToGenerate,
      muscleGroupMetrics: muscleGroupMetrics || [],
      exercisePerformance: exercisePerformance || []
    })

    // NUEVO: Enhance training plan with proper warm-up and cool-down exercises
    const enhancedTrainingPlan = await algorithm.enhanceTrainingPlanWithWarmupCooldown(supabase, trainingPlan)

    // Create training session and session exercises in database
    if (enhancedTrainingPlan.current_session) {
      const session = enhancedTrainingPlan.current_session
      
      // Create training session
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          user_id: user.id,
          session_date: session.date || new Date().toISOString().split('T')[0],
          status: 'planned',
          planned_duration: Math.round(session.duration_minutes),
          intensity_target: session.intensity,
          notes: session.notes
        })
        .select()
        .single()

      if (sessionError) {
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }

      // Create session exercises and collect their IDs
      const allExerciseBlocks = [
        ...session.warm_up.map((block, index) => ({ ...block, type: 'warmup', order: index + 1 })),
        ...session.exercise_blocks.map((block, index) => ({ ...block, type: 'main', order: session.warm_up.length + index + 1 })),
        ...session.cool_down.map((block, index) => ({ ...block, type: 'cooldown', order: session.warm_up.length + session.exercise_blocks.length + index + 1 }))
      ]

      const sessionExercises = allExerciseBlocks.map(block => ({
        session_id: sessionData.id,
        exercise_id: block.exercise.id,
        block_order: block.order,
        block_type: block.type,
        sets_planned: Math.round(block.sets || 1),
        reps_planned: Math.round(block.reps || 1),
        rest_seconds: Math.round(block.rest_seconds || 60),
        target_rpe: Math.round((block as any).target_rpe || 5),
        duration_seconds: Math.round((block as any).duration_seconds || null)
      }))

      const { data: sessionExerciseData, error: exerciseError } = await supabase
        .from('session_exercises')
        .insert(sessionExercises)
        .select()

      if (exerciseError) {
        throw new Error(`Failed to create session exercises: ${exerciseError.message}`)
      }

      // Update ExerciseBlocks with session_exercise_ids
      let exerciseIndex = 0
      session.warm_up.forEach((block) => {
        (block as any).session_exercise_id = sessionExerciseData[exerciseIndex].id
        exerciseIndex++
      })
      session.exercise_blocks.forEach((block) => {
        (block as any).session_exercise_id = sessionExerciseData[exerciseIndex].id
        exerciseIndex++
      })
      session.cool_down.forEach((block) => {
        (block as any).session_exercise_id = sessionExerciseData[exerciseIndex].id
        exerciseIndex++
      })

      // Set the session ID
      session.id = sessionData.id
    }

    return new Response(
      JSON.stringify({
        success: true,
        trainingPlan: enhancedTrainingPlan,
        ica_score: enhancedTrainingPlan.ica_score
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in generate-routine:', error)
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

/**
 * Create initial progressions for a new user based on their profile
 */
async function createInitialProgressions(supabase: any, userId: string, profile: any) {
  try {
    // Initialize the algorithm to get estimated progression levels
    const algorithm = new AdaptiveTrainingAlgorithm()
    const estimatedLevels = algorithm.estimateInitialProgressions(profile)
    
    // Get base exercises for each category at appropriate progression levels
    const { data: exercises } = await supabase
      .from('exercises')
      .select('*')
      .in('category', Object.keys(estimatedLevels))
      .order('category', { ascending: true })
      .order('progression_level', { ascending: true })

    if (!exercises || exercises.length === 0) {
      console.warn('No exercises found for creating initial progressions')
      return []
    }

    // Create progressions for each exercise category
    const progressionsToCreate: any[] = []
    
    for (const [category, estimatedLevel] of Object.entries(estimatedLevels)) {
      // Find the best exercise for this category at the estimated level
      const categoryExercises = exercises.filter((ex: any) => ex.category === category)
      const bestExercise = categoryExercises.find((ex: any) => ex.progression_level === estimatedLevel) ||
                          categoryExercises.find((ex: any) => ex.progression_level === 1) || // Fallback to level 1
                          categoryExercises[0] // Fallback to first exercise

      if (bestExercise) {
        progressionsToCreate.push({
          user_id: userId,
          exercise_id: bestExercise.id,
          current_level: estimatedLevel as number,
          consecutive_completions: 0,
          is_active: true
        })
      }
    }

    // Insert the progressions into the database
    const { data: createdProgressions, error } = await supabase
      .from('user_exercise_progressions')
      .insert(progressionsToCreate)
      .select(`
        *,
        exercises (
          id,
          name,
          category,
          difficulty_level,
          progression_level,
          muscle_groups,
          instructions
        )
      `)

    if (error) {
      console.error('Error creating initial progressions:', error)
      return []
    }

    console.log(`Created ${createdProgressions?.length || 0} initial progressions for user ${userId}`)
    return createdProgressions || []

  } catch (error) {
    console.error('Error in createInitialProgressions:', error)
    return []
  }
}