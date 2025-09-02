-- Create muscle group metrics table for advanced tracking and analysis

CREATE TABLE public.muscle_group_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  muscle_group TEXT NOT NULL,
  week_start DATE NOT NULL,
  
  -- Volume metrics
  total_sets INTEGER DEFAULT 0,
  total_reps INTEGER DEFAULT 0,
  total_time_under_tension INTEGER DEFAULT 0, -- seconds
  
  -- Intensity metrics  
  avg_rpe DECIMAL(3,2) DEFAULT 0.0,
  max_rpe DECIMAL(3,2) DEFAULT 0.0,
  avg_difficulty_perceived DECIMAL(3,2) DEFAULT 0.0,
  
  -- Progression metrics
  exercises_attempted INTEGER DEFAULT 0,
  exercises_completed INTEGER DEFAULT 0,
  progression_level_avg DECIMAL(3,2) DEFAULT 0.0,
  
  -- Recovery metrics
  avg_technique_quality DECIMAL(3,2) DEFAULT 0.0,
  fatigue_frequency INTEGER DEFAULT 0, -- times reported as fatigued
  recovery_time_avg INTEGER DEFAULT 0, -- average recovery hours
  
  -- Balance metrics
  relative_volume DECIMAL(3,2) DEFAULT 0.0, -- % of total weekly volume
  imbalance_score DECIMAL(3,2) DEFAULT 0.0, -- imbalance vs other groups
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, muscle_group, week_start)
);

-- Create enhanced session exercise data table for granular tracking
CREATE TABLE public.exercise_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_exercise_id UUID REFERENCES public.session_exercises(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  
  -- Detailed performance data
  set_number INTEGER NOT NULL,
  reps_completed INTEGER NOT NULL,
  rpe_reported DECIMAL(3,2), -- RPE for this specific set
  technique_quality DECIMAL(3,2), -- 1-5 for this set
  rest_time_actual INTEGER, -- actual rest time in seconds
  difficulty_perceived DECIMAL(3,2), -- how difficult this set felt
  
  -- Muscle group data (denormalized for easier queries)
  muscle_groups TEXT[], -- copy from exercises table
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_muscle_group_metrics_user_week ON public.muscle_group_metrics(user_id, week_start);
CREATE INDEX idx_muscle_group_metrics_group ON public.muscle_group_metrics(muscle_group);
CREATE INDEX idx_exercise_performance_user_date ON public.exercise_performance(user_id, session_date);
CREATE INDEX idx_exercise_performance_muscle_groups ON public.exercise_performance USING GIN(muscle_groups);

-- Enable RLS
ALTER TABLE public.muscle_group_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_performance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own muscle group metrics" ON public.muscle_group_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own muscle group metrics" ON public.muscle_group_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own muscle group metrics" ON public.muscle_group_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exercise performance" ON public.exercise_performance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise performance" ON public.exercise_performance FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise performance" ON public.exercise_performance FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_muscle_group_metrics_updated_at 
  BEFORE UPDATE ON public.muscle_group_metrics 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();