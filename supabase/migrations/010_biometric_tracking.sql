-- Migration 010: Biometric Tracking System
-- Creates a table to track all biometric and wellness indicators over time

-- Create biometric_snapshots table for temporal tracking
CREATE TABLE biometric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  
  -- Physical measurements (required: weight, optional: others)
  weight numeric(5,2) NOT NULL, -- kg, required field
  height numeric(5,2), -- cm, usually static after onboarding
  body_fat_percentage numeric(4,1), -- %, optional
  
  -- Cardiovascular metrics
  resting_hr integer, -- bpm
  training_hr_avg integer, -- bpm, average during workouts
  hrv_trend numeric(3,1), -- heart rate variability trend
  
  -- Sleep and recovery metrics  
  sleep_hours numeric(3,1), -- hours per night
  sleep_quality integer CHECK (sleep_quality >= 1 AND sleep_quality <= 5), -- 1-5 scale
  fatigue_level integer CHECK (fatigue_level >= 1 AND fatigue_level <= 5), -- 1-5 scale
  
  -- Calculated fields
  bmi numeric(4,1) GENERATED ALWAYS AS (
    CASE 
      WHEN height IS NOT NULL AND height > 0 
      THEN ROUND((weight / POWER(height / 100, 2))::numeric, 1)
      ELSE NULL 
    END
  ) STORED,
  age integer, -- calculated from birth_date, stored for historical accuracy
  
  -- Metadata
  data_source text DEFAULT 'manual' CHECK (data_source IN ('onboarding', 'manual', 'pre_routine', 'automatic')),
  notes text,
  
  -- Prevent duplicate entries per day per user
  UNIQUE(user_id, snapshot_date)
);

-- Add RLS (Row Level Security)
ALTER TABLE biometric_snapshots ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own biometric data
CREATE POLICY "Users can view their own biometric snapshots" 
ON biometric_snapshots FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own biometric snapshots" 
ON biometric_snapshots FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own biometric snapshots" 
ON biometric_snapshots FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own biometric snapshots" 
ON biometric_snapshots FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_biometric_snapshots_user_date ON biometric_snapshots(user_id, snapshot_date DESC);
CREATE INDEX idx_biometric_snapshots_created_at ON biometric_snapshots(created_at DESC);

-- Add birth_date to user_profiles for age calculation
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS target_weight numeric(5,2), -- Optional target weight for goals
ADD COLUMN IF NOT EXISTS activity_level text DEFAULT 'moderate' CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active'));

