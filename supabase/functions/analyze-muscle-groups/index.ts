import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

interface MuscleGroupAnalysis {
  muscle_group: string
  current_week: {
    total_sets: number
    total_reps: number
    avg_rpe: number
    total_sessions: number
    progression_level_avg: number
  }
  last_4_weeks: {
    total_sets: number
    total_reps: number
    avg_rpe: number
    total_sessions: number
    progression_trend: number
  }
  recommendations: string[]
  imbalance_score: number
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

    // Get current week start (Monday)
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)
    const currentWeekStart = monday.toISOString().split('T')[0]

    // Get 4 weeks ago
    const fourWeeksAgo = new Date(monday)
    fourWeeksAgo.setDate(monday.getDate() - 28)
    const fourWeeksStart = fourWeeksAgo.toISOString().split('T')[0]

    // Get exercise performance data for the last 4 weeks
    const { data: performanceData } = await supabase
      .from('exercise_performance')
      .select(`
        *,
        exercises (
          muscle_groups,
          progression_level
        )
      `)
      .eq('user_id', user.id)
      .gte('session_date', fourWeeksStart)
      .order('session_date', { ascending: false })

    // Process muscle group data
    const muscleGroupData = new Map<string, {
      currentWeek: any[],
      allData: any[]
    }>()

    performanceData?.forEach(perf => {
      const sessionDate = new Date(perf.session_date)
      const isCurrentWeek = sessionDate >= monday
      
      perf.muscle_groups?.forEach((muscleGroup: string) => {
        if (!muscleGroupData.has(muscleGroup)) {
          muscleGroupData.set(muscleGroup, {
            currentWeek: [],
            allData: []
          })
        }
        
        const groupData = muscleGroupData.get(muscleGroup)!
        groupData.allData.push(perf)
        
        if (isCurrentWeek) {
          groupData.currentWeek.push(perf)
        }
      })
    })

    // Analyze each muscle group
    const analyses: MuscleGroupAnalysis[] = []
    
    for (const [muscleGroup, data] of muscleGroupData) {
      const currentWeekData = data.currentWeek
      const allData = data.allData
      
      // Current week analysis
      const currentWeekSets = currentWeekData.length
      const currentWeekReps = currentWeekData.reduce((sum, perf) => sum + perf.reps_completed, 0)
      const currentWeekAvgRpe = currentWeekData.length > 0 
        ? currentWeekData.reduce((sum, perf) => sum + (perf.rpe_reported || 0), 0) / currentWeekData.length 
        : 0
      
      // Last 4 weeks analysis
      const totalSets = allData.length
      const totalReps = allData.reduce((sum, perf) => sum + perf.reps_completed, 0)
      const avgRpe = allData.length > 0 
        ? allData.reduce((sum, perf) => sum + (perf.rpe_reported || 0), 0) / allData.length 
        : 0
      
      // Get unique session dates
      const uniqueSessions = new Set(allData.map(perf => perf.session_date))
      
      // Calculate progression trend (simplified)
      const firstWeekData = allData.filter(perf => {
        const perfDate = new Date(perf.session_date)
        return perfDate >= fourWeeksAgo && perfDate < new Date(fourWeeksAgo.getTime() + 7 * 24 * 60 * 60 * 1000)
      })
      
      const progressionTrend = currentWeekData.length > 0 && firstWeekData.length > 0
        ? (currentWeekAvgRpe - (firstWeekData.reduce((sum, perf) => sum + (perf.rpe_reported || 0), 0) / firstWeekData.length)) * 100
        : 0

      // Generate recommendations
      const recommendations: string[] = []
      
      if (currentWeekSets === 0) {
        recommendations.push(`No se ha trabajado ${muscleGroup} esta semana`)
      } else if (currentWeekSets < 6) {
        recommendations.push(`${muscleGroup} necesita más volumen (solo ${currentWeekSets} series esta semana)`)
      }
      
      if (currentWeekAvgRpe < 6) {
        recommendations.push(`Aumentar intensidad en ${muscleGroup} (RPE promedio: ${currentWeekAvgRpe.toFixed(1)})`)
      } else if (currentWeekAvgRpe > 8.5) {
        recommendations.push(`Reducir intensidad en ${muscleGroup} (RPE promedio: ${currentWeekAvgRpe.toFixed(1)})`)
      }
      
      if (progressionTrend < -10) {
        recommendations.push(`${muscleGroup} muestra signos de fatiga o regresión`)
      }

      // Calculate imbalance score (simplified - compare to average across all groups)
      const totalWeeklyVolume = Array.from(muscleGroupData.values())
        .reduce((sum, groupData) => sum + groupData.currentWeek.length, 0)
      const averageVolume = totalWeeklyVolume / muscleGroupData.size
      const imbalanceScore = averageVolume > 0 
        ? Math.abs((currentWeekSets - averageVolume) / averageVolume) * 100 
        : 0

      analyses.push({
        muscle_group: muscleGroup,
        current_week: {
          total_sets: currentWeekSets,
          total_reps: currentWeekReps,
          avg_rpe: currentWeekAvgRpe,
          total_sessions: new Set(currentWeekData.map(perf => perf.session_date)).size,
          progression_level_avg: 0 // TODO: Calculate from exercises data
        },
        last_4_weeks: {
          total_sets: totalSets,
          total_reps: totalReps,
          avg_rpe: avgRpe,
          total_sessions: uniqueSessions.size,
          progression_trend: progressionTrend
        },
        recommendations,
        imbalance_score: imbalanceScore
      })
    }

    // Update muscle group metrics table
    const weekStart = currentWeekStart
    for (const analysis of analyses) {
      await supabase
        .from('muscle_group_metrics')
        .upsert({
          user_id: user.id,
          muscle_group: analysis.muscle_group,
          week_start: weekStart,
          total_sets: analysis.current_week.total_sets,
          total_reps: analysis.current_week.total_reps,
          avg_rpe: analysis.current_week.avg_rpe,
          exercises_attempted: analysis.current_week.total_sessions,
          imbalance_score: analysis.imbalance_score,
          relative_volume: analysis.current_week.total_sets / Math.max(1, analyses.reduce((sum, a) => sum + a.current_week.total_sets, 0)) * 100,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,muscle_group,week_start'
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        muscle_group_analyses: analyses,
        summary: {
          total_muscle_groups_trained: analyses.length,
          most_trained: analyses.reduce((max, curr) => 
            curr.current_week.total_sets > max.current_week.total_sets ? curr : max, 
            analyses[0] || { muscle_group: 'none', current_week: { total_sets: 0 } }
          ).muscle_group,
          recommendations: analyses.flatMap(a => a.recommendations).slice(0, 5)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-muscle-groups:', error)
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