'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { UserProfile, TrainingSession } from '@bodyweight/shared'
import { Calendar, Clock, Target, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface TrainingHistoryProps {
  userProfile: UserProfile
}

export function TrainingHistory({ userProfile }: TrainingHistoryProps) {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadTrainingHistory()
  }, [userProfile.id])

  const loadTrainingHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('session_date', { ascending: false })
        .limit(20)

      if (error) throw error

      setSessions(data || [])
    } catch (error) {
      console.error('Error loading training history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Completado</Badge>
      case 'in_progress':
        return <Badge variant="secondary">En progreso</Badge>
      case 'skipped':
        return <Badge variant="destructive">Saltado</Badge>
      default:
        return <Badge variant="outline">Planificado</Badge>
    }
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 0.8) return 'text-red-600'
    if (intensity >= 0.6) return 'text-orange-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Entrenamientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando historial...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Entrenamientos
          </CardTitle>
          <CardDescription>
            Últimas {sessions.length} sesiones de entrenamiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay sesiones registradas</h3>
              <p className="text-muted-foreground">
                Comienza tu primera sesión de entrenamiento para ver tu historial aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {format(new Date(session.session_date), 'dd', { locale: es })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(session.session_date), 'MMM', { locale: es })}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          Sesión de {session.actual_duration || session.planned_duration} min
                        </h4>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {session.ica_score && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />
                            ICA: {session.ica_score.toFixed(1)}
                          </div>
                        )}
                        
                        {session.actual_intensity && (
                          <div className={`flex items-center gap-1 ${getIntensityColor(session.actual_intensity)}`}>
                            <Target className="h-4 w-4" />
                            {Math.round(session.actual_intensity * 100)}% intensidad
                          </div>
                        )}
                        
                        {session.actual_duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.actual_duration} min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {session.notes && (
                    <div className="text-sm text-muted-foreground max-w-xs">
                      {session.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
