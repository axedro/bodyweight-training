-- Add missing columns to session_exercises table for better workout tracking

ALTER TABLE public.session_exercises 
ADD COLUMN block_order INTEGER,
ADD COLUMN block_type TEXT CHECK (block_type IN ('warmup', 'main', 'cooldown')),
ADD COLUMN rest_seconds INTEGER DEFAULT 60,
ADD COLUMN target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10);

-- Update existing records with default values
UPDATE public.session_exercises 
SET 
    block_order = 1,
    block_type = 'main',
    rest_seconds = 60,
    target_rpe = 7
WHERE block_order IS NULL;

-- Make block_order and block_type NOT NULL after setting defaults
ALTER TABLE public.session_exercises 
ALTER COLUMN block_order SET NOT NULL,
ALTER COLUMN block_type SET NOT NULL;

-- Create index for better query performance
CREATE INDEX idx_session_exercises_block_order ON public.session_exercises(session_id, block_order);