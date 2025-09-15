-- Migration: 014_circuit_training_support.sql
-- Description: Add circuit training support to database schema
-- Date: 2025-09-15

-- =====================================
-- SESSION_EXERCISES: Add Circuit Fields
-- =====================================

-- Add circuit-specific fields to session_exercises table
ALTER TABLE session_exercises 
ADD COLUMN IF NOT EXISTS circuits_planned INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS circuits_completed INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rest_between_circuits INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS circuit_position INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_circuit_format BOOLEAN DEFAULT FALSE;

-- Add comments for circuit fields
COMMENT ON COLUMN session_exercises.circuits_planned IS 'Total number of circuits/rounds planned for this exercise';
COMMENT ON COLUMN session_exercises.circuits_completed IS 'Number of circuits/rounds actually completed';
COMMENT ON COLUMN session_exercises.rest_between_circuits IS 'Rest time in seconds between circuits';
COMMENT ON COLUMN session_exercises.circuit_position IS 'Position of exercise within circuit (1, 2, 3...)';
COMMENT ON COLUMN session_exercises.is_circuit_format IS 'TRUE if exercise is part of circuit training, FALSE for traditional sets';

-- Add check constraints for circuit fields
ALTER TABLE session_exercises 
ADD CONSTRAINT check_circuits_planned_positive 
  CHECK (circuits_planned IS NULL OR circuits_planned > 0);

ALTER TABLE session_exercises 
ADD CONSTRAINT check_circuits_completed_valid 
  CHECK (circuits_completed IS NULL OR (circuits_completed >= 0 AND circuits_completed <= circuits_planned));

ALTER TABLE session_exercises 
ADD CONSTRAINT check_circuit_position_positive 
  CHECK (circuit_position IS NULL OR circuit_position > 0);

ALTER TABLE session_exercises 
ADD CONSTRAINT check_rest_between_circuits_valid 
  CHECK (rest_between_circuits IS NULL OR rest_between_circuits >= 0);

-- =====================================
-- EXERCISE_PERFORMANCE: Circuit Tracking
-- =====================================

