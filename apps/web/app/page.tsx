'use client'

import { useSession } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from './components/auth'
import { Onboarding } from './components/onboarding'
import { Dashboard } from './components/dashboard'

export default function HomePage() {
  const session = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      // Verificar si el usuario ha completado el onboarding
      checkOnboardingStatus()
    }
  }, [session])

  const checkOnboardingStatus = async () => {
    if (!session?.user) return

    const supabase = createClientComponentClient()
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()

    if (!profile || !profile.age) {
      // Usuario no ha completado onboarding
      router.push('/onboarding')
    } else {
      // Usuario ha completado onboarding, ir al dashboard
      router.push('/dashboard')
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Dashboard />
    </div>
  )
}
