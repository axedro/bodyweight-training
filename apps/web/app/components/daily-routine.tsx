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
  Zap,
  AlertTriangle,
  RefreshCw,
  Info,
  Plus,
  Minus,
  Save
} from 'lucide-react'
import { Input } from './ui/input'
import { Label } from './ui/label'
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
  const [showAlternative, setShowAlternative] = useState(false)
  const [exerciseStruggle, setExerciseStruggle] = useState<string | null>(null)
  const [showPerformanceInput, setShowPerformanceInput] = useState(false)
  const [exercisePerformanceData, setExercisePerformanceData] = useState<Map<number, any>>(new Map())
  const [currentPerformance, setCurrentPerformance] = useState({
    sets_completed: 0,
    reps_per_set: [] as number[],
    total_time_seconds: 0,
    rpe_reported: 5,
    technical_quality: 4,
    // Circuit-specific fields
    circuits_completed: 0,
    reps_per_circuit: [] as number[],
    rpe_per_circuit: [] as number[],
    technique_per_circuit: [] as number[]
  })

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

  const startExerciseCompletion = () => {
    const exercise = allExercises[currentExerciseIndex]
    
    // Initialize performance data based on exercise type
    if (exercise.type === 'main') {
      // Check if this is circuit format
      if (exercise.is_circuit_format) {
        const defaultRepsPerCircuit = Array(exercise.circuits_planned || 3).fill(exercise.reps || 10)
        const defaultRpePerCircuit = Array(exercise.circuits_planned || 3).fill(5)
        const defaultTechniquePerCircuit = Array(exercise.circuits_planned || 3).fill(4)
        setCurrentPerformance({
          sets_completed: 0,
          reps_per_set: [],
          circuits_completed: exercise.circuits_planned || 3,
          reps_per_circuit: defaultRepsPerCircuit,
          rpe_per_circuit: defaultRpePerCircuit,
          technique_per_circuit: defaultTechniquePerCircuit,
          total_time_seconds: exercise.duration_seconds || 0,
          rpe_reported: 5,
          technical_quality: 4
        })
      } else {
        // Traditional format
        const defaultRepsPerSet = Array(exercise.sets || 3).fill(exercise.reps || 10)
        setCurrentPerformance({
          sets_completed: exercise.sets || 3,
          reps_per_set: defaultRepsPerSet,
          circuits_completed: 0,
          reps_per_circuit: [],
          rpe_per_circuit: [],
          technique_per_circuit: [],
          total_time_seconds: exercise.duration_seconds || 0,
          rpe_reported: 5,
          technical_quality: 4
        })
      }
    } else {
      // For warmup/cooldown
      setCurrentPerformance({
        sets_completed: 1,
        reps_per_set: [exercise.reps || 10],
        circuits_completed: 0,
        reps_per_circuit: [],
        rpe_per_circuit: [],
        technique_per_circuit: [],
        total_time_seconds: exercise.duration_seconds || 30,
        rpe_reported: 3,
        technical_quality: 5
      })
    }
    
    setShowPerformanceInput(true)
  }

  const saveExercisePerformance = () => {
    // Save performance data for this exercise
    setExercisePerformanceData(prev => new Map(prev).set(currentExerciseIndex, {
      ...currentPerformance,
      exercise: allExercises[currentExerciseIndex]
    }))
    
    setCompletedExercises(prev => new Set([...prev, currentExerciseIndex]))
    setShowPerformanceInput(false)
    
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

  const completeExercise = () => {
    const exercise = allExercises[currentExerciseIndex]
    // For main exercises, show performance input. For warmup/cooldown, complete directly
    if (exercise.type === 'main') {
      startExerciseCompletion()
    } else {
      // For warmup/cooldown, save with default values
      setExercisePerformanceData(prev => new Map(prev).set(currentExerciseIndex, {
        sets_completed: 1,
        reps_per_set: [exercise.reps || 10],
        total_time_seconds: exercise.duration_seconds || 30,
        rpe_reported: 3,
        technical_quality: 5,
        exercise: exercise
      }))
      
      setCompletedExercises(prev => new Set([...prev, currentExerciseIndex]))
      
      if (currentExerciseIndex < allExercises.length - 1) {
        const nextExercise = allExercises[currentExerciseIndex + 1]
        if (nextExercise.rest_seconds && nextExercise.rest_seconds > 0) {
          startRest(nextExercise.rest_seconds)
        }
        setCurrentExerciseIndex(prev => prev + 1)
      } else {
        setSessionCompleted(true)
      }
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

  const getAlternativeExercise = (exercise: any) => {
    // Simple alternative suggestions based on exercise type
    const alternatives = {
      'Standard Push-ups': 'Wall Push-ups (más fácil) o Knee Push-ups (modificado)',
      'Pull-ups': 'Towel Door Rows (sin barra) o Australian Pull-ups (más fácil)',
      'Bodyweight Squats': 'Chair Squats (con apoyo) o Wall Squats (asistido)',
      'Plank': 'Modified Plank (rodillas) o Standing Core Marches (de pie)',
      'Pistol Squats': 'Assisted Pistol Squats (con apoyo) o Bulgarian Split Squats'
    }
    
    return alternatives[exercise.name as keyof typeof alternatives] || 
           `Versión más fácil de ${exercise.name.toLowerCase()}`
  }

  const markExerciseAsStruggle = (reason: string) => {
    setExerciseStruggle(reason)
    setShowAlternative(true)
  }

  const useAlternativeExercise = () => {
    // In a real implementation, this would call the backend to get actual alternatives
    setShowAlternative(false)
    setExerciseStruggle(null)
    // For now, just mark as completed with a note
    completeExercise()
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
              <Button onClick={() => {
                // Calculate overall session metrics from individual exercise data
                const performanceDataArray = Array.from(exercisePerformanceData.values())
                const avgRpe = performanceDataArray.length > 0 
                  ? performanceDataArray.reduce((sum, data) => sum + data.rpe_reported, 0) / performanceDataArray.length 
                  : 7
                const avgTechnicalQuality = performanceDataArray.length > 0 
                  ? performanceDataArray.reduce((sum, data) => sum + data.technical_quality, 0) / performanceDataArray.length 
                  : 4
                
                // Convert performance data to the format expected by the API
                const exercisePerformance = performanceDataArray.map((data) => ({
                  sessionExerciseId: data.exercise.session_exercise_id || `temp_${data.exercise.id}`,
                  exerciseId: data.exercise.id,
                  setNumber: 1,
                  repsCompleted: data.exercise.is_circuit_format 
                    ? data.reps_per_circuit.reduce((sum: number, reps: number) => sum + reps, 0)
                    : data.reps_per_set.reduce((sum: number, reps: number) => sum + reps, 0),
                  rpeReported: data.exercise.is_circuit_format
                    ? data.rpe_per_circuit.reduce((sum: number, rpe: number) => sum + rpe, 0) / data.rpe_per_circuit.length
                    : data.rpe_reported,
                  techniqueQuality: data.exercise.is_circuit_format
                    ? data.technique_per_circuit.reduce((sum: number, tech: number) => sum + tech, 0) / data.technique_per_circuit.length
                    : data.technical_quality,
                  restTimeActual: data.exercise.rest_seconds || 60,
                  difficultyPerceived: data.exercise.is_circuit_format
                    ? data.rpe_per_circuit.reduce((sum: number, rpe: number) => sum + rpe, 0) / data.rpe_per_circuit.length
                    : data.rpe_reported,
                  // Circuit-specific data
                  circuitData: data.exercise.is_circuit_format ? {
                    reps_per_circuit: data.reps_per_circuit,
                    rpe_per_circuit: data.rpe_per_circuit,
                    technique_per_circuit: data.technique_per_circuit,
                    actual_rest_between_circuits: Array(data.reps_per_circuit.length).fill(data.exercise.rest_between_circuits || 90)
                  } : undefined
                }))
                
                onSessionComplete({
                  completion_rate: completedExercises.size / allExercises.length,
                  rpe_reported: avgRpe,
                  technical_quality: avgTechnicalQuality,
                  enjoyment_level: 4,
                  recovery_feeling: 4,
                  exercisePerformance: exercisePerformance
                })
              }}>
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
          {session.circuit_info ? (
            // Circuit format display
            <div className="space-y-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">Entrenamiento en Circuito</h3>
                </div>
                <p className="text-sm text-blue-700">
                  {session.circuit_info.exercises_per_circuit} ejercicios × {session.circuit_info.total_circuits} rondas
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {session.circuit_info.total_circuits}
                  </div>
                  <p className="text-sm text-muted-foreground">Circuitos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {session.circuit_info.exercises_per_circuit}
                  </div>
                  <p className="text-sm text-muted-foreground">Ejercicios</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {session.circuit_info.estimated_duration}min
                  </div>
                  <p className="text-sm text-muted-foreground">Duración</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {session.circuit_info.rest_between_circuits}s
                  </div>
                  <p className="text-sm text-muted-foreground">Descanso</p>
                </div>
              </div>
            </div>
          ) : (
            // Traditional format display
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
          )}
          
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

            {/* Exercise Details - Different display for different exercise types */}
            {currentExercise.type === 'main' && (
              <>
                {session.circuit_info ? (
                  // Circuit format display
                  <div className="space-y-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-900">
                          Ejercicio {currentExerciseIndex + 1 - session.warm_up.length} de {session.circuit_info.exercises_per_circuit}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Realizar {session.circuit_info.total_circuits} rondas del circuito completo
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          {currentExercise.reps || 10}
                        </div>
                        <p className="text-sm text-muted-foreground">Repeticiones</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {session.circuit_info.rest_between_exercises}s
                        </div>
                        <p className="text-sm text-muted-foreground">Descanso siguiente</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {session.circuit_info.rest_between_circuits}s
                        </div>
                        <p className="text-sm text-muted-foreground">Descanso circuito</p>
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground">
                      {currentExerciseIndex >= session.warm_up.length + session.exercise_blocks.length * Math.floor((currentExerciseIndex - session.warm_up.length) / session.exercise_blocks.length + 1)
                        ? 'Última ronda del circuito'
                        : `Ronda ${Math.floor((currentExerciseIndex - session.warm_up.length) / session.exercise_blocks.length) + 1} de ${session.circuit_info.total_circuits}`
                      }
                    </div>
                  </div>
                ) : (
                  // Traditional format display
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {currentExercise.sets || 3}
                      </div>
                      <p className="text-sm text-muted-foreground">Series</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {currentExercise.duration_seconds ?
                          `${currentExercise.duration_seconds}s` :
                          `${currentExercise.reps || 10} reps`
                        }
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {currentExercise.duration_seconds ? 'Duración' : 'Repeticiones'}
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {currentExercise.rest_seconds || 60}s
                      </div>
                      <p className="text-sm text-muted-foreground">Descanso</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Warm-up and Cool-down exercise details */}
            {(currentExercise.type === 'warmup' || currentExercise.type === 'cooldown') && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {currentExercise.duration_seconds ? 
                      `${currentExercise.duration_seconds}s` : 
                      `${currentExercise.reps || 10} reps`
                    }
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {currentExercise.duration_seconds ? 'Mantener' : 'Repeticiones'}
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentExercise.rest_seconds || 15}s
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

            {/* Alternative Exercise Suggestion */}
            {showAlternative && currentExercise.type === 'main' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">Ejercicio Alternativo Sugerido</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Motivo: {exerciseStruggle}
                </p>
                <p className="text-sm">
                  <strong>Alternativa:</strong> {getAlternativeExercise(currentExercise)}
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm"
                    onClick={useAlternativeExercise}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Usar Alternativa
                  </Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAlternative(false)}
                  >
                    Intentar Original
                  </Button>
                </div>
              </div>
            )}

            {/* Performance Input Form */}
            {showPerformanceInput && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Save className="h-5 w-5 text-blue-600" />
                    ¿Cómo fue tu rendimiento?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentExercise.is_circuit_format ? (
                    // Circuit format - performance per circuit
                    <div className="space-y-4">
                      <div>
                        <Label>Rendimiento por Circuito</Label>
                        <div className="space-y-3">
                          {currentPerformance.reps_per_circuit.map((reps, circuitIndex) => (
                            <div key={circuitIndex} className="p-3 border rounded-lg space-y-2">
                              <Label className="font-semibold">Circuito {circuitIndex + 1}</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <Label className="text-xs">Repeticiones</Label>
                                  <Input
                                    type="number"
                                    value={reps}
                                    onChange={(e) => {
                                      const newReps = [...currentPerformance.reps_per_circuit]
                                      newReps[circuitIndex] = parseInt(e.target.value) || 0
                                      setCurrentPerformance(prev => ({
                                        ...prev,
                                        reps_per_circuit: newReps
                                      }))
                                    }}
                                    placeholder={`${currentExercise.reps || 10}`}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">RPE</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={currentPerformance.rpe_per_circuit[circuitIndex]}
                                    onChange={(e) => {
                                      const newRpe = [...currentPerformance.rpe_per_circuit]
                                      newRpe[circuitIndex] = parseInt(e.target.value) || 5
                                      setCurrentPerformance(prev => ({
                                        ...prev,
                                        rpe_per_circuit: newRpe
                                      }))
                                    }}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Técnica</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={currentPerformance.technique_per_circuit[circuitIndex]}
                                    onChange={(e) => {
                                      const newTechnique = [...currentPerformance.technique_per_circuit]
                                      newTechnique[circuitIndex] = parseInt(e.target.value) || 4
                                      setCurrentPerformance(prev => ({
                                        ...prev,
                                        technique_per_circuit: newTechnique
                                      }))
                                    }}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : currentExercise.duration_seconds ? (
                    // Time-based exercise
                    <div>
                      <Label>Tiempo mantenido (segundos)</Label>
                      <Input
                        type="number"
                        value={currentPerformance.total_time_seconds}
                        onChange={(e) => setCurrentPerformance(prev => ({
                          ...prev,
                          total_time_seconds: parseInt(e.target.value) || 0
                        }))}
                        placeholder={`Objetivo: ${currentExercise.duration_seconds}s`}
                      />
                    </div>
                  ) : (session as any).circuit_info ? (
                    // Circuit format - Reps-based exercise
                    <div>
                      <Label>Repeticiones por ronda</Label>
                      <div className="space-y-2">
                        {currentPerformance.reps_per_set.map((reps, setIndex) => (
                          <div key={setIndex} className="flex items-center gap-2">
                            <Label className="w-16">Ronda {setIndex + 1}:</Label>
                            <Input
                              type="number"
                              value={reps}
                              onChange={(e) => {
                                const newReps = [...currentPerformance.reps_per_set]
                                newReps[setIndex] = parseInt(e.target.value) || 0
                                setCurrentPerformance(prev => ({
                                  ...prev,
                                  reps_per_set: newReps
                                }))
                              }}
                              placeholder={`Objetivo: ${currentExercise.reps}`}
                              className="w-20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    // Traditional format - Reps-based exercise
                    <div>
                      <Label>Repeticiones por serie</Label>
                      <div className="space-y-2">
                        {currentPerformance.reps_per_set.map((reps, setIndex) => (
                          <div key={setIndex} className="flex items-center gap-2">
                            <Label className="w-16">Serie {setIndex + 1}:</Label>
                            <Input
                              type="number"
                              value={reps}
                              onChange={(e) => {
                                const newReps = [...currentPerformance.reps_per_set]
                                newReps[setIndex] = parseInt(e.target.value) || 0
                                setCurrentPerformance(prev => ({
                                  ...prev,
                                  reps_per_set: newReps
                                }))
                              }}
                              placeholder={`Objetivo: ${currentExercise.reps}`}
                              className="w-20"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!currentExercise.is_circuit_format && (
                    <>
                      <div>
                        <Label>RPE (Esfuerzo Percibido 1-10)</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPerformance(prev => ({
                              ...prev,
                              rpe_reported: Math.max(1, prev.rpe_reported - 1)
                            }))}
                            disabled={currentPerformance.rpe_reported <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="w-12 text-center font-semibold">
                            {currentPerformance.rpe_reported}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPerformance(prev => ({
                              ...prev,
                              rpe_reported: Math.min(10, prev.rpe_reported + 1)
                            }))}
                            disabled={currentPerformance.rpe_reported >= 10}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Calidad Técnica (1-5)</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPerformance(prev => ({
                              ...prev,
                              technical_quality: Math.max(1, prev.technical_quality - 1)
                            }))}
                            disabled={currentPerformance.technical_quality <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="w-12 text-center font-semibold">
                            {currentPerformance.technical_quality}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPerformance(prev => ({
                              ...prev,
                              technical_quality: Math.min(5, prev.technical_quality + 1)
                            }))}
                            disabled={currentPerformance.technical_quality >= 5}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          1=Pobre, 2=Regular, 3=Buena, 4=Muy buena, 5=Perfecta
                        </p>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={saveExercisePerformance} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      Guardar y Continuar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowPerformanceInput(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2 justify-center">
              {currentExercise.type === 'main' ? (
                <>
                  <Button 
                    onClick={completeExercise}
                    className="flex items-center gap-2"
                    disabled={isResting || showPerformanceInput}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Completar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={skipExercise}
                    disabled={isResting || showPerformanceInput}
                  >
                    <SkipForward className="h-4 w-4" />
                    Saltar
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => markExerciseAsStruggle('Ejercicio muy difícil')}
                    disabled={isResting || showAlternative || showPerformanceInput}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Muy Difícil
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
          <CardTitle className="flex items-center gap-2">
            {(session as any).circuit_info ? (
              <>
                <RefreshCw className="h-5 w-5 text-blue-600" />
                Plan de Circuito
              </>
            ) : (
              'Lista de Ejercicios'
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(session as any).circuit_info ? (
            // Circuit format display
            <div className="space-y-4">
              {/* Warm-up */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">🔥 Calentamiento</h4>
                <div className="space-y-2">
                  {session.warm_up.map((exercise, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        index === currentExerciseIndex
                          ? 'border-primary bg-primary/5'
                          : completedExercises.has(index)
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {completedExercises.has(index) ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="text-sm">{exercise.exercise.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {exercise.reps} reps
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Circuit exercises */}
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2">
                  🔄 Circuito Principal ({(session as any).circuit_info.total_circuits} rondas)
                </h4>
                <div className="space-y-2">
                  {session.exercise_blocks.map((exercise, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        (currentExerciseIndex >= session.warm_up.length) &&
                        ((currentExerciseIndex - session.warm_up.length) % session.exercise_blocks.length === index)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-blue-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-700">
                            {index + 1}
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{exercise.exercise.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {exercise.exercise.category}
                            </Badge>
                            <span>{exercise.reps} reps por ronda</span>
                          </div>
                        </div>
                      </div>
                      {(currentExerciseIndex >= session.warm_up.length) &&
                       ((currentExerciseIndex - session.warm_up.length) % session.exercise_blocks.length === index) && (
                        <Badge className="bg-blue-600 text-white">
                          Actual
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cool-down */}
              <div>
                <h4 className="text-sm font-semibold text-purple-700 mb-2">❄️ Enfriamiento</h4>
                <div className="space-y-2">
                  {session.cool_down.map((exercise, index) => {
                    const cooldownIndex = session.warm_up.length + session.exercise_blocks.length * (session as any).circuit_info.total_circuits + index;
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-2 rounded-lg border ${
                          cooldownIndex === currentExerciseIndex
                            ? 'border-primary bg-primary/5'
                            : completedExercises.has(cooldownIndex)
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {completedExercises.has(cooldownIndex) ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <span className="text-sm">{exercise.exercise.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {exercise.duration_seconds}s
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            // Traditional format display
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`text-xs ${getExerciseTypeColor(exercise.type)}`}
                        >
                          {getExerciseTypeLabel(exercise.type)}
                        </Badge>
                        {exercise.type === 'main' && (
                          <span className="text-xs text-muted-foreground">
                            {exercise.duration_seconds ?
                              `${exercise.sets || 1}x${exercise.duration_seconds}s` :
                              `${exercise.sets || 1}x${exercise.reps || 10}`
                            }
                          </span>
                        )}
                        {(exercise.type === 'warmup' || exercise.type === 'cooldown') && (
                          <span className="text-xs text-muted-foreground">
                            {exercise.duration_seconds ?
                              `${exercise.duration_seconds}s` :
                              `${exercise.reps || 10} reps`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
