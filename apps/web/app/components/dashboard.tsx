'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@supabase/auth-helpers-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useToast } from './ui/use-toast'
import { UserProfile, TrainingPlan } from '@bodyweight/shared'
import { CurrentSession } from './current-session'
import { TrainingHistory } from './training-history'
import { ProgressCharts } from './progress-charts'
import { WellnessLog } from './wellness-log'

export function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const session = useSession()
  const supabase = createClientComponentClient()
  const { toast } = useToast()

  useEffect(() => {
    if (session?.user) {
      loadUserData()
    }
  }, [session])

  const loadUserData = async () => {
    if (!session?.user) return

    try {
      // Cargar perfil de usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw profileError

      setUserProfile(profile)

      // Generar plan de entrenamiento
      await generateTrainingPlan(profile)

    } catch (error) {
      console.error('Error loading user data:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar los datos del usuario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateTrainingPlan = async (profile: UserProfile) => {
    try {
      // Aquí se llamaría al algoritmo adaptativo
      // Por ahora, creamos un plan básico
      const mockPlan: TrainingPlan = {
        current_session: {
          warm_up: [],
          main_work: [],
          cool_down: [],
          total_volume_load: 0,
          estimated_duration: 30,
          intensity_target: 0.7,
          recovery_requirement: 24,
        },
        next_sessions: [],
        ica_score: 5.0,
        recommendations: [
          "Mantén una buena hidratación",
          "Descansa lo suficiente entre sesiones",
          "Enfócate en la forma técnica"
        ]
      }

      setTrainingPlan(mockPlan)
    } catch (error) {
      console.error('Error generating training plan:', error)
    }
  }

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando tu entrenamiento...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              No se pudo cargar tu perfil. Por favor, recarga la página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Recargar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold">Bodyweight Training</h1>
            <div className="text-sm text-muted-foreground">
              Hola, {userProfile.email}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              ICA: {trainingPlan?.ica_score?.toFixed(1) || 'N/A'}
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="current">Sesión Actual</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="progress">Progreso</TabsTrigger>
            <TabsTrigger value="wellness">Bienestar</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-6">
            <CurrentSession 
              userProfile={userProfile}
              trainingPlan={trainingPlan}
              onSessionComplete={loadUserData}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <TrainingHistory userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <ProgressCharts userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6">
            <WellnessLog userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
