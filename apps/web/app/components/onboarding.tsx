'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from './ui/use-toast'
import { Progress } from './ui/progress'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface OnboardingProps {
  user: any
  onComplete: (profile: any) => void
}

export function Onboarding({ user, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    fitness_level: 'beginner',
    experience_years: '0',
    available_days_per_week: '3',
    preferred_session_duration: '30',
    preferred_intensity: '0.7',
  })

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  const { toast } = useToast()

  const totalSteps = 3

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.age && formData.weight && formData.height
      case 2:
        return formData.fitness_level && formData.experience_years
      case 3:
        return formData.available_days_per_week && formData.preferred_session_duration && formData.preferred_intensity
      default:
        return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      console.error('❌ No user ID available')
      return
    }

    setLoading(true)

    try {
      console.log('📝 Starting onboarding for user:', user.id)
      console.log('📝 Form data:', formData)

      const profileData = {
        id: user.id,
        email: user.email,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        fitness_level: formData.fitness_level,
        experience_years: parseInt(formData.experience_years),
        available_days_per_week: parseInt(formData.available_days_per_week),
        preferred_session_duration: parseInt(formData.preferred_session_duration),
        preferred_intensity: parseFloat(formData.preferred_intensity),
      }

      console.log('📝 Profile data to save:', profileData)

      // Update the profile (it should already exist from the trigger)
      const { data, error } = await supabase
        .from('user_profiles')
        .update(profileData)
        .eq('id', user.id)
        .select()
        .single()

      console.log('✅ Update result:', { data: !!data, error })

      if (error) {
        console.error('❌ Update failed:', error)
        throw error
      }

      toast({
        title: "¡Perfil completado!",
        description: "Tu perfil ha sido configurado correctamente",
      })

      console.log('🎉 Onboarding completed successfully')
      onComplete(data)

    } catch (error: any) {
      console.error('❌ Onboarding error:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudo completar el onboarding",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Información Básica</h3>
              <p className="text-gray-600 mt-2">Cuéntanos sobre ti para personalizar tu entrenamiento</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Edad</label>
                <Input
                  type="number"
                  placeholder="25"
                  value={formData.age}
                  onChange={(e) => updateFormData('age', e.target.value)}
                  min="16"
                  max="100"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Peso (kg)</label>
                <Input
                  type="number"
                  placeholder="70"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  min="30"
                  max="200"
                  step="0.1"
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Altura (cm)</label>
                <Input
                  type="number"
                  placeholder="170"
                  value={formData.height}
                  onChange={(e) => updateFormData('height', e.target.value)}
                  min="120"
                  max="250"
                  step="0.1"
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Experiencia en Fitness</h3>
              <p className="text-gray-600 mt-2">Ayúdanos a ajustar el nivel de dificultad</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nivel de fitness actual</label>
                <Select
                  value={formData.fitness_level}
                  onValueChange={(value) => updateFormData('fitness_level', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona tu nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">🌱 Principiante - Recién empiezo</SelectItem>
                    <SelectItem value="intermediate">💪 Intermedio - Tengo experiencia</SelectItem>
                    <SelectItem value="advanced">🔥 Avanzado - Muy experimentado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Años de experiencia</label>
                <Select
                  value={formData.experience_years}
                  onValueChange={(value) => updateFormData('experience_years', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecciona los años" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 años - Soy nuevo</SelectItem>
                    <SelectItem value="1">1 año - Algo de experiencia</SelectItem>
                    <SelectItem value="2">2 años - Experiencia moderada</SelectItem>
                    <SelectItem value="3">3+ años - Bastante experiencia</SelectItem>
                    <SelectItem value="5">5+ años - Muy experimentado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Días disponibles por semana</label>
                <Select
                  value={formData.available_days_per_week}
                  onValueChange={(value) => updateFormData('available_days_per_week', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="¿Cuántos días puedes entrenar?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 días - Poco tiempo</SelectItem>
                    <SelectItem value="3">3 días - Equilibrio perfecto</SelectItem>
                    <SelectItem value="4">4 días - Comprometido</SelectItem>
                    <SelectItem value="5">5 días - Muy dedicado</SelectItem>
                    <SelectItem value="6">6 días - Atlético</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Preferencias de Entrenamiento</h3>
              <p className="text-gray-600 mt-2">Personaliza tu rutina perfecta</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Duración preferida por sesión</label>
                <Select
                  value={formData.preferred_session_duration}
                  onValueChange={(value) => updateFormData('preferred_session_duration', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="¿Cuánto tiempo quieres entrenar?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">⚡ 20 minutos - Rápido y efectivo</SelectItem>
                    <SelectItem value="30">🎯 30 minutos - Equilibrado</SelectItem>
                    <SelectItem value="45">💪 45 minutos - Completo</SelectItem>
                    <SelectItem value="60">🔥 60 minutos - Intensivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Intensidad preferida</label>
                <Select
                  value={formData.preferred_intensity}
                  onValueChange={(value) => updateFormData('preferred_intensity', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="¿Qué tan intenso quieres que sea?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5">🟢 Suave (50%) - Relajado</SelectItem>
                    <SelectItem value="0.7">🟡 Moderado (70%) - Equilibrado</SelectItem>
                    <SelectItem value="0.8">🟠 Intenso (80%) - Desafiante</SelectItem>
                    <SelectItem value="0.9">🔴 Muy intenso (90%) - Máximo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">¡Casi listo! 🎉</h4>
              <p className="text-sm text-blue-700">
                Crearemos rutinas personalizadas basadas en tus preferencias y progreso.
              </p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            Configurar Perfil
            <span className="text-sm font-normal text-gray-500">({currentStep}/{totalSteps})</span>
          </CardTitle>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <Progress 
              value={(currentStep / totalSteps) * 100} 
              className="h-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={currentStep === totalSteps ? handleSubmit : (e) => { e.preventDefault(); nextStep(); }} className="space-y-6">
            {renderStepContent()}

            <div className="flex gap-3 pt-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
              )}
              
              <Button 
                type="submit"
                className="flex-1"
                disabled={!isStepValid(currentStep) || loading}
              >
                {currentStep === totalSteps ? (
                  loading ? 'Guardando...' : 'Completar Perfil'
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}