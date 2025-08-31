-- Training Sessions table
CREATE TABLE public.training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type session_status DEFAULT 'planned',
  
  -- Session details
  total_duration INTEGER, -- minutes
  total_volume_load DECIMAL(8,2),
  intensity_target DECIMAL(3,2) CHECK (intensity_target >= 0.5 AND intensity_target <= 1.0), -- 0.5-1.0
  recovery_requirement INTEGER, -- hours until next session
  
  -- Feedback from user
  rpe_reported INTEGER CHECK (rpe_reported >= 1 AND rpe_reported <= 10), -- Rate of Perceived Exertion
  completion_rate DECIMAL(3,2) CHECK (completion_rate >= 0 AND completion_rate <= 1), -- % exercises completed
  technical_quality INTEGER CHECK (technical_quality >= 1 AND technical_quality <= 5), -- self-assessment
  enjoyment_level INTEGER CHECK (enjoyment_level >= 1 AND enjoyment_level <= 5),
  recovery_feeling INTEGER CHECK (recovery_feeling >= 1 AND recovery_feeling <= 5), -- readiness for next session
  
  -- Algorithm data
  ica_score DECIMAL(3,2), -- Index of Current Ability
  algorithm_version TEXT DEFAULT '1.0',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, session_date)
);

-- Exercise blocks within sessions
CREATE TABLE public.session_exercise_blocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  block_order INTEGER NOT NULL,
  block_type exercise_category NOT NULL,
  
  -- Performance data
  sets_completed INTEGER,
  reps_completed INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  weight_kg DECIMAL(5,2), -- for weighted variations
  
  -- User feedback
  difficulty_rating INTEGER CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness logs for daily tracking
CREATE TABLE public.wellness_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Sleep metrics
  sleep_hours DECIMAL(3,1) CHECK (sleep_hours >= 0 AND sleep_hours <= 24),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  sleep_notes TEXT,
  
  -- Recovery metrics
  fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  mood_level INTEGER CHECK (mood_level >= 1 AND mood_level <= 5),
  
  -- Physiological metrics
  resting_hr INTEGER CHECK (resting_hr >= 40 AND resting_hr <= 200),
  weight_kg DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  
  -- Lifestyle factors
  hydration_level INTEGER CHECK (hydration_level >= 1 AND hydration_level <= 5),
  nutrition_quality INTEGER CHECK (nutrition_quality >= 1 AND nutrition_quality <= 5),
  
  -- Notes
  general_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, log_date)
);

-- User exercise progressions tracking
CREATE TABLE public.user_exercise_progressions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES public.exercises(id) NOT NULL,
  
  -- Current progression level
  current_level INTEGER DEFAULT 1 CHECK (current_level >= 1 AND current_level <= 10),
  current_variant_id UUID REFERENCES public.exercises(id),
  
  -- Performance tracking
  max_reps_achieved INTEGER DEFAULT 0,
  max_weight_kg DECIMAL(5,2),
  best_rpe_score INTEGER CHECK (best_rpe_score >= 1 AND best_rpe_score <= 10),
  
  -- Progression criteria
  consecutive_successful_sessions INTEGER DEFAULT 0,
  consecutive_failed_sessions INTEGER DEFAULT 0,
  last_progression_date DATE,
  
  -- Algorithm data
  difficulty_score DECIMAL(3,2) DEFAULT 1.0,
  progression_velocity DECIMAL(3,2) DEFAULT 1.0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, exercise_id)
);

-- Create indexes for performance
CREATE INDEX idx_training_sessions_user_date ON public.training_sessions(user_id, session_date);
CREATE INDEX idx_session_exercise_blocks_session ON public.session_exercise_blocks(session_id);
CREATE INDEX idx_wellness_logs_user_date ON public.wellness_logs(user_id, log_date);
CREATE INDEX idx_user_exercise_progressions_user ON public.user_exercise_progressions(user_id);

-- Enable Row Level Security
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercise_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_progressions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_sessions
CREATE POLICY "Users can view their own training sessions" ON public.training_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training sessions" ON public.training_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training sessions" ON public.training_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training sessions" ON public.training_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for session_exercise_blocks
CREATE POLICY "Users can view their own session exercise blocks" ON public.session_exercise_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = session_exercise_blocks.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own session exercise blocks" ON public.session_exercise_blocks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = session_exercise_blocks.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own session exercise blocks" ON public.session_exercise_blocks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = session_exercise_blocks.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own session exercise blocks" ON public.session_exercise_blocks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions 
      WHERE training_sessions.id = session_exercise_blocks.session_id 
      AND training_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for wellness_logs
CREATE POLICY "Users can view their own wellness logs" ON public.wellness_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wellness logs" ON public.wellness_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wellness logs" ON public.wellness_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wellness logs" ON public.wellness_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_exercise_progressions
CREATE POLICY "Users can view their own exercise progressions" ON public.user_exercise_progressions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exercise progressions" ON public.user_exercise_progressions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise progressions" ON public.user_exercise_progressions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise progressions" ON public.user_exercise_progressions
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_training_sessions_updated_at 
  BEFORE UPDATE ON public.training_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wellness_logs_updated_at 
  BEFORE UPDATE ON public.wellness_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_exercise_progressions_updated_at 
  BEFORE UPDATE ON public.user_exercise_progressions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
