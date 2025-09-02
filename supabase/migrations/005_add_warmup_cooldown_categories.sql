-- Add warmup and cooldown categories to the exercise_category enum

-- Add new values to the exercise_category enum
ALTER TYPE exercise_category ADD VALUE 'warmup';
ALTER TYPE exercise_category ADD VALUE 'cooldown';

-- Update the comment to reflect the new categories
COMMENT ON TYPE exercise_category IS 'Exercise categories: push, pull, squat, hinge, core, locomotion, warmup, cooldown';