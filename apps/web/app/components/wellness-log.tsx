'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { UserProfile, WellnessLog } from '@bodyweight/shared'
import { Heart, Moon, Coffee, Droplets, Smile } from 'lucide-react'
import { useToast } from './ui/use-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface WellnessLogProps {
  userProfile: UserProfile
}

export function WellnessLog({ userProfile }: WellnessLogProps) {
  const [todayLog, setTodayLog] = useState<Partial<WellnessLog>>({
    sleep_hours: undefined,
    sleep_quality: undefined,
    fatigue_level: undefined,
    stress_level: undefined,
    hydration_level: undefined,
    mood_level: undefined,
  })
  const [recentLogs, setRecentLogs] = useState<WellnessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    loadWellnessData()
  }, [userProfile.id])

  const loadWellnessData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      // Cargar log de hoy
      const { data: todayData } = await supabase
        .from('wellness_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('log_date', today)
        .single()

      if (todayData) {
        setTodayLog(todayData)
      }

      // Cargar logs recientes
      const { data: recentData } = await supabase
        .from('wellness_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('log_date', { ascending: false })
        .limit(7)

      setRecentLogs(recentData || [])
    } catch (error) {
      console.error('Error loading wellness data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLog = async () => {
    if (!userProfile.id) return

    setSaving(true)
    try {
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const { error } = await supabase
        .from('wellness_logs')
        .upsert({
          user_id: userProfile.id,
          log_date: today,
          ...todayLog,
        })

      if (error) throw error

      toast({
        title: "¡Guardado!",
        description: "Tu registro de bienestar ha sido guardado",
      })

      await loadWellnessData()
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el registro",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateLog = (field: keyof WellnessLog, value: any) => {
    setTodayLog(prev => ({ ...prev, [field]: value }))
  }

  const getMoodIcon = (level?: number) => {
    if (!level) return <Smile className="h-5 w-5 text-muted-foreground" />
    if (level >= 4) return <Smile className="h-5 w-5 text-green-500" />
    if (level >= 3) return <Smile className="h-5 w-5 text-yellow-500" />
    return <Smile className="h-5 w-5 text-red-500" />
  }

  const getQualityColor = (level?: number) => {
    if (!level) return 'text-muted-foreground'
    if (level >= 4) return 'text-green-600'
    if (level >= 3) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registro de Bienestar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando datos de bienestar...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Today's Log */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Hoy</CardTitle>
          <CardDescription>
            {format(new Date(), 'EEEE, d MMMM yyyy', { locale: es })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sleep */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4" />
                Horas de sueño
              </label>
              <Input
                type="number"
                placeholder="7.5"
                value={todayLog.sleep_hours || ''}
                onChange={(e) => updateLog('sleep_hours', parseFloat(e.target.value))}
                min="0"
                max="24"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4" />
                Calidad del sueño
              </label>
              <Select
                value={todayLog.sleep_quality?.toString()}
                onValueChange={(value) => updateLog('sleep_quality', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona calidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy mala</SelectItem>
                  <SelectItem value="2">Mala</SelectItem>
                  <SelectItem value="3">Regular</SelectItem>
                  <SelectItem value="4">Buena</SelectItem>
                  <SelectItem value="5">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Energy and Stress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Coffee className="h-4 w-4" />
                Nivel de fatiga
              </label>
              <Select
                value={todayLog.fatigue_level?.toString()}
                onValueChange={(value) => updateLog('fatigue_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy bajo</SelectItem>
                  <SelectItem value="2">Bajo</SelectItem>
                  <SelectItem value="3">Moderado</SelectItem>
                  <SelectItem value="4">Alto</SelectItem>
                  <SelectItem value="5">Muy alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4" />
                Nivel de estrés
              </label>
              <Select
                value={todayLog.stress_level?.toString()}
                onValueChange={(value) => updateLog('stress_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy bajo</SelectItem>
                  <SelectItem value="2">Bajo</SelectItem>
                  <SelectItem value="3">Moderado</SelectItem>
                  <SelectItem value="4">Alto</SelectItem>
                  <SelectItem value="5">Muy alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hydration and Mood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4" />
                Hidratación
              </label>
              <Select
                value={todayLog.hydration_level?.toString()}
                onValueChange={(value) => updateLog('hydration_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy baja</SelectItem>
                  <SelectItem value="2">Baja</SelectItem>
                  <SelectItem value="3">Moderada</SelectItem>
                  <SelectItem value="4">Buena</SelectItem>
                  <SelectItem value="5">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                {getMoodIcon(todayLog.mood_level)}
                Estado de ánimo
              </label>
              <Select
                value={todayLog.mood_level?.toString()}
                onValueChange={(value) => updateLog('mood_level', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Muy malo</SelectItem>
                  <SelectItem value="2">Malo</SelectItem>
                  <SelectItem value="3">Regular</SelectItem>
                  <SelectItem value="4">Bueno</SelectItem>
                  <SelectItem value="5">Excelente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSaveLog} disabled={saving} className="w-full">
            {saving ? 'Guardando...' : 'Guardar Registro'}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registros Recientes</CardTitle>
          <CardDescription>
            Últimos 7 días de bienestar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay registros recientes</h3>
              <p className="text-muted-foreground">
                Comienza a registrar tu bienestar diario para ver tu progreso aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(log.log_date), 'EEEE, d MMM', { locale: es })}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {log.sleep_hours && (
                        <div className="flex items-center gap-1">
                          <Moon className="h-4 w-4" />
                          {log.sleep_hours}h
                        </div>
                      )}
                      {log.sleep_quality && (
                        <div className={`flex items-center gap-1 ${getQualityColor(log.sleep_quality)}`}>
                          <Heart className="h-4 w-4" />
                          {log.sleep_quality}/5
                        </div>
                      )}
                      {log.mood_level && (
                        <div className="flex items-center gap-1">
                          {getMoodIcon(log.mood_level)}
                          {log.mood_level}/5
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
