import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface TrainingHistoryRequest {
  limit?: number
  offset?: number
  status?: 'planned' | 'in_progress' | 'completed' | 'skipped'
  start_date?: string
  end_date?: string
  include_exercises?: boolean
  include_performance?: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('No authenticated user')
    }

    // Parse request parameters (can come from body or query params)
    let params: TrainingHistoryRequest = {}
    
    if (req.method === 'POST') {
      try {
        params = await req.json()
      } catch {
        params = {} // Empty body is OK
      }
    } else if (req.method === 'GET') {
      const url = new URL(req.url)
      params.limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
      params.offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
      params.status = url.searchParams.get('status') as any
      params.start_date = url.searchParams.get('start_date') || undefined
      params.end_date = url.searchParams.get('end_date') || undefined
      params.include_exercises = url.searchParams.get('include_exercises') === 'true'
      params.include_performance = url.searchParams.get('include_performance') === 'true'
    }

    // Set defaults
    const limit = Math.min(params.limit || 10, 100) // Max 100 sessions
    const offset = params.offset || 0
    const status = params.status || 'completed' // Default to completed sessions
    const includeExercises = params.include_exercises !== false // Default true
    const includePerformance = params.include_performance || false

    console.log('📚 Fetching training history for user:', user.id, 'with params:', {
      limit, offset, status, includeExercises, includePerformance
    })

    // Build base query
    let query = supabaseClient
      .from('training_sessions')
      .select(`
        id,
        session_date,
        status,
        planned_duration,
        actual_duration,
        intensity_target,
        ica_score,
        notes,
        created_at,
        updated_at
        ${includeExercises ? `,
        session_exercises (
          id,
          exercise_id,
          block_order,
          block_type,
          sets_planned,
          reps_planned,
          sets_completed,
          reps_completed,
          rest_seconds,
          target_rpe,
          rpe_reported,
          technical_quality,
          duration_seconds,
          notes,
          exercises (
            id,
            name,
            category,
            difficulty_level,
            progression_level,
            muscle_groups,
            instructions
          )
          ${includePerformance ? `,
          exercise_performance (
            id,
            set_number,
            reps_completed,
            weight_used,
            rpe_reported,
            technique_quality,
            rest_time_actual,
            difficulty_perceived,
            notes
          )` : ''}
        )` : ''}
      `)
      .eq('user_id', user.id)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (params.start_date) {
      query = query.gte('session_date', params.start_date)
    }

    if (params.end_date) {
      query = query.lte('session_date', params.end_date)
    }

    // Apply ordering, limit, and offset
    query = query
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1)

    // Execute query
    const { data: sessions, error: queryError } = await query

    if (queryError) {
      throw new Error(`Failed to fetch training history: ${queryError.message}`)
    }

    // Calculate summary statistics
    const totalSessions = sessions?.length || 0
    const completedSessions = sessions?.filter(s => s.status === 'completed') || []
    const averageDuration = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.actual_duration || s.planned_duration || 0), 0) / completedSessions.length
      : 0
    const averageCompletionRate = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => {
          // Calculate completion rate based on session exercises
          const sessionExercises = s.session_exercises || []
          if (sessionExercises.length === 0) return sum + 1.0 // If no exercises, assume 100%
          
          const completedExercises = sessionExercises.filter(ex => 
            ex.sets_completed && ex.sets_completed > 0
          )
          const completionRate = completedExercises.length / sessionExercises.length
          return sum + completionRate
        }, 0) / completedSessions.length
      : 0
    const averageICA = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.ica_score || 0), 0) / completedSessions.length
      : 0

    // Calculate exercise statistics if exercises are included
    let exerciseStats: any = null
    if (includeExercises && sessions) {
      const allExercises = sessions.flatMap(s => s.session_exercises || [])
      const exercisesByCategory = allExercises.reduce((acc: any, ex: any) => {
        const category = ex.exercises?.category || 'unknown'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(ex)
        return acc
      }, {})

      exerciseStats = {
        total_exercises: allExercises.length,
        unique_exercises: new Set(allExercises.map(ex => ex.exercise_id)).size,
        exercises_by_category: Object.keys(exercisesByCategory).map(category => ({
          category,
          count: exercisesByCategory[category].length,
          average_rpe: exercisesByCategory[category].length > 0
            ? exercisesByCategory[category].reduce((sum: number, ex: any) => sum + (ex.rpe_reported || 0), 0) / exercisesByCategory[category].length
            : 0
        })),
        most_frequent_exercises: allExercises
          .reduce((acc: any, ex: any) => {
            const key = ex.exercises?.name || 'Unknown'
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
      }
    }

    // Build response
    const response = {
      success: true,
      training_history: sessions || [],
      pagination: {
        limit,
        offset,
        total_returned: totalSessions,
        has_more: totalSessions === limit // Simplified check
      },
      filters: {
        status,
        start_date: params.start_date,
        end_date: params.end_date,
        include_exercises: includeExercises,
        include_performance: includePerformance
      },
      summary: {
        total_sessions: totalSessions,
        completed_sessions: completedSessions.length,
        average_duration_minutes: Math.round(averageDuration),
        average_completion_rate: Math.round(averageCompletionRate * 100) / 100,
        average_ica_score: Math.round(averageICA * 100) / 100
      },
      ...(exerciseStats && { exercise_statistics: exerciseStats })
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in get-training-history function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})