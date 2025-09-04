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
    // Basic info
    birth_date: '',
    weight: '',
    height: '',
    
    // Body composition (optional)
    body_fat_percentage: '',
    
    // Cardiovascular metrics (optional)
    resting_hr: '',
    training_hr_avg: '',
    
    // Sleep and recovery (optional)
    sleep_hours: '7.5',
    sleep_quality: '3',
    fatigue_level: '2',
    
    // Fitness background
    fitness_level: 'beginner',
    experience_years: '0',
    activity_level: 'moderate',
    
    // Training preferences
    available_days_per_week: '3',
    preferred_session_duration: '30',
    preferred_intensity: '0.7',
  })

  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  const { toast } = useToast()

  const totalSteps = 5 // Updated to accommodate biometric fields

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
        return formData.birth_date && formData.weight && formData.height
      case 2:
        return true // Body composition is optional
      case 3:
        return true // Cardiovascular metrics are optional
      case 4:
        return formData.fitness_level && formData.experience_years && formData.activity_level
      case 5:
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

      // Calculate age from birth_date
      const birthDate = new Date(formData.birth_date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)

      // Get BMI-based estimates for missing values
      const weight = parseFloat(formData.weight)
      const height = parseFloat(formData.height)
      const bmi = weight / Math.pow(height / 100, 2)
      
      // Estimate missing biometric values
      const estimatedBodyFat = formData.body_fat_percentage ? 
        parseFloat(formData.body_fat_percentage) : 
        Math.round((bmi < 18.5 ? 12 : bmi < 25 ? 18 : bmi < 30 ? 25 : 32) + (age - 25) * 0.2)
      
      const estimatedRestingHR = formData.resting_hr ? 
        parseInt(formData.resting_hr) : 
        Math.round(70 + (age - 30) * 0.5 + (bmi > 28 ? 10 : bmi < 22 ? -5 : 0))

      const profileData = {
        id: user.id,
        email: user.email,
        birth_date: formData.birth_date,
        age: age,
        weight: weight,
        height: height,
        body_fat_percentage: estimatedBodyFat,
        resting_hr: estimatedRestingHR,
        training_hr_avg: formData.training_hr_avg ? parseInt(formData.training_hr_avg) : null,
        sleep_hours: parseFloat(formData.sleep_hours),
        sleep_quality: parseInt(formData.sleep_quality),
        fatigue_level: parseInt(formData.fatigue_level),
        fitness_level: formData.fitness_level,
        experience_years: parseInt(formData.experience_years),
        activity_level: formData.activity_level,
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
              <h3 className="text-xl font-semibold text-gray-900">📋 Información Básica</h3>
              <p className="text-gray-600 mt-2">Datos esenciales para personalizar tu entrenamiento</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Fecha de Nacimiento *</label>
                <Input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => updateFormData('birth_date', e.target.value)}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Para calcular tu edad automáticamente</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Peso Actual (kg) *</label>
                <Input
                  type="number"
                  placeholder="70.5"
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  min="30"
                  max="200"
                  step="0.1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Tu peso más reciente</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Altura (cm) *</label>
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
                <p className="text-xs text-gray-500 mt-1">Para calcular tu IMC automáticamente</p>
              </div>
              
              {formData.weight && formData.height && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">IMC:</span> {
                      (parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)
                    } - {
                      (() => {
                        const bmi = parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2);
                        return bmi < 18.5 ? 'Bajo peso' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Sobrepeso' : 'Obesidad';
                      })()
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">🏋️ Composición Corporal</h3>
              <p className="text-gray-600 mt-2">Información opcional para mejor personalización</p>
              <p className="text-xs text-gray-500 mt-1">Si no conoces estos valores, los estimaremos automáticamente</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Porcentaje de Grasa Corporal (%)</label>
                <Input
                  type="number"
                  placeholder="Ej: 18 (opcional)"
                  value={formData.body_fat_percentage}
                  onChange={(e) => updateFormData('body_fat_percentage', e.target.value)}
                  min="5"
                  max="50"
                  step="0.1"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.weight && formData.height && !formData.body_fat_percentage ? (
                    <>Estimaremos aprox. {(() => {
                      const bmi = parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2);
                      const today = new Date();
                      const birthDate = formData.birth_date ? new Date(formData.birth_date) : today;
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return Math.round((bmi < 18.5 ? 12 : bmi < 25 ? 18 : bmi < 30 ? 25 : 32) + (age - 25) * 0.2);
                    })()}% basado en tu IMC y edad</>
                  ) : 'Si tienes medición de bioimpedancia o DEXA'}
                </p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <h4 className="font-medium text-gray-800 mb-2">💡 ¿Por qué es útil?</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• Ayuda a ajustar la dificultad de ejercicios corporales</li>
                  <li>• Permite seguimiento más preciso de tu progreso</li>
                  <li>• Mejora las recomendaciones nutricionales futuras</li>
                </ul>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  No te preocupes si no tienes esta información, 
                  <span className="font-medium text-blue-600"> nuestro algoritmo hará estimaciones precisas</span>
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">❤️ Métricas Cardiovasculares</h3>
              <p className="text-gray-600 mt-2">Información opcional para optimizar la intensidad</p>
              <p className="text-xs text-gray-500 mt-1">Nos ayuda a ajustar mejor tus zonas de entrenamiento</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Frecuencia Cardíaca en Reposo (bpm)</label>
                <Input
                  type="number"
                  placeholder="Ej: 65 (opcional)"
                  value={formData.resting_hr}
                  onChange={(e) => updateFormData('resting_hr', e.target.value)}
                  min="40"
                  max="120"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {!formData.resting_hr && formData.weight && formData.height && formData.birth_date ? (
                    <>Estimaremos aprox. {(() => {
                      const bmi = parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2);
                      const today = new Date();
                      const birthDate = new Date(formData.birth_date);
                      const age = today.getFullYear() - birthDate.getFullYear();
                      return Math.round(70 + (age - 30) * 0.5 + (bmi > 28 ? 10 : bmi < 22 ? -5 : 0));
                    })()} bpm basado en tu perfil</>
                  ) : 'Mídela al despertar, antes de levantarte'}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Frecuencia Cardíaca Promedio en Ejercicio (bpm)</label>
                <Input
                  type="number"
                  placeholder="Ej: 145 (opcional)"
                  value={formData.training_hr_avg}
                  onChange={(e) => updateFormData('training_hr_avg', e.target.value)}
                  min="80"
                  max="200"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Si usas monitor cardíaco durante ejercicio</p>
              </div>
              
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-gray-800 mb-2">💓 ¿Cómo obtener estos datos?</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• <strong>Reposo:</strong> Smartwatch, banda pectoral, o toma manual</li>
                  <li>• <strong>Ejercicio:</strong> Promedio de tus entrenamientos anteriores</li>
                  <li>• <strong>Apps:</strong> Apple Health, Google Fit, Fitbit, etc.</li>
                </ul>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">💪 Experiencia en Fitness</h3>
              <p className="text-gray-600 mt-2">Ayúdanos a ajustar el nivel de dificultad</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nivel de fitness actual *</label>
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
                <label className="text-sm font-medium text-gray-700">Años de experiencia *</label>
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
                <label className="text-sm font-medium text-gray-700">Nivel de Actividad Diaria *</label>
                <Select
                  value={formData.activity_level}
                  onValueChange={(value) => updateFormData('activity_level', value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Describe tu actividad diaria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">🪑 Sedentario - Trabajo de escritorio</SelectItem>
                    <SelectItem value="light">🚶 Ligero - Algo de caminar</SelectItem>
                    <SelectItem value="moderate">🏃 Moderado - Activo regularmente</SelectItem>
                    <SelectItem value="active">🏋️ Activo - Ejercicio frecuente</SelectItem>
                    <SelectItem value="very_active">⚡ Muy activo - Deportista/trabajo físico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">🎯 Preferencias de Entrenamiento</h3>
              <p className="text-gray-600 mt-2">Personaliza tu rutina perfecta</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Días disponibles por semana *</label>
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
              
              <div>
                <label className="text-sm font-medium text-gray-700">Duración preferida por sesión *</label>
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
                <label className="text-sm font-medium text-gray-700">Intensidad preferida *</label>
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
              
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-medium text-gray-800 mb-3">💤 Sueño y Recuperación</h4>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Horas de sueño promedio</label>
                    <Input
                      type="number"
                      placeholder="7.5"
                      value={formData.sleep_hours}
                      onChange={(e) => updateFormData('sleep_hours', e.target.value)}
                      min="4"
                      max="12"
                      step="0.5"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Calidad de sueño (1-5)</label>
                    <Select
                      value={formData.sleep_quality}
                      onValueChange={(value) => updateFormData('sleep_quality', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Cómo duermes?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muy mal (insomnio)</SelectItem>
                        <SelectItem value="2">2 - Mal (interrumpido)</SelectItem>
                        <SelectItem value="3">3 - Regular (promedio)</SelectItem>
                        <SelectItem value="4">4 - Bien (reparador)</SelectItem>
                        <SelectItem value="5">5 - Excelente (profundo)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nivel de fatiga actual (1-5)</label>
                    <Select
                      value={formData.fatigue_level}
                      onValueChange={(value) => updateFormData('fatigue_level', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="¿Cómo te sientes hoy?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Muy energético</SelectItem>
                        <SelectItem value="2">2 - Energético</SelectItem>
                        <SelectItem value="3">3 - Normal</SelectItem>
                        <SelectItem value="4">4 - Cansado</SelectItem>
                        <SelectItem value="5">5 - Muy cansado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">¡Casi listo! 🎉</h4>
              <p className="text-sm text-blue-700">
                Crearemos rutinas personalizadas basadas en tus preferencias y progreso.
                Podrás actualizar estos valores antes de cada entrenamiento.
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