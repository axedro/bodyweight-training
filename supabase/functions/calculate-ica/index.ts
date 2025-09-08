import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { AdaptiveTrainingAlgorithm } from '../_shared/algorithm.ts'

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

    // Get user profile (basic info only)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email, fitness_level, experience_years, available_days_per_week, preferred_session_duration, preferred_intensity, age')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get latest biometric data using the same logic as get-latest-biometrics
    let biometricData: any = {}
    
    // Try to get latest biometrics from snapshots first
    const { data: latestBiometrics, error: biometricsError } = await supabase
      .rpc('get_latest_biometrics', { user_uuid: user.id })

    if (biometricsError || !latestBiometrics || latestBiometrics.length === 0) {
      console.log('📊 No biometric snapshots found, falling back to user profile')
      // Fallback to user profile if no biometric snapshots exist
      const { data: profileBiometrics, error: profileBiometricsError } = await supabase
        .from('user_profiles')
        .select('weight, height, body_fat_percentage, resting_hr, training_hr_avg, sleep_hours, sleep_quality, fatigue_level, updated_at')
        .eq('id', user.id)
        .single()

      if (profileBiometricsError) {
        console.error('❌ Error getting profile biometrics:', profileBiometricsError)
        biometricData = {}
      } else {
        biometricData = {
          weight: profileBiometrics.weight,
          height: profileBiometrics.height,
          body_fat_percentage: profileBiometrics.body_fat_percentage,
          resting_hr: profileBiometrics.resting_hr,
          training_hr_avg: profileBiometrics.training_hr_avg,
          sleep_hours: profileBiometrics.sleep_hours,
          sleep_quality: profileBiometrics.sleep_quality,
          fatigue_level: profileBiometrics.fatigue_level,
          last_updated: profileBiometrics.updated_at
        }
        console.log('📊 Using profile biometrics as fallback')
      }
    } else {
      // Use latest biometric snapshot data
      const latestData = latestBiometrics[0]
      biometricData = {
        weight: latestData.weight,
        height: latestData.height,
        body_fat_percentage: latestData.body_fat_percentage,
        resting_hr: latestData.resting_hr,
        training_hr_avg: latestData.training_hr_avg,
        sleep_hours: latestData.sleep_hours,
        sleep_quality: latestData.sleep_quality,
        fatigue_level: latestData.fatigue_level,
        age: latestData.age,
        bmi: latestData.bmi,
        last_updated: latestData.snapshot_date,
        days_old: latestData.days_old
      }
      console.log(`📊 Using biometric snapshot from ${latestData.days_old} days ago`)
    }

    // Merge profile with biometric data for algorithm
    const enrichedProfile = {
      ...profile,
      ...biometricData
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
          muscle_groups
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Get recent training history (last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
    
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
      .gte('session_date', fourWeeksAgo.toISOString().split('T')[0])
      .order('session_date', { ascending: false })

    // Get wellness logs (last 4 weeks)
    const { data: wellnessLogs } = await supabase
      .from('wellness_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('log_date', fourWeeksAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false })

    // Initialize algorithm and calculate ICA
    const algorithm = new AdaptiveTrainingAlgorithm()
    
    const icaData = algorithm.calculateICA({
      profile: enrichedProfile,
      progressions: progressions || [],
      recentSessions: recentSessions || [],
      wellnessLogs: wellnessLogs || []
    })

    // Save historical algorithm state for temporal analysis
    const calculationDate = new Date().toISOString().split('T')[0]
    const { error: historyError } = await supabase
      .from('algorithm_state_history')
      .upsert({
        user_id: user.id,
        calculation_date: calculationDate,
        current_ica: icaData.ica_score,
        recovery_factor: icaData.recovery_factor,
        adherence_factor: icaData.adherence_rate,
        progression_factor: icaData.progression_velocity,
        detraining_factor: icaData.detraining_factor,
        
        // Biometric context
        biometric_data_source: biometricsError || !latestBiometrics || latestBiometrics.length === 0 ? 'profile' : 'snapshots',
        biometric_age_days: biometricData.days_old || null,
        biometric_weight: biometricData.weight || null,
        biometric_sleep_quality: biometricData.sleep_quality || null,
        biometric_fatigue_level: biometricData.fatigue_level || null,
        
        // Algorithm context
        sessions_analyzed: recentSessions?.length || 0,
        wellness_logs_count: wellnessLogs?.length || 0,
        progressions_count: progressions?.length || 0
      }, {
        onConflict: 'user_id, calculation_date'
      })

    if (historyError) {
      console.error('⚠️ Error saving algorithm history:', historyError)
      // Continue anyway - this is not critical for core functionality
    } else {
      console.log(`📊 Algorithm state history saved for ${calculationDate}`)
    }

    // Update current algorithm state (for backward compatibility)
    const { error: algorithmError } = await supabase
      .from('algorithm_state')
      .upsert({
        user_id: user.id,
        current_ica: icaData.ica_score,
        recovery_factor: icaData.recovery_factor,
        adherence_factor: icaData.adherence_rate,
        progression_factor: icaData.progression_velocity,
        detraining_factor: icaData.detraining_factor,
        last_calculation_date: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (algorithmError) {
      console.error('Error updating algorithm state:', algorithmError)
      // Continue anyway - this is not critical
    }

    // Update user profile with latest metrics
    const { error: profileUpdateError } = await supabase
      .from('user_profiles')
      .update({
        current_fitness_score: icaData.user_state.current_fitness_level,
        adherence_rate: icaData.adherence_rate,
        last_training_date: icaData.user_state.last_training_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('Error updating user profile:', profileUpdateError)
      // Continue anyway - this is not critical
    }

    return new Response(
      JSON.stringify({
        success: true,
        ica_score: icaData.ica_score,
        adherence_rate: icaData.adherence_rate,
        recovery_factor: icaData.recovery_factor,
        progression_velocity: icaData.progression_velocity,
        detraining_factor: icaData.detraining_factor,
        recent_performance: icaData.recent_performance,
        user_state: icaData.user_state,
        recommendations: icaData.recommendations,
        calculation_date: new Date().toISOString(),
        biometric_data_used: {
          source: biometricsError || !latestBiometrics || latestBiometrics.length === 0 ? 'user_profile' : 'biometric_snapshots',
          last_updated: biometricData.last_updated,
          days_old: biometricData.days_old || null,
          weight: biometricData.weight,
          sleep_quality: biometricData.sleep_quality,
          fatigue_level: biometricData.fatigue_level
        },
        historical_tracking: {
          enabled: true,
          saved_to_history: !historyError,
          calculation_date: calculationDate,
          sessions_analyzed: recentSessions?.length || 0,
          progressions_tracked: progressions?.length || 0
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error in calculate-ica:', error)
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