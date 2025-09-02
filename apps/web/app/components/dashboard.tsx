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
  Target, 
  Clock, 
  Zap,
  Play,
  BarChart3
} from 'lucide-react'
import { routineService } from '../../lib/routine-service'
import { GeneratedSession, TrainingPlan } from '@bodyweight/shared'
import { DailyRoutine } from './daily-routine'
import { SessionFeedback } from './session-feedback'
import { ProgressCharts } from './progress-charts'

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
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateNewRoutine = async () => {
    try {
      setGeneratingRoutine(true)
      
      const trainingPlan = await routineService.generateDailyRoutine(1)
      
      if (trainingPlan.current_session) {
        const newSession = trainingPlan.current_session
        
        // Guardar la sesión en la base de datos y obtener el ID real
        const createdSession = await routineService.createTrainingSession(newSession)
        
        // Actualizar la sesión con el ID real de la base de datos
        const sessionWithRealId = {
          ...newSession,
          id: createdSession.id
        }
        
        setCurrentRoutine(sessionWithRealId)
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
                          {session.session_exercise_blocks?.length || 0} ejercicios
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
      </Tabs>
    </div>
  )
}
