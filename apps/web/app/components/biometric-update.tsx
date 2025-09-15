'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { useToast } from './ui/use-toast'
import { Scale, Heart, Moon, Zap, TrendingUp, CheckCircle2, X } from 'lucide-react'
import { routineService } from '../../lib/routine-service'

interface BiometricData {
  weight?: number
  body_fat_percentage?: number
  resting_hr?: number
  training_hr_avg?: number
  sleep_hours?: number
  sleep_quality?: number
  fatigue_level?: number
  last_updated?: string
}

interface BiometricUpdateProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: BiometricData) => void
  currentData?: BiometricData
}

export function BiometricUpdate({ 
  isOpen, 
  onClose, 
  onUpdate, 
  currentData 
}: BiometricUpdateProps) {
  // Ensure currentData is never null or undefined
  const safeCurrentData = currentData || {}
  
  const [formData, setFormData] = useState({
    weight: safeCurrentData.weight?.toString() || '',
    body_fat_percentage: safeCurrentData.body_fat_percentage?.toString() || '',
    resting_hr: safeCurrentData.resting_hr?.toString() || '',
    training_hr_avg: safeCurrentData.training_hr_avg?.toString() || '',
    sleep_hours: safeCurrentData.sleep_hours?.toString() || '7.5',
    sleep_quality: safeCurrentData.sleep_quality?.toString() || '3',
    fatigue_level: safeCurrentData.fatigue_level?.toString() || '2',
  })
  
  const [loading, setLoading] = useState(false)
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Track which fields have been changed
    const currentValue = safeCurrentData[field as keyof BiometricData]?.toString() || ''
    if (value !== currentValue) {
      setChangedFields(prev => new Set([...prev, field]))
    } else {
      setChangedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare biometric data with only changed fields
      const updatedData: any = {
        data_source: 'pre_routine'
      }
      
      if (changedFields.has('weight') && formData.weight) {
        updatedData.weight = parseFloat(formData.weight)
      }
      if (changedFields.has('body_fat_percentage') && formData.body_fat_percentage) {
        updatedData.body_fat_percentage = parseFloat(formData.body_fat_percentage)
      }
      if (changedFields.has('resting_hr') && formData.resting_hr) {
        updatedData.resting_hr = parseInt(formData.resting_hr)
      }
      if (changedFields.has('training_hr_avg') && formData.training_hr_avg) {
        updatedData.training_hr_avg = parseInt(formData.training_hr_avg)
      }
      if (changedFields.has('sleep_hours')) {
        updatedData.sleep_hours = parseFloat(formData.sleep_hours)
      }
      if (changedFields.has('sleep_quality')) {
        updatedData.sleep_quality = parseInt(formData.sleep_quality)
      }
      if (changedFields.has('fatigue_level')) {
        updatedData.fatigue_level = parseInt(formData.fatigue_level)
      }

      // If there are changes, call the Edge Function
      if (Object.keys(updatedData).length > 1) { // More than just data_source
        const result = await routineService.updateBiometrics(updatedData)

        toast({
          title: "✅ Datos actualizados",
          description: `${changedFields.size} métrica${changedFields.size > 1 ? 's' : ''} actualizada${changedFields.size > 1 ? 's' : ''}`,
        })

        onUpdate(result.biometric_snapshot)
      } else {
        toast({
          title: "Sin cambios",
          description: "No se detectaron cambios en los datos",
        })
        onUpdate({})
      }

      onClose()
    } catch (error: any) {
      console.error('Error updating biometrics:', error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const skipUpdate = () => {
    toast({
      title: "Datos mantenidos",
      description: "Usando los datos biométricos actuales",
    })
    onUpdate({})
    onClose()
  }

  const getDaysAgo = () => {
    if (!safeCurrentData.last_updated) return 'Nunca actualizado'
    const days = Math.floor((Date.now() - new Date(safeCurrentData.last_updated).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Actualizado hoy'
    if (days === 1) return 'Ayer'
    return `Hace ${days} días`
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Actualizar Datos Biométricos
          </DialogTitle>
          <DialogDescription>
            ¿Ha habido cambios desde tu última actualización? ({getDaysAgo()})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Physical Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Métricas Físicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Peso (kg)
                  {changedFields.has('weight') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder={safeCurrentData.weight?.toString() || "70.0"}
                  value={formData.weight}
                  onChange={(e) => updateFormData('weight', e.target.value)}
                  min="30"
                  max="200"
                  step="0.1"
                  className="h-8"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Grasa Corporal (%)
                  {changedFields.has('body_fat_percentage') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder={safeCurrentData.body_fat_percentage?.toString() || "18.0"}
                  value={formData.body_fat_percentage}
                  onChange={(e) => updateFormData('body_fat_percentage', e.target.value)}
                  min="5"
                  max="50"
                  step="0.1"
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cardiovascular Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                Métricas Cardiovasculares
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  FC Reposo (bpm)
                  {changedFields.has('resting_hr') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder={safeCurrentData.resting_hr?.toString() || "65"}
                  value={formData.resting_hr}
                  onChange={(e) => updateFormData('resting_hr', e.target.value)}
                  min="40"
                  max="120"
                  className="h-8"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  FC Ejercicio (bpm)
                  {changedFields.has('training_hr_avg') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Input
                  type="number"
                  placeholder={safeCurrentData.training_hr_avg?.toString() || "145"}
                  value={formData.training_hr_avg}
                  onChange={(e) => updateFormData('training_hr_avg', e.target.value)}
                  min="80"
                  max="200"
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>

          {/* Recovery Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-500" />
                Sueño y Recuperación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Horas de Sueño
                  {changedFields.has('sleep_hours') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Input
                  type="number"
                  value={formData.sleep_hours}
                  onChange={(e) => updateFormData('sleep_hours', e.target.value)}
                  min="4"
                  max="12"
                  step="0.5"
                  className="h-8"
                />
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Calidad Sueño (1-5)
                  {changedFields.has('sleep_quality') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Select
                  value={formData.sleep_quality}
                  onValueChange={(value) => updateFormData('sleep_quality', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Muy mal</SelectItem>
                    <SelectItem value="2">2 - Mal</SelectItem>
                    <SelectItem value="3">3 - Regular</SelectItem>
                    <SelectItem value="4">4 - Bien</SelectItem>
                    <SelectItem value="5">5 - Excelente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Nivel de Fatiga (1-5)
                  {changedFields.has('fatigue_level') && (
                    <span className="text-blue-600 ml-1">• Modificado</span>
                  )}
                </label>
                <Select
                  value={formData.fatigue_level}
                  onValueChange={(value) => updateFormData('fatigue_level', value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={skipUpdate}
              className="flex-1"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Mantener Actual
            </Button>
            
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || changedFields.size === 0}
            >
              {loading ? (
                'Guardando...'
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {changedFields.size > 0 ? `Actualizar (${changedFields.size})` : 'Sin Cambios'}
                </>
              )}
            </Button>
          </div>

          {changedFields.size > 0 && (
            <div className="text-xs text-blue-600 text-center">
              💡 Solo se guardarán los campos modificados
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}