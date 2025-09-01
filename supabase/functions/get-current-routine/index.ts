import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

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

    const today = new Date().toISOString().split('T')[0]
    
    // Get today's planned session
    const { data, error } = await supabase
      .from('training_sessions')
      .select(`
        *,
        session_exercises (
          *,
          exercises (*)
        )
      `)
      .eq('user_id', user.id)
      .eq('session_date', today)
      .eq('status', 'planned')
      .single()

    if (error && error.code !== 'PGRST116') {
      return new Response(
        JSON.stringify({ error: 'Database error', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!data) {
      return new Response(
        JSON.stringify({ routine: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert to GeneratedSession format
    const warmUp = data.session_exercises
      ?.filter((ex: any) => ex.block_type === 'warmup')
      .map((ex: any) => ({
        exercise: ex.exercises,
        sets: ex.sets_planned || 1,
        reps: ex.reps_planned || 10,
        rest_seconds: ex.rest_seconds || 30,
        progression_level: 1,
        target_rpe: ex.target_rpe || 3
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
        target_rpe: ex.target_rpe || 2
      })) || []

    const routine = {
      id: data.id,
      date: data.session_date,
      duration_minutes: data.planned_duration || 30,
      intensity: data.intensity_target || 0.7,
      warm_up: warmUp,
      exercise_blocks: exerciseBlocks,
      cool_down: coolDown,
      focus_areas: ['strength', 'endurance'],
      notes: data.notes || 'Rutina personalizada'
    }

    return new Response(
      JSON.stringify({ routine }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-current-routine:', error)
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