'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function Providers({ children }: { children: React.ReactNode }) {
  const [supabaseClient] = useState(() => createBrowserClient(supabaseUrl, supabaseAnonKey))

  return (
    <>
      {children}
    </>
  )
}
