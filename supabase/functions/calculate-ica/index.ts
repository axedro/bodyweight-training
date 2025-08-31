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
      profile,
      progressions: progressions || [],
      recentSessions: recentSessions || [],
      wellnessLogs: wellnessLogs || []
    })

    // Update algorithm state in database
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
        calculation_date: new Date().toISOString()
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