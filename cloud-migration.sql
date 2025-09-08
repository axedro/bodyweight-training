-- =============================================
-- MIGRATION SCRIPT FOR SUPABASE CLOUD
-- Project: axceopptditbopbmoomh
-- Execute in Dashboard > SQL Editor
-- =============================================

-- Create function to calculate current age from birth_date
CREATE OR REPLACE FUNCTION calculate_current_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN birth_date IS NULL THEN NULL
    ELSE DATE_PART('year', AGE(CURRENT_DATE, birth_date))::INTEGER
  END;
END;
$$ LANGUAGE plpgsql;

-- Create a view for user profiles with dynamically calculated age
CREATE OR REPLACE VIEW user_profiles_with_current_age AS
SELECT 
  *,
  calculate_current_age(birth_date) as current_age
FROM public.user_profiles;

-- Grant permissions
GRANT SELECT ON user_profiles_with_current_age TO authenticated;

-- Add comment
COMMENT ON FUNCTION calculate_current_age(DATE) IS 'Calculates current age from birth date, handles NULL values gracefully';

-- =============================================
-- VERIFICATION QUERIES
-- =============================================
-- Run these to test the migration:

-- Test the function
SELECT calculate_current_age('1995-06-15'::date) as test_age_30,
       calculate_current_age('1990-01-01'::date) as test_age_35;

-- Test the view (if you have user data)
-- SELECT id, email, birth_date, age, current_age 
-- FROM user_profiles_with_current_age 
-- LIMIT 3;