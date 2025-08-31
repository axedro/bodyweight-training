'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useSession } from '@supabase/auth-helpers-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { useToast } from './ui/use-toast'
import { OnboardingData, FitnessLevel } from '@bodyweight/shared'

export function Onboarding() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    body_fat_percentage: undefined,
    fitness_level: 'beginner',
    experience_years: 0,
    available_days_per_week: 3,
    preferred_session_duration: 30,
    preferred_intensity: 0.7,
  })

  const session = useSession()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    if (!session?.user) return

    setLoading(true)

    try {
      // Crear perfil de usuario
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: session.user.id,
          email: session.user.email,
          ...formData,
        })

      if (error) throw error

      toast({
        title: "¡Perfil creado!",
        description: "Tu perfil ha sido configurado correctamente",
      })

      router.push('/dashboard')
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el perfil. Intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Edad</label>
              <Input
                type="number"
                placeholder="25"
                value={formData.age || ''}
                onChange={(e) => updateFormData('age', parseInt(e.target.value))}
                min="16"
                max="100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Peso (kg)</label>
              <Input
                type="number"
                placeholder="70"
                value={formData.weight || ''}
                onChange={(e) => updateFormData('weight', parseFloat(e.target.value))}
                min="30"
                max="200"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Altura (cm)</label>
              <Input
                type="number"
                placeholder="170"
                value={formData.height || ''}
                onChange={(e) => updateFormData('height', parseFloat(e.target.value))}
                min="120"
                max="250"
                step="0.1"
              />
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nivel de fitness</label>
              <Select
                value={formData.fitness_level}
                onValueChange={(value: FitnessLevel) => updateFormData('fitness_level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Principiante</SelectItem>
                  <SelectItem value="intermediate">Intermedio</SelectItem>
                  <SelectItem value="advanced">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Años de experiencia</label>
              <Input
                type="number"
                placeholder="0"
                value={formData.experience_years || ''}
                onChange={(e) => updateFormData('experience_years', parseInt(e.target.value))}
                min="0"
                max="50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Días disponibles por semana</label>
              <Select
                value={formData.available_days_per_week?.toString()}
                onValueChange={(value) => updateFormData('available_days_per_week', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona días" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 días</SelectItem>
                  <SelectItem value="3">3 días</SelectItem>
                  <SelectItem value="4">4 días</SelectItem>
                  <SelectItem value="5">5 días</SelectItem>
                  <SelectItem value="6">6 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Duración preferida de sesión (minutos)</label>
              <Select
                value={formData.preferred_session_duration?.toString()}
                onValueChange={(value) => updateFormData('preferred_session_duration', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona duración" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="45">45 minutos</SelectItem>
                  <SelectItem value="60">60 minutos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Intensidad preferida</label>
              <Select
                value={formData.preferred_intensity?.toString()}
                onValueChange={(value) => updateFormData('preferred_intensity', parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona intensidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">Baja (50%)</SelectItem>
                  <SelectItem value="0.7">Media (70%)</SelectItem>
                  <SelectItem value="0.8">Alta (80%)</SelectItem>
                  <SelectItem value="0.9">Muy alta (90%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Porcentaje de grasa corporal (opcional)</label>
              <Input
                type="number"
                placeholder="20"
                value={formData.body_fat_percentage || ''}
                onChange={(e) => updateFormData('body_fat_percentage', parseFloat(e.target.value))}
                min="5"
                max="50"
                step="0.1"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.age && formData.weight && formData.height
      case 2:
        return formData.fitness_level && formData.available_days_per_week !== undefined
      case 3:
        return formData.preferred_session_duration && formData.preferred_intensity !== undefined
      default:
        return false
    }
  }

  const getStepTitle = () => {
    switch (step) {
      case 1:
        return "Información básica"
      case 2:
        return "Experiencia y disponibilidad"
      case 3:
        return "Preferencias de entrenamiento"
      default:
        return ""
    }
  }

  const getStepDescription = () => {
    switch (step) {
      case 1:
        return "Necesitamos algunos datos básicos para personalizar tu entrenamiento"
      case 2:
        return "Cuéntanos sobre tu experiencia y cuánto tiempo puedes dedicar"
      case 3:
        return "Configura tus preferencias para el entrenamiento"
      default:
        return ""
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNumber <= step
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {stepNumber}
                </div>
              ))}
            </div>
          </div>
          <CardTitle>{getStepTitle()}</CardTitle>
          <CardDescription>{getStepDescription()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {renderStep()}
            
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                Anterior
              </Button>
              
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                >
                  {loading ? 'Creando perfil...' : 'Completar'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
