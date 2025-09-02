-- Add missing duration_seconds field to session_exercises
ALTER TABLE session_exercises 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- Add missing sets_completed field to exercise_performance 
ALTER TABLE exercise_performance 
ADD COLUMN IF NOT EXISTS sets_completed INTEGER;

-- Update the comment to clarify the table structure
COMMENT ON TABLE session_exercises IS 'Stores planned and completed exercise data for each session';
COMMENT ON TABLE exercise_performance IS 'Stores detailed performance metrics for muscle group analysis';