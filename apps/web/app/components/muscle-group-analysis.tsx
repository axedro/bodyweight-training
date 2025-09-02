'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Zap,
  RefreshCw
} from 'lucide-react'
import { routineService } from '../../lib/routine-service'

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

interface MuscleGroupAnalysisProps {
  userProfile?: any
}

export function MuscleGroupAnalysis({ userProfile }: MuscleGroupAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<{
    muscle_group_analyses: MuscleGroupAnalysis[]
    summary: any
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await routineService.analyzeMuscleGroups()
      setAnalysisData(result)
    } catch (error) {
      console.error('Error loading muscle group analysis:', error)
      setError('No se pudo cargar el análisis de grupos musculares')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalysis()
  }, [])

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: { [key: string]: string } = {
      'chest': 'bg-red-500',
      'back': 'bg-blue-500',
      'shoulders': 'bg-yellow-500',
      'arms': 'bg-green-500',
      'triceps': 'bg-green-600',
      'biceps': 'bg-green-400',
      'legs': 'bg-purple-500',
      'quadriceps': 'bg-purple-600',
      'hamstrings': 'bg-purple-400',
      'glutes': 'bg-pink-500',
      'core': 'bg-orange-500',
      'abs': 'bg-orange-600',
      'obliques': 'bg-orange-400',
      'cardio': 'bg-gray-500'
    }
    return colors[muscleGroup] || 'bg-gray-400'
  }

  const getImbalanceStatus = (score: number) => {
    if (score < 20) return { status: 'balanced', color: 'text-green-600', icon: CheckCircle }
    if (score < 50) return { status: 'minor', color: 'text-yellow-600', icon: AlertTriangle }
    return { status: 'major', color: 'text-red-600', icon: AlertTriangle }
  }

  const getProgressionTrend = (trend: number) => {
    if (trend > 10) return { color: 'text-green-600', text: 'Mejorando', icon: TrendingUp }
    if (trend > -10) return { color: 'text-gray-600', text: 'Estable', icon: TrendingUp }
    return { color: 'text-red-600', text: 'Declinando', icon: TrendingUp }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground ml-4">Analizando grupos musculares...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error}</p>
            <Button onClick={loadAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!analysisData || analysisData.muscle_group_analyses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis por Grupos Musculares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              No hay suficientes datos para generar el análisis. 
              Completa algunos entrenamientos primero.
            </p>
            <Button onClick={loadAnalysis} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar Análisis
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { muscle_group_analyses, summary } = analysisData

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis por Grupos Musculares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {summary.total_muscle_groups_trained}
              </div>
              <p className="text-sm text-muted-foreground">Grupos Entrenados</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {summary.most_trained}
              </div>
              <p className="text-sm text-muted-foreground">Más Entrenado</p>
            </div>
            <div className="text-center">
              <Button onClick={loadAnalysis} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>

          {summary.recommendations && summary.recommendations.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Recomendaciones Principales:
              </h4>
              <ul className="space-y-1">
                {summary.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Individual Muscle Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {muscle_group_analyses.map((analysis) => {
          const imbalanceStatus = getImbalanceStatus(analysis.imbalance_score)
          const progressionTrend = getProgressionTrend(analysis.last_4_weeks.progression_trend)
          const Icon = imbalanceStatus.icon

          return (
            <Card key={analysis.muscle_group}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getMuscleGroupColor(analysis.muscle_group)}`}></div>
                  {analysis.muscle_group}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Week Stats */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Esta Semana</span>
                    <span className="text-sm text-muted-foreground">
                      {analysis.current_week.total_sets} series
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{analysis.current_week.total_reps}</div>
                      <div className="text-muted-foreground">Reps</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{analysis.current_week.avg_rpe.toFixed(1)}</div>
                      <div className="text-muted-foreground">RPE Prom</div>
                    </div>
                  </div>
                </div>

                {/* Progression Trend */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tendencia:</span>
                  <div className={`flex items-center gap-1 ${progressionTrend.color}`}>
                    <progressionTrend.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{progressionTrend.text}</span>
                  </div>
                </div>

                {/* Balance Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm">Balance:</span>
                  <div className={`flex items-center gap-1 ${imbalanceStatus.color}`}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {imbalanceStatus.status === 'balanced' ? 'Balanceado' : 
                       imbalanceStatus.status === 'minor' ? 'Leve desequilibrio' : 
                       'Desequilibrio mayor'}
                    </span>
                  </div>
                </div>

                {/* Volume Indicator */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Volumen 4 semanas</span>
                    <span className="text-xs">{analysis.last_4_weeks.total_sets} series</span>
                  </div>
                  <Progress 
                    value={Math.min(100, (analysis.last_4_weeks.total_sets / 50) * 100)} 
                    className="h-2"
                  />
                </div>

                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="space-y-1">
                    {analysis.recommendations.slice(0, 2).map((rec, index) => (
                      <Badge key={index} variant="outline" className="text-xs block">
                        {rec}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}