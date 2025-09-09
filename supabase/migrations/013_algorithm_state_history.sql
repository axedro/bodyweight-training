-- Create algorithm state history table for temporal tracking
CREATE TABLE public.algorithm_state_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  calculation_date DATE NOT NULL,
  current_ica DECIMAL(3,2),
  recovery_factor DECIMAL(3,2),
  adherence_factor DECIMAL(3,2),
  progression_factor DECIMAL(3,2),
  detraining_factor DECIMAL(3,2) DEFAULT 1.0,
  current_fitness_score DECIMAL(3,2),
  last_training_date DATE,
  
  -- Biometric data context
  biometric_data_source TEXT CHECK (biometric_data_source IN ('snapshots', 'profile')),
  biometric_age_days INTEGER,
  biometric_weight DECIMAL(5,2),
  biometric_sleep_quality INTEGER,
  biometric_fatigue_level INTEGER,
  
  -- Algorithm context
  sessions_analyzed INTEGER DEFAULT 0,
  wellness_logs_count INTEGER DEFAULT 0,
  progressions_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates per day
  UNIQUE(user_id, calculation_date)
);

-- Create index for efficient queries
CREATE INDEX idx_algorithm_state_history_user_date ON public.algorithm_state_history(user_id, calculation_date DESC);
CREATE INDEX idx_algorithm_state_history_user_created ON public.algorithm_state_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.algorithm_state_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own algorithm history" ON public.algorithm_state_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own algorithm history" ON public.algorithm_state_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_algorithm_state_history_updated_at 
  BEFORE UPDATE ON public.algorithm_state_history 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful view for latest states per user
CREATE VIEW public.latest_algorithm_states AS
SELECT DISTINCT ON (user_id) 
  user_id,
  calculation_date,
  current_ica,
  recovery_factor,
  adherence_factor,
  progression_factor,
  detraining_factor,
  current_fitness_score,
  last_training_date,
  biometric_data_source,
  biometric_age_days,
  created_at
FROM public.algorithm_state_history
ORDER BY user_id, calculation_date DESC, created_at DESC;

-- Enable RLS on view
ALTER VIEW public.latest_algorithm_states SET (security_invoker = true);