import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface BiometricUpdateRequest {
  weight?: number
  body_fat_percentage?: number
  resting_hr?: number
  training_hr_avg?: number
  hrv_trend?: number
  sleep_hours?: number
  sleep_quality?: number
  fatigue_level?: number
  data_source?: 'manual' | 'pre_routine' | 'automatic'
  notes?: string
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
    const updateData: BiometricUpdateRequest = await req.json()

    // Validate input ranges
    const validationErrors: string[] = []

    if (updateData.weight !== undefined) {
      if (updateData.weight < 30 || updateData.weight > 200) {
        validationErrors.push('Weight must be between 30 and 200 kg')
      }
    }

    if (updateData.body_fat_percentage !== undefined) {
      if (updateData.body_fat_percentage < 5 || updateData.body_fat_percentage > 50) {
        validationErrors.push('Body fat percentage must be between 5% and 50%')
      }
    }

    if (updateData.resting_hr !== undefined) {
      if (updateData.resting_hr < 40 || updateData.resting_hr > 120) {
        validationErrors.push('Resting heart rate must be between 40 and 120 BPM')
      }
    }

    if (updateData.training_hr_avg !== undefined) {
      if (updateData.training_hr_avg < 80 || updateData.training_hr_avg > 200) {
        validationErrors.push('Training heart rate must be between 80 and 200 BPM')
      }
    }

    if (updateData.sleep_hours !== undefined) {
      if (updateData.sleep_hours < 4 || updateData.sleep_hours > 12) {
        validationErrors.push('Sleep hours must be between 4 and 12 hours')
      }
    }

    if (updateData.sleep_quality !== undefined) {
      if (updateData.sleep_quality < 1 || updateData.sleep_quality > 5) {
        validationErrors.push('Sleep quality must be between 1 and 5')
      }
    }

    if (updateData.fatigue_level !== undefined) {
      if (updateData.fatigue_level < 1 || updateData.fatigue_level > 5) {
        validationErrors.push('Fatigue level must be between 1 and 5')
      }
    }

    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Validation failed',
          validation_errors: validationErrors 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get current user profile for height and other baseline data
    const { data: profile, error: profileError } = await supabaseClient
      .from('user_profiles')
      .select('height, birth_date, age')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error(`Failed to get user profile: ${profileError.message}`)
    }

    // Calculate age if birth_date available and age not set
    let age = profile.age
    if (!age && profile.birth_date) {
      const birthDate = new Date(profile.birth_date)
      const today = new Date()
      age = today.getFullYear() - birthDate.getFullYear() - 
        (today.getMonth() < birthDate.getMonth() || 
         (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate()) ? 1 : 0)
    }

    // Prepare biometric snapshot data
    const snapshotData: any = {
      user_id: user.id,
      snapshot_date: new Date().toISOString().split('T')[0],
      data_source: updateData.data_source || 'manual'
    }

    // Add provided biometric fields
    if (updateData.weight !== undefined) snapshotData.weight = updateData.weight
    if (updateData.body_fat_percentage !== undefined) snapshotData.body_fat_percentage = updateData.body_fat_percentage
    if (updateData.resting_hr !== undefined) snapshotData.resting_hr = updateData.resting_hr
    if (updateData.training_hr_avg !== undefined) snapshotData.training_hr_avg = updateData.training_hr_avg
    if (updateData.hrv_trend !== undefined) snapshotData.hrv_trend = updateData.hrv_trend
    if (updateData.sleep_hours !== undefined) snapshotData.sleep_hours = updateData.sleep_hours
    if (updateData.sleep_quality !== undefined) snapshotData.sleep_quality = updateData.sleep_quality
    if (updateData.fatigue_level !== undefined) snapshotData.fatigue_level = updateData.fatigue_level
    if (updateData.notes) snapshotData.notes = updateData.notes
    if (profile.height) snapshotData.height = profile.height
    if (age) snapshotData.age = age

    console.log('📊 Creating biometric snapshot for user:', user.id)

    // Insert/update biometric snapshot (upsert by user_id and snapshot_date)
    const { data: snapshot, error: snapshotError } = await supabaseClient
      .from('biometric_snapshots')
      .upsert(snapshotData, {
        onConflict: 'user_id, snapshot_date'
      })
      .select()
      .single()

    if (snapshotError) {
      throw new Error(`Failed to save biometric snapshot: ${snapshotError.message}`)
    }

    console.log('✅ Biometric snapshot saved successfully')

    // If weight is provided, also update the user profile for quick access
    const profileUpdates: any = {}
    let profileNeedsUpdate = false

    if (updateData.weight !== undefined) {
      profileUpdates.weight = updateData.weight
      profileNeedsUpdate = true
    }
    if (updateData.sleep_hours !== undefined) {
      profileUpdates.sleep_hours = updateData.sleep_hours
      profileNeedsUpdate = true
    }
    if (updateData.sleep_quality !== undefined) {
      profileUpdates.sleep_quality = updateData.sleep_quality
      profileNeedsUpdate = true
    }
    if (updateData.fatigue_level !== undefined) {
      profileUpdates.fatigue_level = updateData.fatigue_level
      profileNeedsUpdate = true
    }

    if (profileNeedsUpdate) {
      profileUpdates.updated_at = new Date().toISOString()

      const { error: updateError } = await supabaseClient
        .from('user_profiles')
        .update(profileUpdates)
        .eq('id', user.id)

      if (updateError) {
        console.error('⚠️ Failed to update profile quick-access fields:', updateError)
        // Don't fail the request, snapshot is more important
      } else {
        console.log('✅ Profile quick-access fields updated')
      }
    }

    // Calculate derived metrics if possible
    const derivedMetrics: any = {}
    
    if (snapshot.weight && snapshot.height) {
      derivedMetrics.bmi = Math.round((snapshot.weight / Math.pow(snapshot.height / 100, 2)) * 10) / 10
    }

    if (snapshot.resting_hr && snapshot.training_hr_avg) {
      derivedMetrics.heart_rate_reserve = snapshot.training_hr_avg - snapshot.resting_hr
    }

    // Return updated biometric data
    const response = {
      success: true,
      biometric_snapshot: snapshot,
      derived_metrics: derivedMetrics,
      updated_fields: Object.keys(updateData).filter(key => updateData[key as keyof BiometricUpdateRequest] !== undefined),
      message: 'Biometric data updated successfully'
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in update-biometrics function:', error)
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