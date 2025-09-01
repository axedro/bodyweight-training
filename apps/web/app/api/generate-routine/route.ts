import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verificar autenticación y obtener JWT
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { daysToGenerate = 1 } = await request.json()

    // Llamar a la Edge Function con el JWT del usuario
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-routine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'X-Client-Info': 'supabase-js/2.0.0'
      },
      body: JSON.stringify({ daysToGenerate })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error:', errorText)
      return NextResponse.json({ error: 'Failed to generate routine' }, { status: 500 })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      trainingPlan: result.trainingPlan,
      sessions: result.sessions
    })

  } catch (error) {
    console.error('Error in generate-routine API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
