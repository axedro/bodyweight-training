'use client'

import { useEffect, useState } from 'react'
import { routineService } from '../../lib/routine-service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { TrendingUp, TrendingDown, Minus, Activity, Target, BarChart3, Calendar } from 'lucide-react'

interface EvolutionData {
  ica_evolution: {
    current: number
    trend: 'improving' | 'stable' | 'declining'
    weekly_changes: Array<{ week: string, ica: number, change: number }>
    monthly_changes: Array<{ month: string, avg_ica: number, change: number }>
    prediction_4_weeks: number
  }
  exercise_progression: {
    overall_trend: 'improving' | 'stable' | 'declining'
    avg_level_current: number
    exercises_detail: Array<{
      exercise_name: string
      level_progression: Array<{ week: string, level: number }>
      next_progression_likelihood: number
    }>
  }
  muscle_group_balance: {
    balance_score: number
    trend: 'improving' | 'stable' | 'declining'
    balance_evolution: Array<{ week: string, balance_score: number }>
    top_imbalanced_groups: Array<{ muscle_group: string, imbalance_severity: number }>
  }
  performance_metrics: {
    completion_rate: { current: number, trend: 'improving' | 'stable' | 'declining' }
    rpe_optimization: { current: number, trend: 'improving' | 'stable' | 'declining' }
    technical_quality: { current: number, trend: 'improving' | 'stable' | 'declining' }
    consistency: { current: number, trend: 'improving' | 'stable' | 'declining' }
  }
  overall_progress: {
    score: number
    classification: string
    recommendations: string[]
  }
}

const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving': return <TrendingUp className="w-4 h-4 text-green-500" />
    case 'declining': return <TrendingDown className="w-4 h-4 text-red-500" />
    default: return <Minus className="w-4 h-4 text-yellow-500" />
  }
}

const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
  switch (trend) {
    case 'improving': return 'text-green-600 bg-green-50 border-green-200'
    case 'declining': return 'text-red-600 bg-red-50 border-red-200'
    default: return 'text-yellow-600 bg-yellow-50 border-yellow-200'
  }
}

export default function EvolutionAnalytics() {
  const [evolutionData, setEvolutionData] = useState<EvolutionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvolutionData()
  }, [])

  const loadEvolutionData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await routineService.analyzeEvolution()
      setEvolutionData(data)
    } catch (err) {
      console.error('Error loading evolution data:', err)
      setError('Error cargando datos de evolución')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Evolución Temporal</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !evolutionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          {error || 'No hay datos de evolución disponibles'}
        </p>
        <button
          onClick={loadEvolutionData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Intentar de nuevo
        </button>
      </div>
    )
  }

  const { ica_evolution, exercise_progression, muscle_group_balance, performance_metrics, overall_progress } = evolutionData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Evolución Temporal</h2>
        <Badge variant="outline" className="ml-auto">
          {overall_progress.classification}
        </Badge>
      </div>

      {/* Overall Progress Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Puntuación General de Progreso
            </CardTitle>
            <Badge className="bg-blue-100 text-blue-800">
              {Math.round(overall_progress.score * 100)}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overall_progress.score * 100} className="mb-4" />
          <div className="space-y-2">
            {overall_progress.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                <span className="text-gray-700">{rec}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ICA Evolution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Evolución del ICA
            </CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(ica_evolution.trend)}
              <Badge className={getTrendColor(ica_evolution.trend)}>
                {ica_evolution.trend === 'improving' ? 'Mejorando' : 
                 ica_evolution.trend === 'declining' ? 'Declinando' : 'Estable'}
              </Badge>
            </div>
          </div>
          <CardDescription>
            ICA Actual: {ica_evolution.current.toFixed(3)} • 
            Predicción 4 semanas: {ica_evolution.prediction_4_weeks.toFixed(3)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Cambios Semanales Recientes</h4>
              <div className="space-y-1">
                {ica_evolution.weekly_changes.slice(-4).map((change, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{change.week}</span>
                    <span className={change.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {change.ica.toFixed(3)} ({change.change > 0 ? '+' : ''}{change.change.toFixed(3)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Cambios Mensuales</h4>
              <div className="space-y-1">
                {ica_evolution.monthly_changes.slice(-3).map((change, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{change.month}</span>
                    <span className={change.change > 0 ? 'text-green-600' : 'text-red-600'}>
                      {change.avg_ica.toFixed(3)} ({change.change > 0 ? '+' : ''}{change.change.toFixed(3)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Progression */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Progresión de Ejercicios</CardTitle>
            <div className="flex items-center gap-2">
              {getTrendIcon(exercise_progression.overall_trend)}
              <Badge className={getTrendColor(exercise_progression.overall_trend)}>
                Nivel Promedio: {exercise_progression.avg_level_current.toFixed(1)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exercise_progression.exercises_detail.map((exercise, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{exercise.exercise_name}</span>
                  <Badge variant="outline">
                    Nivel {exercise.level_progression[exercise.level_progression.length - 1]?.level || 1}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Probabilidad próxima progresión:</span>
                  <span className="font-medium">
                    {Math.round(exercise.next_progression_likelihood * 100)}%
                  </span>
                </div>
                <Progress 
                  value={exercise.next_progression_likelihood * 100} 
                  className="mt-2 h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balance Muscular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Puntuación Balance:</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(muscle_group_balance.trend)}
                  <Badge variant="outline">
                    {Math.round(muscle_group_balance.balance_score * 100)}%
                  </Badge>
                </div>
              </div>
              
              {muscle_group_balance.top_imbalanced_groups.length > 0 && (
                <div>
                  <h5 className="font-medium text-sm mb-2">Grupos Musculares Desequilibrados:</h5>
                  <div className="space-y-2">
                    {muscle_group_balance.top_imbalanced_groups.slice(0, 3).map((group, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="capitalize">{group.muscle_group}</span>
                        <Badge variant="destructive" className="text-xs">
                          {Math.round(group.imbalance_severity * 100)}% desbalance
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas de Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Tasa Completitud:</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(performance_metrics.completion_rate.trend)}
                  <span className="text-sm font-medium">
                    {Math.round(performance_metrics.completion_rate.current * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimización RPE:</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(performance_metrics.rpe_optimization.trend)}
                  <span className="text-sm font-medium">
                    {Math.round(performance_metrics.rpe_optimization.current * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Calidad Técnica:</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(performance_metrics.technical_quality.trend)}
                  <span className="text-sm font-medium">
                    {Math.round(performance_metrics.technical_quality.current * 100)}%
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Consistencia:</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(performance_metrics.consistency.trend)}
                  <span className="text-sm font-medium">
                    {Math.round(performance_metrics.consistency.current * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={loadEvolutionData}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          Actualizar Análisis
        </button>
      </div>
    </div>
  )
}