'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Auth } from './components/auth'
import { Onboarding } from './components/onboarding'
import { Dashboard } from './components/dashboard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export default function HomePage() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const { data: { session: userSession } } = await supabase.auth.getSession()
      setSession(userSession)
      
      if (userSession?.user) {
        await checkOnboardingStatus(userSession.user.id)
      }
    } catch (error) {
      console.error('Error loading session:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkOnboardingStatus = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile && profile.age) {
        setOnboardingComplete(true)
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bodyweight Training
            </h1>
            <p className="text-gray-600">
              Entrenamiento adaptativo de fuerza sin pesas
            </p>
          </div>
          <Auth />
        </div>
      </div>
    )
  }

  if (!onboardingComplete) {
    return <Onboarding session={session} />
  }

  return (
    <div className="min-h-screen bg-background">
      <Dashboard />
    </div>
  )
}
