import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
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

    // Get latest biometric data using the database function
    const { data: latestBiometrics, error: biometricsError } = await supabaseClient
      .rpc('get_latest_biometrics', { user_uuid: user.id })

    if (biometricsError) {
      console.error('Error fetching latest biometrics:', biometricsError)
      // If no biometric snapshots exist, get data from user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select(`
          weight,
          height,
          body_fat_percentage,
          resting_hr,
          training_hr_avg,
          sleep_hours,
          sleep_quality,
          fatigue_level,
          updated_at
        `)
        .eq('id', user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      return new Response(
        JSON.stringify({
          ...profile,
          last_updated: profile.updated_at
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    // Return latest biometrics data
    const biometricData = latestBiometrics[0] || {}
    
    return new Response(
      JSON.stringify({
        weight: biometricData.weight,
        height: biometricData.height,
        body_fat_percentage: biometricData.body_fat_percentage,
        resting_hr: biometricData.resting_hr,
        training_hr_avg: biometricData.training_hr_avg,
        sleep_hours: biometricData.sleep_hours,
        sleep_quality: biometricData.sleep_quality,
        fatigue_level: biometricData.fatigue_level,
        age: biometricData.age,
        bmi: biometricData.bmi,
        last_updated: biometricData.snapshot_date,
        days_old: biometricData.days_old
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in get-latest-biometrics function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})