-- Create function to automatically calculate age from birth_date
CREATE OR REPLACE FUNCTION calculate_age(birth_date date, reference_date date DEFAULT CURRENT_DATE)
RETURNS integer AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(reference_date, birth_date));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get latest biometric data for a user
CREATE OR REPLACE FUNCTION get_latest_biometrics(user_uuid uuid)
RETURNS TABLE (
  weight numeric,
  height numeric,
  body_fat_percentage numeric,
  bmi numeric,
  resting_hr integer,
  training_hr_avg integer,
  hrv_trend numeric,
  sleep_hours numeric,
  sleep_quality integer,
  fatigue_level integer,
  age integer,
  snapshot_date date,
  days_old integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bs.weight,
    COALESCE(bs.height, up.height) as height,
    bs.body_fat_percentage,
    bs.bmi,
    bs.resting_hr,
    bs.training_hr_avg,
    bs.hrv_trend,
    bs.sleep_hours,
    bs.sleep_quality,
    bs.fatigue_level,
    bs.age,
    bs.snapshot_date,
    (CURRENT_DATE - bs.snapshot_date)::integer as days_old
  FROM biometric_snapshots bs
  LEFT JOIN user_profiles up ON bs.user_id = up.id
  WHERE bs.user_id = user_uuid
  ORDER BY bs.snapshot_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to estimate missing biometric values based on BMI and demographics
CREATE OR REPLACE FUNCTION estimate_biometric_values(
  weight_kg numeric,
  height_cm numeric,
  age_years integer DEFAULT NULL,
  gender text DEFAULT 'unknown'
)
RETURNS TABLE (
  estimated_body_fat numeric,
  estimated_resting_hr integer,
  estimated_sleep_hours numeric
) AS $$
DECLARE
  bmi numeric;
  base_bf numeric;
  base_hr integer;
BEGIN
  -- Calculate BMI
  bmi := weight_kg / POWER(height_cm / 100, 2);
  
  -- Estimate body fat percentage based on BMI and demographics
  -- Base estimates from BMI categories
  IF bmi < 18.5 THEN
    base_bf := 8;  -- Underweight
  ELSIF bmi < 25 THEN
    base_bf := 15; -- Normal weight
  ELSIF bmi < 30 THEN
    base_bf := 25; -- Overweight  
  ELSE
    base_bf := 35; -- Obese
  END IF;
  
  -- Gender adjustment (women typically have higher body fat)
  IF gender = 'female' THEN
    base_bf := base_bf + 8;
  ELSIF gender = 'male' THEN
    base_bf := base_bf + 0;
  ELSE
    base_bf := base_bf + 4; -- Average adjustment
  END IF;
  
  -- Age adjustment (body fat increases with age)
  IF age_years IS NOT NULL THEN
    base_bf := base_bf + (age_years - 25) * 0.2;
  END IF;
  
  -- Clamp body fat percentage to reasonable range
  base_bf := GREATEST(5, LEAST(50, base_bf));
  
  -- Estimate resting heart rate (general population averages)
  base_hr := 70; -- Average adult RHR
  
  -- Age adjustment for RHR (slightly increases with age)
  IF age_years IS NOT NULL THEN
    base_hr := base_hr + (age_years - 30) * 0.5;
  END IF;
  
  -- Fitness level adjustment based on BMI (lower BMI often = better cardiovascular fitness)
  IF bmi < 22 THEN
    base_hr := base_hr - 5; -- Likely more fit
  ELSIF bmi > 28 THEN
    base_hr := base_hr + 10; -- Likely less fit
  END IF;
  
  -- Clamp heart rate to reasonable range
  base_hr := GREATEST(50, LEAST(100, base_hr));
  
  RETURN QUERY SELECT 
    ROUND(base_bf::numeric, 1) as estimated_body_fat,
    base_hr as estimated_resting_hr,
    7.5::numeric as estimated_sleep_hours; -- Recommended average
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to automatically create initial biometric snapshot from user_profiles
CREATE OR REPLACE FUNCTION create_initial_biometric_snapshot()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if this is a new profile with weight data
  IF NEW.weight IS NOT NULL AND OLD.weight IS NULL THEN
    INSERT INTO biometric_snapshots (
      user_id,
      weight,
      height,
      body_fat_percentage,
      resting_hr,
      training_hr_avg,
      hrv_trend,
      sleep_hours,
      sleep_quality,
      fatigue_level,
      age,
      data_source
    ) VALUES (
      NEW.id,
      NEW.weight,
      NEW.height,
      NEW.body_fat_percentage,
      NEW.resting_hr,
      NEW.training_hr_avg,
      NEW.hrv_trend,
      NEW.sleep_hours,
      NEW.sleep_quality,
      NEW.fatigue_level,
      CASE 
        WHEN NEW.birth_date IS NOT NULL 
        THEN calculate_age(NEW.birth_date)
        ELSE NEW.age 
      END,
      'onboarding'
    ) ON CONFLICT (user_id, snapshot_date) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for initial biometric snapshot
CREATE TRIGGER trigger_create_initial_biometric_snapshot
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_biometric_snapshot();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON biometric_snapshots TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION get_latest_biometrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION estimate_biometric_values(numeric, numeric, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_age(date, date) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE biometric_snapshots IS 'Temporal tracking of all biometric and wellness indicators for algorithmic personalization';
COMMENT ON COLUMN biometric_snapshots.weight IS 'Body weight in kg - required field for BMI and algorithm calculations';
COMMENT ON COLUMN biometric_snapshots.data_source IS 'Source of data: onboarding (initial), manual (user update), pre_routine (before workout), automatic (from devices)';
COMMENT ON FUNCTION get_latest_biometrics(uuid) IS 'Returns the most recent biometric data for a user with calculated age and days since measurement';
COMMENT ON FUNCTION estimate_biometric_values(numeric, numeric, integer, text) IS 'Provides reasonable estimates for missing biometric values based on BMI and demographics';