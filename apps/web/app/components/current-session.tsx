'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import { UserProfile, TrainingPlan, GeneratedSession } from '@bodyweight/shared'
import { Play, Pause, Check, Clock, Target, Zap } from 'lucide-react'

interface CurrentSessionProps {
  userProfile: UserProfile
  trainingPlan: TrainingPlan | null
  onSessionComplete: () => void
}

export function CurrentSession({ userProfile, trainingPlan, onSessionComplete }: CurrentSessionProps) {
  const [sessionState, setSessionState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started')
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())

  const session = trainingPlan?.current_session

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay sesión disponible</CardTitle>
          <CardDescription>
            No se pudo generar una sesión de entrenamiento. Intenta recargar la página.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totalExercises = session.warm_up.length + session.main_work.length + session.cool_down.length
  const completedCount = completedExercises.size
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0

  const handleStartSession = () => {
    setSessionState('in_progress')
  }

  const handleCompleteExercise = (exerciseId: string) => {
    setCompletedExercises(prev => new Set([...prev, exerciseId]))
  }

  const handleCompleteSession = () => {
    setSessionState('completed')
    onSessionComplete()
  }

  const renderExerciseSection = (title: string, exercises: any[], type: 'warm_up' | 'main_work' | 'cool_down') => {
    if (exercises.length === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {type === 'warm_up' && <Zap className="h-5 w-5 text-yellow-500" />}
            {type === 'main_work' && <Target className="h-5 w-5 text-red-500" />}
            {type === 'cool_down' && <Clock className="h-5 w-5 text-blue-500" />}
            {title}
          </CardTitle>
          <CardDescription>
            {type === 'warm_up' && 'Ejercicios de calentamiento'}
            {type === 'main_work' && 'Trabajo principal'}
            {type === 'cool_down' && 'Enfriamiento y estiramiento'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {exercises.map((exercise, index) => (
            <div
              key={exercise.id || index}
              className={`p-4 border rounded-lg ${
                completedExercises.has(exercise.id || index.toString())
                  ? 'bg-green-50 border-green-200'
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-muted-foreground">{exercise.description}</p>
                  {exercise.sets && exercise.reps && (
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{exercise.sets} series</Badge>
                      <Badge variant="secondary">{exercise.reps} repeticiones</Badge>
                    </div>
                  )}
                </div>
                {sessionState === 'in_progress' && (
                  <Button
                    size="sm"
                    variant={completedExercises.has(exercise.id || index.toString()) ? "outline" : "default"}
                    onClick={() => handleCompleteExercise(exercise.id || index.toString())}
                  >
                    {completedExercises.has(exercise.id || index.toString()) ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      'Completar'
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Sesión de Entrenamiento</CardTitle>
          <CardDescription>
            {sessionState === 'not_started' && 'Preparado para comenzar tu entrenamiento'}
            {sessionState === 'in_progress' && '¡En progreso! Mantén el ritmo'}
            {sessionState === 'completed' && '¡Excelente trabajo! Sesión completada'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{session.estimated_duration}</div>
              <div className="text-sm text-muted-foreground">Minutos estimados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{Math.round(session.intensity_target * 100)}%</div>
              <div className="text-sm text-muted-foreground">Intensidad objetivo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{session.recovery_requirement}h</div>
              <div className="text-sm text-muted-foreground">Recuperación necesaria</div>
            </div>
          </div>

          {sessionState !== 'not_started' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>{completedCount}/{totalExercises} ejercicios</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {sessionState === 'not_started' && (
            <Button onClick={handleStartSession} className="w-full">
              <Play className="h-4 w-4 mr-2" />
              Comenzar Sesión
            </Button>
          )}

          {sessionState === 'in_progress' && progress === 100 && (
            <Button onClick={handleCompleteSession} className="w-full">
              <Check className="h-4 w-4 mr-2" />
              Completar Sesión
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {trainingPlan?.recommendations && trainingPlan.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {trainingPlan.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-sm">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Exercise Sections */}
      {renderExerciseSection('Calentamiento', session.warm_up, 'warm_up')}
      {renderExerciseSection('Trabajo Principal', session.main_work, 'main_work')}
      {renderExerciseSection('Enfriamiento', session.cool_down, 'cool_down')}
    </div>
  )
}
