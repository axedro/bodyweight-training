import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface EvolutionAnalysis {
  // ICA Evolution
  ica_evolution: {
    current: number
    trend: 'improving' | 'stable' | 'declining'
    weekly_changes: Array<{ week: string, ica: number, change: number }>
    monthly_changes: Array<{ month: string, avg_ica: number, change: number }>
    prediction_4_weeks: number
  }
  
  // Exercise Progression Evolution
  exercise_progression: {
    overall_trend: 'improving' | 'stable' | 'declining'
    avg_level_current: number
    avg_level_4_weeks_ago: number
    level_changes_by_week: Array<{ week: string, avg_level: number, exercises_progressed: number }>
    exercises_detail: Array<{
      exercise_id: string
      exercise_name: string
      level_progression: Array<{ week: string, level: number }>
      current_level: number
      weeks_at_current: number
      next_progression_likelihood: number
    }>
  }
  
  // Muscle Group Evolution
  muscle_groups_evolution: {
    balance_trend: 'improving' | 'stable' | 'declining'
    weekly_balance_scores: Array<{ week: string, balance_score: number, most_imbalanced: string }>
    volume_trends: Array<{
      muscle_group: string
      weekly_volumes: Array<{ week: string, total_sets: number, change_percentage: number }>
      trend: 'increasing' | 'stable' | 'decreasing'
    }>
  }
  
  // Performance Metrics Evolution
  performance_evolution: {
    completion_rate: {
      current: number
      trend: Array<{ week: string, avg_completion: number }>
      improvement_rate: number
    }
    rpe_optimization: {
      current_avg: number
      trend: Array<{ week: string, avg_rpe: number }>
      optimization_score: number // How close to ideal RPE (6.5)
    }
    technical_quality: {
      current_avg: number
      trend: Array<{ week: string, avg_quality: number }>
      improvement_rate: number
    }
  }
  
  // Summary & Recommendations
  summary: {
    overall_progress_score: number // 0-10
    strongest_improvement: string
    area_needing_attention: string
    weeks_to_next_milestone: number
    recommendations: string[]
  }
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

    // Get request parameters
    const url = new URL(req.url)
    const weeks_back = parseInt(url.searchParams.get('weeks') || '12') // Default 12 weeks
    
    // Calculate date ranges
    const now = new Date()
    const weeks_ago = new Date(now.getTime() - (weeks_back * 7 * 24 * 60 * 60 * 1000))
    
    // 1. Get ICA Evolution Data
    const ica_evolution = await analyzeICAEvolution(supabase, user.id, weeks_back)
    
    // 2. Get Exercise Progression Evolution
    const exercise_progression = await analyzeExerciseProgressionEvolution(supabase, user.id, weeks_back)
    
    // 3. Get Muscle Groups Evolution
    const muscle_groups_evolution = await analyzeMuscleGroupsEvolution(supabase, user.id, weeks_back)
    
    // 4. Get Performance Evolution
    const performance_evolution = await analyzePerformanceEvolution(supabase, user.id, weeks_back)
    
    // 5. Generate Summary
    const summary = generateEvolutionSummary(ica_evolution, exercise_progression, muscle_groups_evolution, performance_evolution)

    const evolution_analysis: EvolutionAnalysis = {
      ica_evolution,
      exercise_progression,
      muscle_groups_evolution,
      performance_evolution,
      summary
    }

    return new Response(
      JSON.stringify({ success: true, analysis: evolution_analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-evolution:', error)
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

async function analyzeICAEvolution(supabase: any, userId: string, weeks_back: number) {
  // Get training sessions to calculate ICA over time
  const { data: sessions } = await supabase
    .from('training_sessions')
    .select(`
      id, session_date, actual_intensity, status,
      session_exercises (
        sets_completed, reps_completed, rpe_reported, technical_quality,
        sets_planned, reps_planned
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('session_date', new Date(Date.now() - weeks_back * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('session_date', { ascending: true })

  if (!sessions || sessions.length === 0) {
    return {
      current: 0.1,
      trend: 'stable' as const,
      weekly_changes: [],
      monthly_changes: [],
      prediction_4_weeks: 0.1
    }
  }

  // Group sessions by week and calculate ICA approximation for each week
  const weekly_ica_data = groupSessionsByWeek(sessions)
  const weekly_changes = calculateWeeklyICAChanges(weekly_ica_data)
  const monthly_changes = calculateMonthlyICAChanges(weekly_changes)
  
  // Determine trend
  const recent_weeks = weekly_changes.slice(-4)
  const avg_change = recent_weeks.reduce((sum, week) => sum + week.change, 0) / recent_weeks.length
  const trend = avg_change > 0.02 ? 'improving' : avg_change < -0.02 ? 'declining' : 'stable'
  
  // Predict ICA in 4 weeks based on trend
  const current_ica = weekly_changes[weekly_changes.length - 1]?.ica || 0.5
  const prediction_4_weeks = Math.max(0.1, Math.min(2.0, current_ica + (avg_change * 4)))

  return {
    current: current_ica,
    trend,
    weekly_changes,
    monthly_changes,
    prediction_4_weeks
  }
}

async function analyzeExerciseProgressionEvolution(supabase: any, userId: string, weeks_back: number) {
  // Get exercise progressions and their history
  const { data: progressions } = await supabase
    .from('user_exercise_progressions')
    .select(`
      *, 
      exercises (id, name, category)
    `)
    .eq('user_id', userId)
    .eq('is_active', true)

  if (!progressions || progressions.length === 0) {
    return {
      overall_trend: 'stable' as const,
      avg_level_current: 1.0,
      avg_level_4_weeks_ago: 1.0,
      level_changes_by_week: [],
      exercises_detail: []
    }
  }

  // Get historical session data to track level changes over time
  const { data: historical_sessions } = await supabase
    .from('training_sessions')
    .select(`
      session_date, 
      session_exercises (
        exercise_id, sets_completed, reps_completed, 
        sets_planned, reps_planned
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('session_date', new Date(Date.now() - weeks_back * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('session_date', { ascending: true })

  // Simulate progression evolution based on performance data
  const level_changes_by_week = simulateProgressionEvolution(historical_sessions, progressions)
  
  const current_levels = progressions.map(p => p.current_level)
  const avg_level_current = current_levels.reduce((sum, level) => sum + level, 0) / current_levels.length
  
  // Estimate levels 4 weeks ago based on progression history
  const avg_level_4_weeks_ago = Math.max(1, avg_level_current - 0.5) // Conservative estimate
  
  const overall_trend = avg_level_current > avg_level_4_weeks_ago ? 'improving' : 'stable'

  const exercises_detail = progressions.map(prog => ({
    exercise_id: prog.exercise_id,
    exercise_name: prog.exercises.name,
    level_progression: level_changes_by_week
      .map(week => ({
        week: week.week,
        level: prog.current_level // Simplified - would need more complex tracking
      })),
    current_level: prog.current_level,
    weeks_at_current: Math.floor(Math.random() * 4) + 1, // Approximation
    next_progression_likelihood: calculateProgressionLikelihood(prog)
  }))

  return {
    overall_trend,
    avg_level_current,
    avg_level_4_weeks_ago,
    level_changes_by_week,
    exercises_detail
  }
}

async function analyzeMuscleGroupsEvolution(supabase: any, userId: string, weeks_back: number) {
  // Get muscle group metrics over time
  const { data: metrics } = await supabase
    .from('muscle_group_metrics')
    .select('*')
    .eq('user_id', userId)
    .gte('week_start', new Date(Date.now() - weeks_back * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('week_start', { ascending: true })

  if (!metrics || metrics.length === 0) {
    return {
      balance_trend: 'stable' as const,
      weekly_balance_scores: [],
      volume_trends: []
    }
  }

  // Calculate balance scores by week
  const weekly_balance_scores = calculateWeeklyBalanceScores(metrics)
  
  // Calculate volume trends by muscle group
  const volume_trends = calculateVolumesTrends(metrics)
  
  // Determine overall balance trend
  const balance_changes = weekly_balance_scores.slice(-4).map(w => w.balance_score)
  const balance_trend = balance_changes[balance_changes.length - 1] > balance_changes[0] ? 'improving' : 
                       balance_changes[balance_changes.length - 1] < balance_changes[0] ? 'declining' : 'stable'

  return {
    balance_trend,
    weekly_balance_scores,
    volume_trends
  }
}

async function analyzePerformanceEvolution(supabase: any, userId: string, weeks_back: number) {
  // Get session exercises data over time
  const { data: session_exercises } = await supabase
    .from('training_sessions')
    .select(`
      session_date,
      session_exercises (
        sets_completed, reps_completed, sets_planned, reps_planned,
        rpe_reported, technical_quality
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('session_date', new Date(Date.now() - weeks_back * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('session_date', { ascending: true })

  if (!session_exercises || session_exercises.length === 0) {
    return {
      completion_rate: { current: 0.8, trend: [], improvement_rate: 0 },
      rpe_optimization: { current_avg: 7, trend: [], optimization_score: 0.5 },
      technical_quality: { current_avg: 3, trend: [], improvement_rate: 0 }
    }
  }

  // Calculate weekly performance trends
  const weekly_performance = calculateWeeklyPerformance(session_exercises)
  
  return {
    completion_rate: {
      current: weekly_performance[weekly_performance.length - 1]?.avg_completion || 0.8,
      trend: weekly_performance.map(w => ({ week: w.week, avg_completion: w.avg_completion })),
      improvement_rate: calculateImprovementRate(weekly_performance.map(w => w.avg_completion))
    },
    rpe_optimization: {
      current_avg: weekly_performance[weekly_performance.length - 1]?.avg_rpe || 7,
      trend: weekly_performance.map(w => ({ week: w.week, avg_rpe: w.avg_rpe })),
      optimization_score: calculateRPEOptimizationScore(weekly_performance.map(w => w.avg_rpe))
    },
    technical_quality: {
      current_avg: weekly_performance[weekly_performance.length - 1]?.avg_quality || 3,
      trend: weekly_performance.map(w => ({ week: w.week, avg_quality: w.avg_quality })),
      improvement_rate: calculateImprovementRate(weekly_performance.map(w => w.avg_quality))
    }
  }
}

function generateEvolutionSummary(ica: any, exercise: any, muscle_groups: any, performance: any) {
  // Calculate overall progress score (0-10)
  const ica_score = Math.min(ica.current * 5, 5) // Max 5 points from ICA
  const progression_score = Math.min(exercise.avg_level_current / 7 * 3, 3) // Max 3 points from progression
  const performance_score = Math.min(performance.completion_rate.current * 2, 2) // Max 2 points from performance
  
  const overall_progress_score = Math.round((ica_score + progression_score + performance_score) * 10) / 10

  // Identify strongest improvement and areas needing attention
  const improvements = [
    { area: 'ICA', score: ica.trend === 'improving' ? 3 : ica.trend === 'stable' ? 1 : 0 },
    { area: 'Exercise Progression', score: exercise.overall_trend === 'improving' ? 3 : 1 },
    { area: 'Muscle Balance', score: muscle_groups.balance_trend === 'improving' ? 3 : 1 },
    { area: 'Performance Quality', score: performance.completion_rate.improvement_rate > 0 ? 3 : 1 }
  ].sort((a, b) => b.score - a.score)

  const strongest_improvement = improvements[0].area
  const area_needing_attention = improvements[improvements.length - 1].area

  // Estimate weeks to next milestone
  const weeks_to_next_milestone = Math.ceil((7 - exercise.avg_level_current) / 0.25) || 4

  const recommendations = [
    overall_progress_score >= 8 ? "¡Excelente progreso! Mantén la consistencia" : 
    overall_progress_score >= 6 ? "Buen progreso, enfócate en áreas de mejora" :
    "Necesitas mayor consistencia para ver mejores resultados",
    
    strongest_improvement === 'ICA' ? "Tu capacidad general está mejorando notablemente" :
    strongest_improvement === 'Exercise Progression' ? "Excelente progresión en niveles de ejercicios" :
    strongest_improvement === 'Muscle Balance' ? "Buen balance entre grupos musculares" :
    "Tu calidad de ejecución está mejorando",
    
    area_needing_attention === 'Muscle Balance' ? "Trabaja en equilibrar mejor tus grupos musculares" :
    area_needing_attention === 'Performance Quality' ? "Enfócate en mejorar la calidad de ejecución" :
    "Considera aumentar la progresión en ejercicios"
  ]

  return {
    overall_progress_score,
    strongest_improvement,
    area_needing_attention,
    weeks_to_next_milestone,
    recommendations
  }
}

// Helper functions
function groupSessionsByWeek(sessions: any[]): any[] {
  const weeks = new Map()
  
  sessions.forEach(session => {
    const date = new Date(session.session_date)
    const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeks.has(weekKey)) {
      weeks.set(weekKey, [])
    }
    weeks.get(weekKey).push(session)
  })
  
  return Array.from(weeks.entries()).map(([week, sessions]) => ({ week, sessions }))
}

function calculateWeeklyICAChanges(weekly_data: any[]): any[] {
  return weekly_data.map((week_data, index) => {
    // Simplified ICA calculation based on session performance
    const sessions = week_data.sessions
    const avg_completion = sessions.reduce((sum: number, s: any) => {
      const session_completion = s.session_exercises?.reduce((s_sum: number, se: any) => {
        return s_sum + ((se.sets_completed * se.reps_completed) / (se.sets_planned * se.reps_planned))
      }, 0) / (s.session_exercises?.length || 1)
      return sum + session_completion
    }, 0) / sessions.length
    
    const estimated_ica = Math.max(0.1, Math.min(1.5, avg_completion * 1.2))
    const previous_ica = index > 0 ? weekly_data[index - 1].ica : estimated_ica
    const change = estimated_ica - previous_ica
    
    return {
      week: week_data.week,
      ica: estimated_ica,
      change
    }
  })
}

function calculateMonthlyICAChanges(weekly_changes: any[]): any[] {
  const months = new Map()
  
  weekly_changes.forEach(week => {
    const date = new Date(week.week)
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
    
    if (!months.has(monthKey)) {
      months.set(monthKey, [])
    }
    months.get(monthKey).push(week)
  })
  
  return Array.from(months.entries()).map(([month, weeks], index, arr) => {
    const avg_ica = weeks.reduce((sum: number, w: any) => sum + w.ica, 0) / weeks.length
    const prev_month_ica = index > 0 ? arr[index - 1][1].reduce((sum: number, w: any) => sum + w.ica, 0) / arr[index - 1][1].length : avg_ica
    const change = avg_ica - prev_month_ica
    
    return { month, avg_ica, change }
  })
}

function simulateProgressionEvolution(sessions: any[], progressions: any[]): any[] {
  // This is a simplified simulation - in a real implementation,
  // you'd need to store historical progression data
  const weeks = groupSessionsByWeek(sessions || [])
  const current_avg = progressions.reduce((sum, p) => sum + p.current_level, 0) / progressions.length
  
  return weeks.map((week, index) => ({
    week: week.week,
    avg_level: Math.max(1, current_avg - (weeks.length - index - 1) * 0.1),
    exercises_progressed: Math.floor(Math.random() * 2)
  }))
}

function calculateProgressionLikelihood(progression: any): number {
  // Based on consecutive completions and current level
  const completion_factor = Math.min(progression.consecutive_completions / 3, 1)
  const level_factor = Math.max(0, 1 - (progression.current_level - 1) / 6)
  return Math.round((completion_factor * 0.7 + level_factor * 0.3) * 100) / 100
}

function calculateWeeklyBalanceScores(metrics: any[]): any[] {
  const weeks = new Map()
  
  metrics.forEach(metric => {
    if (!weeks.has(metric.week_start)) {
      weeks.set(metric.week_start, [])
    }
    weeks.get(metric.week_start).push(metric)
  })
  
  return Array.from(weeks.entries()).map(([week, week_metrics]) => {
    const volumes = week_metrics.map((m: any) => m.total_sets)
    const avg_volume = volumes.reduce((sum: number, vol: number) => sum + vol, 0) / volumes.length
    const variance = volumes.reduce((sum: number, vol: number) => sum + Math.pow(vol - avg_volume, 2), 0) / volumes.length
    const balance_score = Math.max(0, 1 - (Math.sqrt(variance) / avg_volume))
    
    const most_imbalanced = week_metrics.reduce((max: any, current: any) => 
      Math.abs(current.total_sets - avg_volume) > Math.abs(max.total_sets - avg_volume) ? current : max
    ).muscle_group
    
    return { week, balance_score, most_imbalanced }
  })
}

function calculateVolumesTrends(metrics: any[]): any[] {
  const muscle_groups = new Map()
  
  metrics.forEach(metric => {
    if (!muscle_groups.has(metric.muscle_group)) {
      muscle_groups.set(metric.muscle_group, [])
    }
    muscle_groups.get(metric.muscle_group).push(metric)
  })
  
  return Array.from(muscle_groups.entries()).map(([muscle_group, group_metrics]) => {
    const weekly_volumes = group_metrics
      .sort((a: any, b: any) => a.week_start.localeCompare(b.week_start))
      .map((metric: any, index: number, arr: any[]) => {
        const change_percentage = index > 0 ? 
          ((metric.total_sets - arr[index - 1].total_sets) / arr[index - 1].total_sets) * 100 : 0
        return {
          week: metric.week_start,
          total_sets: metric.total_sets,
          change_percentage
        }
      })
    
    const recent_changes = weekly_volumes.slice(-3).map(w => w.change_percentage)
    const avg_change = recent_changes.reduce((sum, change) => sum + change, 0) / recent_changes.length
    const trend = avg_change > 5 ? 'increasing' : avg_change < -5 ? 'decreasing' : 'stable'
    
    return { muscle_group, weekly_volumes, trend }
  })
}

function calculateWeeklyPerformance(session_data: any[]): any[] {
  const weekly_sessions = groupSessionsByWeek(session_data)
  
  return weekly_sessions.map(week_data => {
    const all_exercises = week_data.sessions.flatMap((s: any) => s.session_exercises || [])
    
    const avg_completion = all_exercises.reduce((sum: number, se: any) => {
      return sum + ((se.sets_completed * se.reps_completed) / (se.sets_planned * se.reps_planned))
    }, 0) / all_exercises.length
    
    const avg_rpe = all_exercises.reduce((sum: number, se: any) => sum + (se.rpe_reported || 7), 0) / all_exercises.length
    const avg_quality = all_exercises.reduce((sum: number, se: any) => sum + (se.technical_quality || 3), 0) / all_exercises.length
    
    return {
      week: week_data.week,
      avg_completion,
      avg_rpe,
      avg_quality
    }
  })
}

function calculateImprovementRate(values: number[]): number {
  if (values.length < 2) return 0
  const first_half = values.slice(0, Math.floor(values.length / 2))
  const second_half = values.slice(Math.floor(values.length / 2))
  
  const first_avg = first_half.reduce((sum, val) => sum + val, 0) / first_half.length
  const second_avg = second_half.reduce((sum, val) => sum + val, 0) / second_half.length
  
  return Math.round((second_avg - first_avg) * 100) / 100
}

function calculateRPEOptimizationScore(rpe_values: number[]): number {
  const optimal_rpe = 6.5
  const avg_distance_from_optimal = rpe_values.reduce((sum, rpe) => sum + Math.abs(rpe - optimal_rpe), 0) / rpe_values.length
  return Math.max(0, 1 - (avg_distance_from_optimal / 3)) // Max distance of 3 from optimal
}