import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import { AdaptiveTrainingAlgorithm } from '../_shared/algorithm.ts'

interface GenerateRoutineRequest {
  daysToGenerate?: number
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

    const { daysToGenerate = 1 }: GenerateRoutineRequest = await req.json()

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
          muscle_groups,
          instructions
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

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

    // Initialize algorithm
    const algorithm = new AdaptiveTrainingAlgorithm()

    // Calculate current ICA
    const icaData = algorithm.calculateICA({
      profile,
      progressions: progressions || [],
      recentSessions: recentSessions || [],
      wellnessLogs: [] // TODO: Add wellness logs if needed
    })

    // Generate training plan
    const trainingPlan = algorithm.generateTrainingPlan({
      profile,
      progressions: progressions || [],
      recentSessions: recentSessions || [],
      icaData,
      daysToGenerate
    })

    return new Response(
      JSON.stringify({
        success: true,
        trainingPlan,
        sessions: trainingPlan.sessions,
        ica_score: icaData.ica_score
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