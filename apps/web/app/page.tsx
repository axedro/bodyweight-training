'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Auth } from './components/auth'
import { Onboarding } from './components/onboarding'
import { Dashboard } from './components/dashboard'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type AppState = 'loading' | 'auth' | 'onboarding' | 'dashboard'

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>('loading')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      console.log('🚀 Initializing authentication...')
      
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log('📋 Session check:', { session: !!session, error })
      
      if (error) {
        console.error('❌ Auth error:', error)
        setAppState('auth')
        return
      }

      if (!session) {
        console.log('👤 No session found, showing auth')
        setAppState('auth')
        return
      }

      // User is logged in, check profile
      setUser(session.user)
      await checkUserProfile(session.user.id)

    } catch (error) {
      console.error('❌ Initialize error:', error)
      setAppState('auth')
    }
  }

  const checkUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Checking user profile for:', userId)
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('👤 Profile result:', { profile: !!profile, error })

      if (error || !profile) {
        console.log('❌ No profile found, showing auth')
        setAppState('auth')
        return
      }

      setUserProfile(profile)

      // Check if onboarding is complete (has age)
      if (profile.age) {
        console.log('✅ Profile complete, showing dashboard')
        setAppState('dashboard')
      } else {
        console.log('📝 Profile incomplete, showing onboarding')
        setAppState('onboarding')
      }

    } catch (error) {
      console.error('❌ Profile check error:', error)
      setAppState('auth')
    }
  }

  const handleAuthSuccess = (session: any) => {
    console.log('🎉 Auth successful:', session.user.email)
    setUser(session.user)
    checkUserProfile(session.user.id)
  }

  const handleOnboardingComplete = (profile: any) => {
    console.log('🎉 Onboarding complete')
    setUserProfile(profile)
    setAppState('dashboard')
  }

  const handleLogout = async () => {
    console.log('👋 Logging out...')
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setAppState('auth')
  }

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  // Auth state
  if (appState === 'auth') {
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
          <Auth onAuthSuccess={handleAuthSuccess} />
        </div>
      </div>
    )
  }

  // Onboarding state
  if (appState === 'onboarding') {
    return (
      <Onboarding 
        user={user}
        onComplete={handleOnboardingComplete}
      />
    )
  }

  // Dashboard state
  if (appState === 'dashboard') {
    return (
      <Dashboard 
        user={user}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
    )
  }

  return null
}