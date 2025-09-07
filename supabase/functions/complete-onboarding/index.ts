import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface OnboardingRequest {
  // Basic info
  birth_date: string
  weight: number
  height: number
  
  // Body composition (optional)
  body_fat_percentage?: number
  
  // Cardiovascular metrics (optional)
  resting_hr?: number
  training_hr_avg?: number
  
  // Sleep and recovery
  sleep_hours: number
  sleep_quality: number
  fatigue_level: number
  
  // Fitness background
  fitness_level: 'beginner' | 'intermediate' | 'advanced'
  experience_years: number
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  
  // Training preferences
  available_days_per_week: number
  preferred_session_duration: number
  preferred_intensity: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    
    if (userError || !user) {
      throw new Error('No authenticated user')
    }

    // Parse request body
    const onboardingData: OnboardingRequest = await req.json()

    // Validate required fields
    if (!onboardingData.birth_date || !onboardingData.weight || !onboardingData.height) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: birth_date, weight, height' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Calculate age from birth_date
    const birthDate = new Date(onboardingData.birth_date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear() - 
      (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)

    // Calculate BMI and generate estimates for missing values
    const bmi = onboardingData.weight / Math.pow(onboardingData.height / 100, 2)
    
    // Estimate missing biometric values using BMI and age
    const estimatedBodyFat = onboardingData.body_fat_percentage ?? 
      Math.round((bmi < 18.5 ? 12 : bmi < 25 ? 18 : bmi < 30 ? 25 : 32) + (age - 25) * 0.2)
    
    const estimatedRestingHR = onboardingData.resting_hr ?? 
      Math.round(70 + (age - 30) * 0.5 + (bmi > 28 ? 10 : bmi < 22 ? -5 : 0))
    
    const estimatedTrainingHR = onboardingData.training_hr_avg ?? 
      Math.round(estimatedRestingHR * 1.6) // Approximation

    // Prepare user profile data
    const profileData = {
      id: user.id,
      email: user.email,
      birth_date: onboardingData.birth_date,
      age: age,
      weight: onboardingData.weight,
      height: onboardingData.height,
      body_fat_percentage: estimatedBodyFat,
      resting_hr: estimatedRestingHR,
      training_hr_avg: estimatedTrainingHR,
      sleep_hours: onboardingData.sleep_hours,
      sleep_quality: onboardingData.sleep_quality,
      fatigue_level: onboardingData.fatigue_level,
      fitness_level: onboardingData.fitness_level,
      experience_years: onboardingData.experience_years,
      activity_level: onboardingData.activity_level,
      available_days_per_week: onboardingData.available_days_per_week,
      preferred_session_duration: onboardingData.preferred_session_duration,
      preferred_intensity: onboardingData.preferred_intensity,
      updated_at: new Date().toISOString()
    }

    // Start database transaction
    console.log('📝 Updating user profile for:', user.id)

    // Update user profile
    const { data: updatedProfile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Profile update failed:', profileError)
      throw new Error(`Failed to update profile: ${profileError.message}`)
    }

    console.log('✅ Profile updated successfully')

    // Create initial biometric snapshot
    const biometricSnapshot = {
      user_id: user.id,
      snapshot_date: new Date().toISOString().split('T')[0],
      weight: onboardingData.weight,
      height: onboardingData.height,
      body_fat_percentage: estimatedBodyFat,
      resting_hr: estimatedRestingHR,
      training_hr_avg: estimatedTrainingHR,
      sleep_hours: onboardingData.sleep_hours,
      sleep_quality: onboardingData.sleep_quality,
      fatigue_level: onboardingData.fatigue_level,
      age: age,
      data_source: 'onboarding',
      notes: 'Initial onboarding data with BMI-based estimates'
    }

    const { data: snapshot, error: snapshotError } = await supabaseClient
      .from('biometric_snapshots')
      .upsert(biometricSnapshot)
      .select()
      .single()

    if (snapshotError) {
      console.error('⚠️ Snapshot creation failed:', snapshotError)
      // Don't fail the entire onboarding if snapshot fails
    } else {
      console.log('📊 Initial biometric snapshot created')
    }

    // Return complete profile data
    const response = {
      success: true,
      profile: updatedProfile,
      biometric_snapshot: snapshot,
      calculated_values: {
        age: age,
        bmi: Math.round(bmi * 10) / 10,
        estimated_body_fat: estimatedBodyFat,
        estimated_resting_hr: estimatedRestingHR,
        estimated_training_hr: estimatedTrainingHR
      },
      message: 'Onboarding completed successfully'
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in complete-onboarding function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})