'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { 
  Play, 
  Pause, 
  SkipForward, 
  CheckCircle, 
  Circle,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { GeneratedSession } from '@bodyweight/shared'

interface DailyRoutineProps {
  session: GeneratedSession
  onSessionComplete: (feedback: any) => void
  onSessionSkip: () => void
}

export function DailyRoutine({ session, onSessionComplete, onSessionSkip }: DailyRoutineProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [restTimeLeft, setRestTimeLeft] = useState(0)
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set())
  const [sessionCompleted, setSessionCompleted] = useState(false)

  const allExercises = [
    ...session.warm_up.map(ex => ({ ...ex.exercise, type: 'warmup', ...ex })),
    ...session.exercise_blocks.map(block => ({ ...block.exercise, type: 'main', ...block })),
    ...session.cool_down.map(ex => ({ ...ex.exercise, type: 'cooldown', ...ex }))
  ]

  const currentExercise = allExercises[currentExerciseIndex]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isResting && restTimeLeft > 0) {
      interval = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isResting, restTimeLeft])

  const startRest = (seconds: number) => {
    setIsResting(true)
    setRestTimeLeft(seconds)
  }

  const skipRest = () => {
    setIsResting(false)
    setRestTimeLeft(0)
  }

  const completeExercise = () => {
    setCompletedExercises(prev => new Set([...prev, currentExerciseIndex]))
    
    if (currentExerciseIndex < allExercises.length - 1) {
      // Si no es el último ejercicio, ir al siguiente
      const nextExercise = allExercises[currentExerciseIndex + 1]
      if (nextExercise.rest_seconds && nextExercise.rest_seconds > 0) {
        startRest(nextExercise.rest_seconds)
      }
      setCurrentExerciseIndex(prev => prev + 1)
    } else {
      // Sesión completada
      setSessionCompleted(true)
    }
  }

  const skipExercise = () => {
    if (currentExerciseIndex < allExercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'bg-blue-100 text-blue-800'
      case 'main': return 'bg-green-100 text-green-800'
      case 'cooldown': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getExerciseTypeLabel = (type: string) => {
    switch (type) {
      case 'warmup': return 'Calentamiento'
      case 'main': return 'Trabajo Principal'
      case 'cooldown': return 'Enfriamiento'
      default: return 'Ejercicio'
    }
  }

  if (sessionCompleted) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-green-600">¡Rutina Completada!</h3>
            <p className="text-muted-foreground">
              Has completado {completedExercises.size} de {allExercises.length} ejercicios
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => onSessionComplete({
                completion_rate: completedExercises.size / allExercises.length,
                rpe_reported: 7,
                technical_quality: 4,
                enjoyment_level: 4,
                recovery_feeling: 4
              })}>
                Finalizar Sesión
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sesión de Entrenamiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {completedExercises.size}/{allExercises.length}
              </div>
              <p className="text-sm text-muted-foreground">Ejercicios</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {session.duration_minutes}min
              </div>
              <p className="text-sm text-muted-foreground">Duración</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(session.intensity * 100)}%
              </div>
              <p className="text-sm text-muted-foreground">Intensidad</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                2h
              </div>
              <p className="text-sm text-muted-foreground">Recuperación</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progreso</span>
              <span>{Math.round((completedExercises.size / allExercises.length) * 100)}%</span>
            </div>
            <Progress value={(completedExercises.size / allExercises.length) * 100} />
          </div>
        </CardContent>
      </Card>

      {/* Current Exercise */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Ejercicio Actual
              </CardTitle>
              <Badge className={getExerciseTypeColor(currentExercise.type)}>
                {getExerciseTypeLabel(currentExercise.type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h3 className="text-xl font-semibold">{currentExercise.name}</h3>
              <p className="text-muted-foreground">{currentExercise.instructions || 'Sigue la técnica apropiada'}</p>
            </div>

            {currentExercise.type === 'main' && (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {currentExercise.sets || 3}
                  </div>
                  <p className="text-sm text-muted-foreground">Series</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {currentExercise.reps || 10}
                  </div>
                  <p className="text-sm text-muted-foreground">Repeticiones</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentExercise.rest_seconds || 60}s
                  </div>
                  <p className="text-sm text-muted-foreground">Descanso</p>
                </div>
              </div>
            )}

            {isResting && (
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold text-blue-600">
                    Descanso: {formatTime(restTimeLeft)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Prepárate para el siguiente ejercicio
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={skipRest}
                  className="flex items-center gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Saltar Descanso
                </Button>
              </div>
            )}

            <div className="flex gap-2 justify-center">
              {currentExercise.type === 'main' ? (
                <>
                  <Button 
                    onClick={completeExercise}
                    className="flex items-center gap-2"
                    disabled={isResting}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Completar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={skipExercise}
                    disabled={isResting}
                  >
                    <SkipForward className="h-4 w-4" />
                    Saltar
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={completeExercise}
                  className="flex items-center gap-2"
                  disabled={isResting}
                >
                  <CheckCircle className="h-4 w-4" />
                  Completar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ejercicios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allExercises.map((exercise, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  index === currentExerciseIndex 
                    ? 'border-primary bg-primary/5' 
                    : completedExercises.has(index)
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {completedExercises.has(index) ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium">{exercise.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {getExerciseTypeLabel(exercise.type)}
                      </Badge>
                      {exercise.type === 'main' && (
                        <span className="text-xs text-muted-foreground">
                          {exercise.sets}x{exercise.reps}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {index === currentExerciseIndex && (
                  <Badge className="bg-primary text-primary-foreground">
                    Actual
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skip Session Button */}
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={onSessionSkip}
          className="text-muted-foreground"
        >
          Saltar Rutina
        </Button>
      </div>
    </div>
  )
}
