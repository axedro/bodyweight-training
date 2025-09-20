'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import { Badge } from './ui/badge'
import {
  Star,
  Heart,
  Zap,
  Target,
  Smile,
  Frown,
  Meh,
  RefreshCw,
  Timer,
  TrendingUp
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  reps?: number
  duration_seconds?: number
}

interface CircuitData {
  exercises_per_circuit: number
  total_circuits: number
  rest_between_exercises: number
  rest_between_circuits: number
}

interface SessionFeedbackCircuitProps {
  exercises: Exercise[]
  circuitInfo: CircuitData
  onFeedbackSubmit: (feedback: any) => void
  onSkip: () => void
}

interface ExerciseFeedback {
  reps_per_circuit: number[]
  rpe_per_circuit: number[]
  technique_per_circuit: number[]
}

export function SessionFeedbackCircuit({
  exercises,
  circuitInfo,
  onFeedbackSubmit,
  onSkip
}: SessionFeedbackCircuitProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentCircuitIndex, setCurrentCircuitIndex] = useState(0)

  const [globalFeedback, setGlobalFeedback] = useState({
    rpe_reported: 0,
    completion_rate: 0,
    technical_quality: 0,
    enjoyment_level: 0,
    recovery_feeling: 0,
    actual_duration: 0
  })

  // Initialize exercise feedback for each exercise
  const [exerciseFeedback, setExerciseFeedback] = useState<{[key: string]: ExerciseFeedback}>(() => {
    const feedback: {[key: string]: ExerciseFeedback} = {}
    exercises.forEach(exercise => {
      feedback[exercise.id] = {
        reps_per_circuit: new Array(circuitInfo.total_circuits).fill(0),
        rpe_per_circuit: new Array(circuitInfo.total_circuits).fill(0),
        technique_per_circuit: new Array(circuitInfo.total_circuits).fill(0)
      }
    })
    return feedback
  })

  // 7 steps total: circuit details (per exercise per round) + 5 global feedback steps
  const totalSteps = (exercises.length * circuitInfo.total_circuits * 3) + 5

  const handleGlobalRatingChange = (field: string, value: number) => {
    setGlobalFeedback(prev => ({ ...prev, [field]: value }))
  }

  const handleExerciseRating = (exerciseId: string, circuitIndex: number, field: keyof ExerciseFeedback, value: number) => {
    setExerciseFeedback(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: prev[exerciseId][field].map((val, idx) =>
          idx === circuitIndex ? value : val
        )
      }
    }))
  }

  const nextStep = () => {
    const exerciseSteps = exercises.length * circuitInfo.total_circuits * 3

    if (currentStep <= exerciseSteps) {
      // We're in exercise feedback steps
      setCurrentStep(prev => prev + 1)

      // Update indices for tracking current exercise/circuit
      const totalExerciseRounds = exerciseSteps / 3
      const currentRound = Math.floor((currentStep - 1) / 3)

      if (currentStep % 3 === 0) {
        // Moving to next circuit round
        if (currentExerciseIndex < exercises.length - 1) {
          setCurrentExerciseIndex(prev => prev + 1)
        } else {
          setCurrentExerciseIndex(0)
          setCurrentCircuitIndex(prev => prev + 1)
        }
      }
    } else if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      // Submit all feedback
      const exercisePerformance = exercises.map(exercise => ({
        exerciseId: exercise.id,
        sessionExerciseId: exercise.id, // This should come from session data
        setNumber: 1,
        repsCompleted: exerciseFeedback[exercise.id].reps_per_circuit.reduce((a, b) => a + b, 0),
        rpeReported: Math.round(exerciseFeedback[exercise.id].rpe_per_circuit.reduce((a, b) => a + b, 0) / circuitInfo.total_circuits),
        techniqueQuality: Math.round(exerciseFeedback[exercise.id].technique_per_circuit.reduce((a, b) => a + b, 0) / circuitInfo.total_circuits),
        circuitData: {
          reps_per_circuit: exerciseFeedback[exercise.id].reps_per_circuit,
          rpe_per_circuit: exerciseFeedback[exercise.id].rpe_per_circuit,
          technique_per_circuit: exerciseFeedback[exercise.id].technique_per_circuit,
          actual_rest_between_circuits: [] // Could be captured separately
        }
      }))

      onFeedbackSubmit({
        ...globalFeedback,
        exercisePerformance
      })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)

      // Update indices when going back
      if (currentStep <= exercises.length * circuitInfo.total_circuits * 3) {
        if (currentStep % 3 === 1) {
          // Moving to previous circuit round
          if (currentExerciseIndex > 0) {
            setCurrentExerciseIndex(prev => prev - 1)
          } else if (currentCircuitIndex > 0) {
            setCurrentExerciseIndex(exercises.length - 1)
            setCurrentCircuitIndex(prev => prev - 1)
          }
        }
      }
    }
  }

  const renderExerciseStep = () => {
    const exerciseSteps = exercises.length * circuitInfo.total_circuits * 3
    if (currentStep > exerciseSteps) return null

    const stepInCycle = ((currentStep - 1) % 3) + 1
    const currentExercise = exercises[currentExerciseIndex]
    const circuitNumber = currentCircuitIndex + 1

    switch (stepInCycle) {
      case 1: // Reps completed
        return (
          <div className="space-y-6">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {currentExercise.name} - Ronda {circuitNumber}
              </h3>
              <p className="text-muted-foreground">
                ¿Cuántas repeticiones completaste en esta ronda?
              </p>
              {currentExercise.reps && (
                <Badge variant="outline" className="mt-2">
                  Objetivo: {currentExercise.reps} reps
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {Array.from({length: Math.max(15, currentExercise.reps || 10)}, (_, i) => i + 1).map((value) => (
                <Button
                  key={value}
                  variant={exerciseFeedback[currentExercise.id].reps_per_circuit[currentCircuitIndex] === value ? "default" : "outline"}
                  className="h-10 text-sm"
                  onClick={() => handleExerciseRating(currentExercise.id, currentCircuitIndex, 'reps_per_circuit', value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        )

      case 2: // RPE for this exercise in this circuit
        return (
          <div className="space-y-6">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {currentExercise.name} - Ronda {circuitNumber}
              </h3>
              <p className="text-muted-foreground">
                ¿Qué tan difícil fue este ejercicio en esta ronda?
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  variant={exerciseFeedback[currentExercise.id].rpe_per_circuit[currentCircuitIndex] === value ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  onClick={() => handleExerciseRating(currentExercise.id, currentCircuitIndex, 'rpe_per_circuit', value)}
                >
                  {value}
                </Button>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>1 = Muy fácil | 5 = Moderado | 10 = Extremadamente difícil</p>
            </div>
          </div>
        )

      case 3: // Technique quality for this exercise in this circuit
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                {currentExercise.name} - Ronda {circuitNumber}
              </h3>
              <p className="text-muted-foreground">
                ¿Cómo fue tu técnica en esta ronda?
              </p>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="text-center">
                  <Button
                    variant={exerciseFeedback[currentExercise.id].technique_per_circuit[currentCircuitIndex] === value ? "default" : "outline"}
                    className="h-16 w-16 rounded-full p-0"
                    onClick={() => handleExerciseRating(currentExercise.id, currentCircuitIndex, 'technique_per_circuit', value)}
                  >
                    <Star className="h-6 w-6" />
                  </Button>
                  <p className="text-xs mt-2">{value}</p>
                </div>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>1 = Muy mala | 3 = Regular | 5 = Excelente</p>
            </div>
          </div>
        )
    }
  }

  const renderGlobalStep = () => {
    const exerciseSteps = exercises.length * circuitInfo.total_circuits * 3
    const globalStep = currentStep - exerciseSteps

    switch (globalStep) {
      case 1: // Overall RPE
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo te sentiste en general?</h3>
              <p className="text-muted-foreground">
                Evalúa tu nivel de esfuerzo general durante toda la sesión
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  variant={globalFeedback.rpe_reported === value ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  onClick={() => handleGlobalRatingChange('rpe_reported', value)}
                >
                  {value}
                </Button>
              ))}
            </div>
          </div>
        )

      case 2: // Completion rate
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Completaste toda la rutina?</h3>
              <p className="text-muted-foreground">
                ¿Cuántos circuitos completaste del total planificado?
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[25, 50, 75, 100].map((value) => (
                <Button
                  key={value}
                  variant={globalFeedback.completion_rate === value / 100 ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleGlobalRatingChange('completion_rate', value / 100)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
        )

      case 3: // Technical quality overall
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo fue tu técnica en general?</h3>
              <p className="text-muted-foreground">
                Evalúa la calidad técnica promedio de toda la sesión
              </p>
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="text-center">
                  <Button
                    variant={globalFeedback.technical_quality === value ? "default" : "outline"}
                    className="h-16 w-16 rounded-full p-0"
                    onClick={() => handleGlobalRatingChange('technical_quality', value)}
                  >
                    <Star className="h-6 w-6" />
                  </Button>
                  <p className="text-xs mt-2">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case 4: // Enjoyment
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Disfrutaste el entrenamiento?</h3>
              <p className="text-muted-foreground">
                ¿Qué tan agradable fue el formato circuito para ti?
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Button
                  variant={globalFeedback.enjoyment_level === 1 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleGlobalRatingChange('enjoyment_level', 1)}
                >
                  <Frown className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">No me gustó</p>
              </div>
              <div className="text-center">
                <Button
                  variant={globalFeedback.enjoyment_level === 3 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleGlobalRatingChange('enjoyment_level', 3)}
                >
                  <Meh className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">Neutral</p>
              </div>
              <div className="text-center">
                <Button
                  variant={globalFeedback.enjoyment_level === 5 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleGlobalRatingChange('enjoyment_level', 5)}
                >
                  <Smile className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">Me encantó</p>
              </div>
            </div>
          </div>
        )

      case 5: // Recovery feeling
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo te sientes ahora?</h3>
              <p className="text-muted-foreground">
                Evalúa tu sensación de recuperación después del circuito
              </p>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={globalFeedback.recovery_feeling === value ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleGlobalRatingChange('recovery_feeling', value)}
                >
                  {value}
                </Button>
              ))}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>1 = Agotado | 3 = Normal | 5 = Lleno de energía</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const isStepComplete = () => {
    const exerciseSteps = exercises.length * circuitInfo.total_circuits * 3

    if (currentStep <= exerciseSteps) {
      // Exercise feedback step
      const stepInCycle = ((currentStep - 1) % 3) + 1
      const currentExercise = exercises[currentExerciseIndex]

      switch (stepInCycle) {
        case 1:
          return exerciseFeedback[currentExercise.id].reps_per_circuit[currentCircuitIndex] > 0
        case 2:
          return exerciseFeedback[currentExercise.id].rpe_per_circuit[currentCircuitIndex] > 0
        case 3:
          return exerciseFeedback[currentExercise.id].technique_per_circuit[currentCircuitIndex] > 0
        default:
          return false
      }
    } else {
      // Global feedback step
      const globalStep = currentStep - exerciseSteps
      switch (globalStep) {
        case 1:
          return globalFeedback.rpe_reported > 0
        case 2:
          return globalFeedback.completion_rate > 0
        case 3:
          return globalFeedback.technical_quality > 0
        case 4:
          return globalFeedback.enjoyment_level > 0
        case 5:
          return globalFeedback.recovery_feeling > 0
        default:
          return false
      }
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Feedback del Circuito</CardTitle>
        <div className="flex items-center gap-2">
          <Progress value={(currentStep / totalSteps) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {currentStep}/{totalSteps}
          </span>
        </div>

        {/* Circuit info display */}
        <div className="text-center text-sm text-muted-foreground">
          <Badge variant="outline" className="mb-2">
            {circuitInfo.exercises_per_circuit} ejercicios × {circuitInfo.total_circuits} rondas
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep <= exercises.length * circuitInfo.total_circuits * 3
          ? renderExerciseStep()
          : renderGlobalStep()
        }

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Anterior
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onSkip}
            >
              Saltar
            </Button>

            <Button
              onClick={nextStep}
              disabled={!isStepComplete()}
            >
              {currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}