-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE exercise_category AS ENUM ('push', 'pull', 'squat', 'hinge', 'core', 'locomotion');
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'skipped');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Onboarding data
  age INTEGER,
  weight DECIMAL(5,2), -- kg
  height DECIMAL(5,2), -- cm
  body_fat_percentage DECIMAL(4,2),
  fitness_level fitness_level DEFAULT 'beginner',
  experience_years INTEGER DEFAULT 0,
  available_days_per_week INTEGER DEFAULT 3,
  
  -- Physiological metrics
  resting_hr INTEGER,
  training_hr_avg INTEGER,
  hrv_trend DECIMAL(4,2),
  
  -- Calculated metrics
  current_fitness_score DECIMAL(3,2) DEFAULT 4.0, -- 1-10 scale
  adherence_rate DECIMAL(3,2) DEFAULT 0.75, -- 0.5-1.0
  last_training_date DATE,
  
  -- Recovery state
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  sleep_hours DECIMAL(3,1),
  fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
  
  -- Preferences
  preferred_session_duration INTEGER DEFAULT 30, -- minutes
  preferred_intensity DECIMAL(3,2) DEFAULT 0.7, -- 0.5-1.0
  notifications_enabled BOOLEAN DEFAULT true
);

-- Exercises table
CREATE TABLE public.exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category exercise_category NOT NULL,
  difficulty_level DECIMAL(3,1) NOT NULL, -- 1-10 scale
  progression_level INTEGER NOT NULL, -- 1-7 for progression hierarchy
  muscle_groups TEXT[], -- Array of muscle groups targeted
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise progressions table (user-specific progression tracking)
CREATE TABLE public.user_exercise_progressions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  current_level INTEGER DEFAULT 1,
  consecutive_completions INTEGER DEFAULT 0,
  last_attempted_date DATE,
  last_completed_date DATE,
  personal_best_reps INTEGER,
  personal_best_sets INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, exercise_id)
);

-- Training sessions table
CREATE TABLE public.training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status session_status DEFAULT 'planned',
  planned_duration INTEGER, -- minutes
  actual_duration INTEGER, -- minutes
  intensity_target DECIMAL(3,2), -- 0.5-1.0
  actual_intensity DECIMAL(3,2),
  ica_score DECIMAL(3,2), -- Index of Current Ability
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Session exercises table (exercises within a session)
CREATE TABLE public.session_exercises (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets_planned INTEGER NOT NULL,
  reps_planned INTEGER NOT NULL,
  sets_completed INTEGER,
  reps_completed INTEGER,
  rpe_reported INTEGER CHECK (rpe_reported >= 1 AND rpe_reported <= 10),
  technical_quality INTEGER CHECK (technical_quality >= 1 AND technical_quality <= 5),
  enjoyment_level INTEGER CHECK (enjoyment_level >= 1 AND enjoyment_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily wellness tracking
CREATE TABLE public.wellness_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  fatigue_level INTEGER CHECK (fatigue_level >= 1 AND fatigue_level <= 5),
  stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 5),
  hydration_level INTEGER CHECK (hydration_level >= 1 AND hydration_level <= 5),
  mood_level INTEGER CHECK (mood_level >= 1 AND mood_level <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, log_date)
);

-- Algorithm parameters and state
CREATE TABLE public.algorithm_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  current_ica DECIMAL(3,2),
  recovery_factor DECIMAL(3,2),
  adherence_factor DECIMAL(3,2),
  progression_factor DECIMAL(3,2),
  detraining_factor DECIMAL(3,2) DEFAULT 1.0,
  last_calculation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- User preferences and customizations
CREATE TABLE public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  preference_type TEXT NOT NULL, -- 'favorite', 'avoid', 'modify'
  preference_value JSONB, -- Flexible storage for modifications
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, exercise_id, preference_type)
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_exercises_category ON public.exercises(category);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty_level);
CREATE INDEX idx_training_sessions_user_date ON public.training_sessions(user_id, session_date);
CREATE INDEX idx_session_exercises_session ON public.session_exercises(session_id);
CREATE INDEX idx_wellness_logs_user_date ON public.wellness_logs(user_id, log_date);
CREATE INDEX idx_user_exercise_progressions_user ON public.user_exercise_progressions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_exercise_progressions_updated_at BEFORE UPDATE ON public.user_exercise_progressions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_exercises_updated_at BEFORE UPDATE ON public.session_exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wellness_logs_updated_at BEFORE UPDATE ON public.wellness_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_algorithm_state_updated_at BEFORE UPDATE ON public.algorithm_state FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exercise_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Exercises are viewable by all authenticated users" ON public.exercises FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view own exercise progressions" ON public.user_exercise_progressions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own exercise progressions" ON public.user_exercise_progressions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exercise progressions" ON public.user_exercise_progressions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own training sessions" ON public.training_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own training sessions" ON public.training_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own training sessions" ON public.training_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own session exercises" ON public.session_exercises FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.training_sessions WHERE id = session_id));
CREATE POLICY "Users can update own session exercises" ON public.session_exercises FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.training_sessions WHERE id = session_id));
CREATE POLICY "Users can insert own session exercises" ON public.session_exercises FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.training_sessions WHERE id = session_id));

CREATE POLICY "Users can view own wellness logs" ON public.wellness_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wellness logs" ON public.wellness_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wellness logs" ON public.wellness_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own algorithm state" ON public.algorithm_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own algorithm state" ON public.algorithm_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own algorithm state" ON public.algorithm_state FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
