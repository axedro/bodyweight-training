-- Add support for alternative exercises and exercise metadata

-- Add columns to exercises table for alternative exercise support
ALTER TABLE public.exercises 
ADD COLUMN alternative_for UUID REFERENCES public.exercises(id),
ADD COLUMN is_alternative BOOLEAN DEFAULT false,
ADD COLUMN equipment_needed TEXT,
ADD COLUMN difficulty_reason TEXT,
ADD COLUMN target_duration_seconds INTEGER;

-- Add comments to columns for documentation
COMMENT ON COLUMN public.exercises.alternative_for IS 'Points to the exercise this is an alternative for';
COMMENT ON COLUMN public.exercises.is_alternative IS 'True if this exercise is meant as an alternative to another';
COMMENT ON COLUMN public.exercises.equipment_needed IS 'Equipment required for this exercise (null if bodyweight only)';
COMMENT ON COLUMN public.exercises.difficulty_reason IS 'Explanation of why this exercise might be challenging';
COMMENT ON COLUMN public.exercises.target_duration_seconds IS 'Target duration in seconds for time-based exercises';

-- Update existing exercises with duration targets for time-based exercises
UPDATE public.exercises SET target_duration_seconds = 30 WHERE name IN ('Plank', 'Side Plank', 'Wall Sits', 'L-sit Hold', 'Hollow Body Hold');
UPDATE public.exercises SET target_duration_seconds = 15 WHERE name IN ('Modified Plank', 'Dead Bug', 'Child''s Pose');
UPDATE public.exercises SET target_duration_seconds = 45 WHERE name IN ('Reverse Plank', 'Superman');

-- Add difficulty reasons for exercises that commonly need alternatives
UPDATE public.exercises SET difficulty_reason = 'Requires pull-up bar or equivalent' WHERE category = 'pull' AND name LIKE '%Pull-ups%';
UPDATE public.exercises SET difficulty_reason = 'High upper body strength requirement' WHERE name IN ('One-arm Push-ups', 'Handstand Push-ups', 'Diamond Push-ups');
UPDATE public.exercises SET difficulty_reason = 'Requires significant balance and ankle mobility' WHERE name LIKE '%Pistol%';
UPDATE public.exercises SET difficulty_reason = 'Very high core strength requirement' WHERE name IN ('Dragon Flags', 'L-sit Hold', 'Front Lever');
UPDATE public.exercises SET difficulty_reason = 'Requires explosive power' WHERE name LIKE '%Jump%' OR name LIKE '%Explosive%';

-- Create alternative exercise relationships
-- Push alternatives for those who struggle with standard push-ups
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions, alternative_for, is_alternative) 
SELECT 
    'Wall Push-ups (Alternative)', 
    'Easier alternative for those who cannot do standard push-ups', 
    'push', 
    1.5, 
    1, 
    ARRAY['chest', 'triceps', 'shoulders'], 
    'Stand arms length from wall, push against wall instead of ground',
    id,
    true
FROM public.exercises WHERE name = 'Standard Push-ups';

-- Pull alternatives for those without pull-up equipment
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions, alternative_for, is_alternative, equipment_needed) 
SELECT 
    'Towel Door Rows (Alternative)', 
    'Pull exercise using towel and door, no pull-up bar needed', 
    'pull', 
    3.0, 
    2, 
    ARRAY['back', 'biceps'], 
    'Wrap towel around door handle, lean back and pull body toward door',
    id,
    true,
    'towel, sturdy door'
FROM public.exercises WHERE name = 'Standard Pull-ups';

-- Squat alternatives for those with knee issues
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions, alternative_for, is_alternative) 
SELECT 
    'Chair Squats (Alternative)', 
    'Safer squat alternative for those with knee concerns', 
    'squat', 
    2.0, 
    1, 
    ARRAY['quadriceps', 'glutes'], 
    'Use chair for support and depth guide, focus on controlled movement',
    id,
    true
FROM public.exercises WHERE name = 'Bodyweight Squats';

-- Core alternatives for those with lower back issues
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions, alternative_for, is_alternative) 
SELECT 
    'Standing Core Marches (Alternative)', 
    'Standing core exercise for those who cannot lie on ground', 
    'core', 
    2.0, 
    1, 
    ARRAY['core'], 
    'Stand with good posture, lift knees alternately engaging core',
    id,
    true
FROM public.exercises WHERE name = 'Plank';

-- Create an index for faster alternative lookups
CREATE INDEX idx_exercises_alternative_for ON public.exercises(alternative_for) WHERE alternative_for IS NOT NULL;
CREATE INDEX idx_exercises_is_alternative ON public.exercises(is_alternative) WHERE is_alternative = true;

-- Add a function to get alternatives for an exercise
CREATE OR REPLACE FUNCTION get_exercise_alternatives(exercise_id UUID)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    difficulty_level NUMERIC,
    instructions TEXT,
    equipment_needed TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.description,
        e.difficulty_level,
        e.instructions,
        e.equipment_needed
    FROM public.exercises e
    WHERE e.alternative_for = exercise_id
    ORDER BY e.difficulty_level ASC;
END;
$$ LANGUAGE plpgsql;