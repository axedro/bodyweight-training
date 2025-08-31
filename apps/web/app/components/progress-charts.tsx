'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { UserProfile, TrainingSession } from '@bodyweight/shared'
import { TrendingUp, Calendar, Target, Activity } from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProgressChartsProps {
  userProfile: UserProfile
}

export function ProgressCharts({ userProfile }: ProgressChartsProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadSessionsForCharts()
  }, [userProfile.id])

  const loadSessionsForCharts = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: true })
        .limit(30)

      if (error) throw error

      setSessions(data || [])
    } catch (error) {
      console.error('Error loading sessions for charts:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyStats = () => {
    const now = new Date()
    const weekStart = startOfWeek(now, { locale: es })
    const weekEnd = endOfWeek(now, { locale: es })

    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.session_date)
      return sessionDate >= weekStart && sessionDate <= weekEnd
    })

    return {
      sessionsThisWeek: weekSessions.length,
      totalDuration: weekSessions.reduce((sum, session) => sum + (session.actual_duration || 0), 0),
      avgIntensity: weekSessions.length > 0 
        ? weekSessions.reduce((sum, session) => sum + (session.actual_intensity || 0), 0) / weekSessions.length
        : 0,
      avgICA: weekSessions.length > 0
        ? weekSessions.reduce((sum, session) => sum + (session.ica_score || 0), 0) / weekSessions.length
        : 0
    }
  }

  const calculateMonthlyProgress = () => {
    const last30Days = sessions.filter(session => {
      const sessionDate = new Date(session.session_date)
      const thirtyDaysAgo = subDays(new Date(), 30)
      return sessionDate >= thirtyDaysAgo
    })

    return {
      sessionsLast30Days: last30Days.length,
      consistencyRate: last30Days.length / 30 * 100, // Assuming 30 days
      improvementRate: calculateImprovementRate(last30Days)
    }
  }

  const calculateImprovementRate = (recentSessions: TrainingSession[]) => {
    if (recentSessions.length < 2) return 0

    const sortedSessions = recentSessions.sort((a, b) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    )

    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2))
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2))

    const avgFirstHalf = firstHalf.reduce((sum, session) => sum + (session.ica_score || 0), 0) / firstHalf.length
    const avgSecondHalf = secondHalf.reduce((sum, session) => sum + (session.ica_score || 0), 0) / secondHalf.length

    return avgFirstHalf > 0 ? ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100 : 0
  }

  const weeklyStats = calculateWeeklyStats()
  const monthlyProgress = calculateMonthlyProgress()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Progreso y Estadísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando estadísticas...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumen de la Semana
          </CardTitle>
          <CardDescription>
            Estadísticas de esta semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weeklyStats.sessionsThisWeek}</div>
              <div className="text-sm text-muted-foreground">Sesiones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{weeklyStats.totalDuration}</div>
              <div className="text-sm text-muted-foreground">Minutos totales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(weeklyStats.avgIntensity * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Intensidad promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {weeklyStats.avgICA.toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">ICA promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Progreso Mensual
          </CardTitle>
          <CardDescription>
            Últimos 30 días de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{monthlyProgress.sessionsLast30Days}</div>
              <div className="text-sm text-muted-foreground">Sesiones completadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {Math.round(monthlyProgress.consistencyRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Tasa de consistencia</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                monthlyProgress.improvementRate > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {monthlyProgress.improvementRate > 0 ? '+' : ''}{Math.round(monthlyProgress.improvementRate)}%
              </div>
              <div className="text-sm text-muted-foreground">Mejora en ICA</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rendimiento Reciente
          </CardTitle>
          <CardDescription>
            Últimas 10 sesiones completadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay datos de rendimiento</h3>
              <p className="text-muted-foreground">
                Completa algunas sesiones para ver tu rendimiento aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.slice(-10).reverse().map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(session.session_date), 'dd MMM', { locale: es })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {Math.round((session.actual_intensity || 0) * 100)}% intensidad
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      ICA: {session.ica_score?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
