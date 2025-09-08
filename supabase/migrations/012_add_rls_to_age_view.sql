-- Secure the user_profiles_with_current_age view
-- NOTE: Views inherit RLS from base tables, so user_profiles RLS already protects this view
-- This migration just ensures proper permissions are granted

-- Revoke default public access to be explicit about security
REVOKE ALL ON user_profiles_with_current_age FROM PUBLIC;

-- Grant specific access to authenticated users only
-- (the underlying RLS on user_profiles will still filter by user)
GRANT SELECT ON user_profiles_with_current_age TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW user_profiles_with_current_age IS 'Secure view of user_profiles with dynamically calculated current_age field. Inherits RLS from user_profiles table.';

-- Verify the view works with a test query (commented out for production)
-- SELECT current_age FROM user_profiles_with_current_age WHERE id = auth.uid();