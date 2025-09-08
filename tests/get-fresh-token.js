// Script para obtener un JWT token fresco para testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function getFreshToken() {
  console.log('🔐 Attempting to sign in with test user...')
  
  // Try to sign in with existing test user
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@bodyweight.com',
    password: 'testpassword123'
  })

  if (error) {
    console.log('❌ Sign in failed:', error.message)
    
    // If user doesn't exist, create it
    console.log('📝 Creating new test user...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@bodyweight.com',
      password: 'testpassword123'
    })

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message)
      return
    }

    console.log('✅ Test user created')
    console.log('🔑 Access Token:', signUpData.session?.access_token)
    console.log('👤 User ID:', signUpData.user?.id)
    return signUpData.session?.access_token
  }

  console.log('✅ Sign in successful')
  console.log('🔑 Access Token:', data.session?.access_token)
  console.log('👤 User ID:', data.user?.id)
  return data.session?.access_token
}

getFreshToken()