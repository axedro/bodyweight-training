'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Progress } from './ui/progress'
import {
  Star,
  Heart,
  Zap,
  Target,
  Smile,
  Frown,
  Meh
} from 'lucide-react'
import { SessionFeedbackCircuit } from './session-feedback-circuit'

interface SessionFeedbackProps {
  onFeedbackSubmit: (feedback: any) => void
  onSkip: () => void
  session?: any // Optional session data to detect circuit format
}

export function SessionFeedback({ onFeedbackSubmit, onSkip, session }: SessionFeedbackProps) {
  // Check if this is a circuit format session
  const isCircuitFormat = session && (session as any).circuit_info

  // If circuit format, use the specialized component
  if (isCircuitFormat) {
    const exercises = session.main_work || session.exercise_blocks || []
    const circuitInfo = (session as any).circuit_info

    return (
      <SessionFeedbackCircuit
        exercises={exercises}
        circuitInfo={circuitInfo}
        onFeedbackSubmit={onFeedbackSubmit}
        onSkip={onSkip}
      />
    )
  }

  // Traditional format feedback below
  const [currentStep, setCurrentStep] = useState(1)
  const [feedback, setFeedback] = useState({
    rpe_reported: 0,
    completion_rate: 0,
    technical_quality: 0,
    enjoyment_level: 0,
    recovery_feeling: 0
  })

  const totalSteps = 5

  const handleRatingChange = (field: string, value: number) => {
    setFeedback(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    } else {
      onFeedbackSubmit(feedback)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo te sentiste durante el entrenamiento?</h3>
              <p className="text-muted-foreground">
                Evalúa tu nivel de esfuerzo percibido (RPE) en una escala del 1 al 10
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <Button
                  key={value}
                  variant={feedback.rpe_reported === value ? "default" : "outline"}
                  className="h-12 text-lg font-bold"
                  onClick={() => handleRatingChange('rpe_reported', value)}
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

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Target className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Qué porcentaje completaste?</h3>
              <p className="text-muted-foreground">
                ¿Cuántos ejercicios pudiste completar de la rutina?
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((value) => (
                  <Button
                    key={value}
                    variant={feedback.completion_rate === value / 100 ? "default" : "outline"}
                    className="h-12"
                    onClick={() => handleRatingChange('completion_rate', value / 100)}
                  >
                    {value}%
                  </Button>
                ))}
              </div>
              
              <div className="text-center">
                <span className="text-2xl font-bold text-primary">
                  {Math.round((feedback.completion_rate || 0) * 100)}%
                </span>
                <p className="text-sm text-muted-foreground">completado</p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo fue tu técnica?</h3>
              <p className="text-muted-foreground">
                Evalúa la calidad técnica de tu ejecución
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((value) => (
                <div key={value} className="text-center">
                  <Button
                    variant={feedback.technical_quality === value ? "default" : "outline"}
                    className="h-16 w-16 rounded-full p-0"
                    onClick={() => handleRatingChange('technical_quality', value)}
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

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Heart className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Disfrutaste el entrenamiento?</h3>
              <p className="text-muted-foreground">
                ¿Qué tan agradable fue la sesión para ti?
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Button
                  variant={feedback.enjoyment_level === 1 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleRatingChange('enjoyment_level', 1)}
                >
                  <Frown className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">No me gustó</p>
              </div>
              <div className="text-center">
                <Button
                  variant={feedback.enjoyment_level === 3 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleRatingChange('enjoyment_level', 3)}
                >
                  <Meh className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">Neutral</p>
              </div>
              <div className="text-center">
                <Button
                  variant={feedback.enjoyment_level === 5 ? "default" : "outline"}
                  className="h-20 w-20 rounded-full p-0"
                  onClick={() => handleRatingChange('enjoyment_level', 5)}
                >
                  <Smile className="h-8 w-8" />
                </Button>
                <p className="text-sm mt-2">Me encantó</p>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Zap className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">¿Cómo te sientes ahora?</h3>
              <p className="text-muted-foreground">
                Evalúa tu sensación de recuperación y energía
              </p>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  variant={feedback.recovery_feeling === value ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleRatingChange('recovery_feeling', value)}
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Feedback de la Sesión</CardTitle>
        <div className="flex items-center gap-2">
          <Progress value={(currentStep / totalSteps) * 100} className="flex-1" />
          <span className="text-sm text-muted-foreground">
            {currentStep}/{totalSteps}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStep()}
        
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
              disabled={
                (currentStep === 1 && feedback.rpe_reported === 0) ||
                (currentStep === 2 && feedback.completion_rate === 0) ||
                (currentStep === 3 && feedback.technical_quality === 0) ||
                (currentStep === 4 && feedback.enjoyment_level === 0) ||
                (currentStep === 5 && feedback.recovery_feeling === 0)
              }
            >
              {currentStep === totalSteps ? 'Finalizar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
