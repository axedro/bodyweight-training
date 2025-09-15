'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Activity, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target, 
  Clock, 
  Zap,
  Play,
  BarChart3,
  AlertTriangle,
  Brain,
  ChevronRight
} from 'lucide-react'
import { routineService } from '../../lib/routine-service'
import { GeneratedSession, TrainingPlan } from '@bodyweight/shared'
import { DailyRoutine } from './daily-routine'
import { SessionFeedback } from './session-feedback'
import { ProgressCharts } from './progress-charts'
import { MuscleGroupAnalysis } from './muscle-group-analysis'
import EvolutionAnalytics from './evolution-analytics'
import { BiometricUpdate } from './biometric-update'

interface DashboardProps {
  user: any
  userProfile: any
  onLogout: () => void
}

export function Dashboard({ user, userProfile: profile, onLogout }: DashboardProps) {
  const [currentRoutine, setCurrentRoutine] = useState<GeneratedSession | null>(null)
  const [icaData, setIcaData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingRoutine, setGeneratingRoutine] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])
  const [muscleGroupData, setMuscleGroupData] = useState<any>(null)
  const [showBiometricUpdate, setShowBiometricUpdate] = useState(false)
  const [currentBiometricData, setCurrentBiometricData] = useState<any>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      if (user) {
        // Cargar rutina actual
        const routine = await routineService.getCurrentRoutine()
        setCurrentRoutine(routine)

        // Calcular ICA
        try {
          const icaResult = await routineService.calculateICA()
          setIcaData(icaResult)
        } catch (error) {
          console.error('Error calculating ICA:', error)
        }

        // Cargar historial de entrenamiento
        const history = await routineService.getTrainingHistory(5)
        setTrainingHistory(history)

        // Cargar análisis de grupos musculares
        try {
          const muscleGroups = await routineService.analyzeMuscleGroups()
          setMuscleGroupData(muscleGroups)
        } catch (error) {
          console.error('Error loading muscle group analysis:', error)
          // Set empty data instead of failing
          setMuscleGroupData({
            muscle_group_analyses: [],
            summary: {
              total_muscle_groups_trained: 0,
              most_trained: 'ninguno',
              recommendations: ['Error al cargar análisis de grupos musculares']
            }
          })
        }
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCurrentBiometrics = async () => {
    try {
      // Load latest biometric data from user profile and biometric snapshots
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-latest-biometrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await routineService.supabase.auth.getSession()).data.session?.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return data
      }
      
      // Fallback to profile data if biometric snapshots not available
      return {
        weight: profile?.weight,
        body_fat_percentage: profile?.body_fat_percentage,
        resting_hr: profile?.resting_hr,
        training_hr_avg: profile?.training_hr_avg,
        sleep_hours: profile?.sleep_hours,
        sleep_quality: profile?.sleep_quality,
        fatigue_level: profile?.fatigue_level,
        last_updated: profile?.updated_at
      }
    } catch (error) {
      console.error('Error loading biometrics:', error)
      return {}
    }
  }

  const generateNewRoutine = async () => {
    try {
      // First load current biometric data
      const biometricData = await loadCurrentBiometrics()
      setCurrentBiometricData(biometricData)
      
      // Show biometric update dialog first
      setShowBiometricUpdate(true)
    } catch (error) {
      console.error('Error preparing routine generation:', error)
    }
  }

  const handleBiometricUpdateComplete = async (updatedData: any) => {
    try {
      setGeneratingRoutine(true)
      setShowBiometricUpdate(false)
      
      // Generate routine with updated biometric data
      const trainingPlan = await routineService.generateDailyRoutine(1, updatedData)
      
      if (trainingPlan.current_session) {
        // La sesión ya viene con ID y session_exercise_ids del Edge Function
        setCurrentRoutine(trainingPlan.current_session)
      }
    } catch (error) {
      console.error('Error generating routine:', error)
    } finally {
      setGeneratingRoutine(false)
    }
  }

  const handleSessionComplete = async (feedback: any) => {
    try {
      // Guardar feedback
      if (currentRoutine && currentRoutine.id) {
        await routineService.saveSessionFeedback(currentRoutine.id, feedback)
      }
      
      // Actualizar ICA
      const icaResult = await routineService.calculateICA()
      setIcaData(icaResult)
      
      // Recargar historial
      const history = await routineService.getTrainingHistory(5)
      setTrainingHistory(history)
      
      setShowFeedback(false)
      setCurrentRoutine(null)
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }

  const handleSessionSkip = () => {
    setCurrentRoutine(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bienvenido de vuelta, {profile?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateNewRoutine} disabled={generatingRoutine}>
            {generatingRoutine ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generando...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Generar Rutina
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={onLogout}
        >
          Logout
        </Button>
        </div>
      </div>

      {/* ICA Score Card */}
      {icaData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Índice de Capacidad Actual (ICA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {icaData.ica_score?.toFixed(1) || 'N/A'}
                </div>
                <p className="text-sm text-muted-foreground">ICA Score</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round((icaData.adherence_rate || 0) * 100)}%
                </div>
                <p className="text-sm text-muted-foreground">Adherencia</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {icaData.recent_performance?.sessions_last_4_weeks || 0}
                </div>
                <p className="text-sm text-muted-foreground">Sesiones (4 semanas)</p>
              </div>
            </div>
            
            {/* ✨ NUEVO: Información temporal del algoritmo */}
            {icaData.temporal_context && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <h4 className="font-semibold text-blue-800">Análisis Temporal del Algoritmo</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {icaData.temporal_context.trend === 'improving' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {icaData.temporal_context.trend === 'declining' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {icaData.temporal_context.trend === 'stable' && <Activity className="h-4 w-4 text-blue-600" />}
                    <div>
                      <span className="font-medium">Tendencia</span>
                      <div className={`text-xs ${
                        icaData.temporal_context.trend === 'improving' ? 'text-green-600' : 
                        icaData.temporal_context.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {icaData.temporal_context.trend === 'improving' ? 'Mejorando' : 
                         icaData.temporal_context.trend === 'declining' ? 'Declinando' : 'Estable'}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Estabilidad</span>
                    <div className="text-xs text-muted-foreground">
                      {(icaData.temporal_context.stability_factor * 100).toFixed(0)}%
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">ICA Anterior</span>
                    <div className="text-xs text-muted-foreground">
                      {icaData.temporal_context.last_ica?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium">Hace</span>
                    <div className="text-xs text-muted-foreground">
                      {icaData.temporal_context.days_since_last_calculation} día{icaData.temporal_context.days_since_last_calculation !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                {icaData.temporal_context.temporal_adjustments_applied && (
                  <div className="mt-3 text-xs text-blue-700 bg-blue-100 p-2 rounded">
                    <strong>ICA Raw:</strong> {icaData.temporal_context.raw_ica_score?.toFixed(1)} → 
                    <strong> ICA Ajustado:</strong> {icaData.ica_score?.toFixed(1)} 
                    (suavizado temporal aplicado)
                  </div>
                )}
              </div>
            )}

            {icaData.recommendations && icaData.recommendations.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Recomendaciones:</h4>
                <ul className="space-y-1">
                  {icaData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm">• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="routine" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routine">Rutina de Hoy</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="muscle-groups">Grupos Musculares</TabsTrigger>
          <TabsTrigger value="evolution">Evolución</TabsTrigger>
        </TabsList>

        <TabsContent value="routine" className="space-y-4">
          {showFeedback ? (
            <SessionFeedback 
              onFeedbackSubmit={handleSessionComplete}
              onSkip={() => setShowFeedback(false)}
            />
          ) : currentRoutine ? (
            <DailyRoutine 
              session={currentRoutine}
              onSessionComplete={handleSessionComplete}
              onSessionSkip={handleSessionSkip}
            />
          ) : (
            <div className="space-y-4">
              {/* Muscle Group Imbalance Warnings */}
              {muscleGroupData && muscleGroupData.muscle_group_analyses && (
                <div className="space-y-2">
                  {muscleGroupData.muscle_group_analyses
                    .filter(analysis => analysis.imbalance_score > 30)
                    .map((analysis) => (
                      <Card key={analysis.muscle_group} className="border-orange-200 bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">
                              Desequilibrio en {analysis.muscle_group}
                            </span>
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                              {analysis.imbalance_score.toFixed(0)}% desequilibrio
                            </Badge>
                          </div>
                          {analysis.recommendations.length > 0 && (
                            <p className="text-xs text-orange-700 mt-1">
                              {analysis.recommendations[0]}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">🏋️</div>
                    <h3 className="text-xl font-semibold">No hay rutina para hoy</h3>
                    <p className="text-muted-foreground">
                      Genera una nueva rutina personalizada basada en tu progreso
                    </p>
                    <Button onClick={generateNewRoutine} disabled={generatingRoutine}>
                      {generatingRoutine ? 'Generando...' : 'Generar Rutina'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historial de Entrenamientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trainingHistory.length > 0 ? (
                <div className="space-y-4">
                  {trainingHistory.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(session.session_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Duración: {session.total_duration} min | 
                          ICA: {session.ica_score?.toFixed(1) || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {session.session_exercises?.length || 0} ejercicios
                        </Badge>
                        {session.completion_rate && (
                          <Badge variant={session.completion_rate > 0.8 ? "default" : "destructive"}>
                            {Math.round(session.completion_rate * 100)}% completado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay entrenamientos registrados</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <ProgressCharts userProfile={profile} />
        </TabsContent>

        <TabsContent value="muscle-groups" className="space-y-4">
          <MuscleGroupAnalysis userProfile={profile} />
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <EvolutionAnalytics />
        </TabsContent>
      </Tabs>

      {/* Biometric Update Dialog */}
      <BiometricUpdate
        isOpen={showBiometricUpdate}
        onClose={() => setShowBiometricUpdate(false)}
        onUpdate={handleBiometricUpdateComplete}
        currentData={currentBiometricData}
      />
    </div>
  )
}
