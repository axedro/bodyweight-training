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

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sessionId, exerciseBlocks } = await request.json()

    if (!sessionId || !exerciseBlocks) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Llamar a la Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-progressions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'X-Client-Info': 'supabase-js/2.0.0'
      },
      body: JSON.stringify({ sessionId, exerciseBlocks })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error:', errorText)
      return NextResponse.json({ error: 'Failed to update progressions' }, { status: 500 })
    }

    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      session: result.session,
      exerciseBlocks: result.exerciseBlocks,
      progressionUpdates: result.progressionUpdates
    })

  } catch (error) {
    console.error('Error in update-progressions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