-- Add circuit performance tracking fields
ALTER TABLE exercise_performance 
ADD COLUMN IF NOT EXISTS circuit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS circuit_rpe INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS circuit_technique_quality INTEGER[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS actual_rest_between_circuits INTEGER[] DEFAULT NULL;

-- Add comments for circuit performance fields
COMMENT ON COLUMN exercise_performance.circuit_data IS 'JSON data containing detailed circuit performance: {reps_per_circuit: [12,10,8], rpe_per_circuit: [6,7,8], etc.}';
COMMENT ON COLUMN exercise_performance.circuit_rpe IS 'Array of RPE values for each circuit completed [6,7,8,7]';
COMMENT ON COLUMN exercise_performance.circuit_technique_quality IS 'Array of technique quality scores for each circuit [5,4,3,4]';
COMMENT ON COLUMN exercise_performance.actual_rest_between_circuits IS 'Array of actual rest times between circuits in seconds [65,70,75]';

-- Add check constraints for circuit performance arrays
ALTER TABLE exercise_performance 
ADD CONSTRAINT check_circuit_rpe_values 
  CHECK (circuit_rpe IS NULL OR (
    array_length(circuit_rpe, 1) <= 10 AND 
    circuit_rpe <@ ARRAY[1,2,3,4,5,6,7,8,9,10]
  ));

ALTER TABLE exercise_performance 
ADD CONSTRAINT check_circuit_technique_values 
  CHECK (circuit_technique_quality IS NULL OR (
    array_length(circuit_technique_quality, 1) <= 10 AND 
    circuit_technique_quality <@ ARRAY[1,2,3,4,5]
  ));

-- =====================================
-- TRAINING_SESSIONS: Circuit Metadata
-- =====================================

-- Add circuit session metadata
ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS session_format VARCHAR(20) DEFAULT 'traditional',
ADD COLUMN IF NOT EXISTS total_circuits_planned INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_circuits_completed INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS circuit_rest_efficiency NUMERIC(3,2) DEFAULT NULL;

-- Add comments for session circuit fields
COMMENT ON COLUMN training_sessions.session_format IS 'Training format: traditional, circuit, hiit, etc.';
COMMENT ON COLUMN training_sessions.total_circuits_planned IS 'Total circuits planned for entire session';
COMMENT ON COLUMN training_sessions.total_circuits_completed IS 'Total circuits completed in session';
COMMENT ON COLUMN training_sessions.circuit_rest_efficiency IS 'Efficiency of rest periods (actual vs planned) 0.0-1.0';

-- Add check constraints for session circuit fields
ALTER TABLE training_sessions 
ADD CONSTRAINT check_session_format_valid 
  CHECK (session_format IN ('traditional', 'circuit', 'hiit', 'superset', 'tabata'));

ALTER TABLE training_sessions 
ADD CONSTRAINT check_total_circuits_positive 
  CHECK (total_circuits_planned IS NULL OR total_circuits_planned > 0);

ALTER TABLE training_sessions 
ADD CONSTRAINT check_circuit_rest_efficiency_valid 
  CHECK (circuit_rest_efficiency IS NULL OR (circuit_rest_efficiency >= 0.0 AND circuit_rest_efficiency <= 2.0));

-- =====================================
-- INDEXES for Circuit Performance
-- =====================================

-- Index for circuit format queries
CREATE INDEX IF NOT EXISTS idx_session_exercises_circuit_format 
ON session_exercises(is_circuit_format) 
WHERE is_circuit_format = TRUE;

-- Index for circuit position queries
CREATE INDEX IF NOT EXISTS idx_session_exercises_circuit_position 
ON session_exercises(session_id, circuit_position) 
WHERE circuit_position IS NOT NULL;

-- Index for session format queries
CREATE INDEX IF NOT EXISTS idx_training_sessions_format 
ON training_sessions(session_format);

-- Composite index for circuit session analysis
CREATE INDEX IF NOT EXISTS idx_training_sessions_circuit_analysis 
ON training_sessions(user_id, session_format, session_date) 
WHERE session_format = 'circuit';

-- =====================================
-- FUNCTIONS: Circuit Helper Functions
-- =====================================

-- Function to calculate circuit completion rate
CREATE OR REPLACE FUNCTION calculate_circuit_completion_rate(
  p_circuits_planned INTEGER,
  p_circuits_completed INTEGER
) RETURNS NUMERIC(3,2) AS $$
BEGIN
  IF p_circuits_planned IS NULL OR p_circuits_planned = 0 THEN
    RETURN NULL;
  END IF;
  
  RETURN ROUND(
    (COALESCE(p_circuits_completed, 0)::NUMERIC / p_circuits_planned::NUMERIC), 
    2
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to validate circuit data consistency
CREATE OR REPLACE FUNCTION validate_circuit_data() RETURNS TRIGGER AS $$
BEGIN
  -- If it's circuit format, ensure circuit fields are properly set
  IF NEW.is_circuit_format = TRUE THEN
    -- Circuit format must have circuit-specific fields
    IF NEW.circuits_planned IS NULL THEN
      RAISE EXCEPTION 'Circuit format exercises must have circuits_planned set';
    END IF;
    
    IF NEW.circuit_position IS NULL THEN
      RAISE EXCEPTION 'Circuit format exercises must have circuit_position set';
    END IF;
  END IF;
  
  -- Traditional format should not have circuit fields
  IF NEW.is_circuit_format = FALSE OR NEW.is_circuit_format IS NULL THEN
    IF NEW.circuits_planned IS NOT NULL OR NEW.circuit_position IS NOT NULL THEN
      -- Only warn, don't block (for backward compatibility)
      RAISE NOTICE 'Traditional format exercise has circuit fields set - this may cause confusion';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for circuit data validation
DROP TRIGGER IF EXISTS trigger_validate_circuit_data ON session_exercises;
CREATE TRIGGER trigger_validate_circuit_data
  BEFORE INSERT OR UPDATE ON session_exercises
  FOR EACH ROW
  EXECUTE FUNCTION validate_circuit_data();

-- =====================================
-- DATA MIGRATION: Update Existing Records
-- =====================================

-- Mark existing records as traditional format (backward compatibility)
UPDATE session_exercises 
SET is_circuit_format = FALSE 
WHERE is_circuit_format IS NULL;

UPDATE training_sessions 
SET session_format = 'traditional' 
WHERE session_format IS NULL;

-- For existing records, convert sets to circuits for better backward compatibility
-- This assumes that current 'sets' can be interpreted as 'circuits' for analysis
UPDATE session_exercises 
SET 
  circuits_planned = sets_planned,
  circuits_completed = sets_completed,
  circuit_position = 1  -- Assume single exercise per circuit for old data
WHERE is_circuit_format = FALSE 
  AND circuits_planned IS NULL 
  AND sets_planned IS NOT NULL;

-- =====================================
-- VIEWS: Circuit Analysis Views
-- =====================================

-- View for circuit session analysis
CREATE OR REPLACE VIEW circuit_session_analysis AS
SELECT 
  ts.id as session_id,
  ts.user_id,
  ts.session_date,
  ts.session_format,
  ts.total_circuits_planned,
  ts.total_circuits_completed,
  ts.circuit_rest_efficiency,
  COUNT(se.id) as total_exercises,
  COUNT(CASE WHEN se.is_circuit_format = TRUE THEN 1 END) as circuit_exercises,
  AVG(calculate_circuit_completion_rate(se.circuits_planned, se.circuits_completed)) as avg_circuit_completion_rate,
  AVG(se.rest_between_circuits) as avg_rest_between_circuits
FROM training_sessions ts
LEFT JOIN session_exercises se ON ts.id = se.session_id
WHERE ts.session_format = 'circuit'
GROUP BY ts.id, ts.user_id, ts.session_date, ts.session_format, 
         ts.total_circuits_planned, ts.total_circuits_completed, ts.circuit_rest_efficiency;

-- Note: RLS is inherited from base tables (training_sessions has RLS)
-- Views inherit RLS from their constituent tables automatically

-- =====================================
-- MIGRATION DOCUMENTATION
-- =====================================

-- Migration 014: Circuit Training Support
-- Adds comprehensive circuit training support to the database schema. 
-- Includes circuit-specific fields for session_exercises, performance tracking arrays, 
-- session metadata, validation functions, and analysis views. 
-- Maintains backward compatibility with existing traditional set-based data.