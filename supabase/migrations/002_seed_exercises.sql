-- Seed exercises based on the adaptive algorithm progression system

-- PUSH PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Wall Push-ups', 'Push-ups against a wall for beginners', 'push', 1.5, 1, ARRAY['chest', 'triceps', 'shoulders'], 'Stand facing a wall, place hands on wall at shoulder height, perform push-up motion'),
('Incline Push-ups', 'Push-ups with hands elevated on a surface', 'push', 2.5, 2, ARRAY['chest', 'triceps', 'shoulders'], 'Place hands on elevated surface (table, chair), perform push-ups'),
('Knee Push-ups', 'Push-ups from kneeling position', 'push', 3.0, 3, ARRAY['chest', 'triceps', 'shoulders'], 'Start in kneeling position, hands on ground, perform push-up motion'),
('Standard Push-ups', 'Traditional push-ups from plank position', 'push', 4.5, 4, ARRAY['chest', 'triceps', 'shoulders', 'core'], 'Start in plank position, lower body until chest nearly touches ground, push back up'),
('Diamond Push-ups', 'Push-ups with hands forming diamond shape', 'push', 6.0, 5, ARRAY['chest', 'triceps', 'shoulders'], 'Form diamond shape with hands under chest, perform push-up'),
('Archer Push-ups', 'Push-ups with one arm extended', 'push', 7.5, 6, ARRAY['chest', 'triceps', 'shoulders'], 'Start in wide push-up position, shift weight to one side during descent'),
('One-arm Push-ups', 'Push-ups using only one arm', 'push', 9.0, 7, ARRAY['chest', 'triceps', 'shoulders', 'core'], 'Perform push-up using only one arm, other arm behind back');

-- PULL PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Assisted Pull-ups', 'Pull-ups with assistance (band or partner)', 'pull', 2.0, 1, ARRAY['back', 'biceps'], 'Use resistance band or partner assistance to perform pull-ups'),
('Negative Pull-ups', 'Slow descent from pull-up position', 'pull', 3.5, 2, ARRAY['back', 'biceps'], 'Jump to pull-up position, slowly lower yourself down'),
('Australian Pull-ups', 'Pull-ups with body horizontal', 'pull', 4.0, 3, ARRAY['back', 'biceps'], 'Set up bar at waist height, pull body up while keeping it straight'),
('Standard Pull-ups', 'Traditional pull-ups from dead hang', 'pull', 5.5, 4, ARRAY['back', 'biceps'], 'Hang from bar, pull body up until chin over bar'),
('Wide Pull-ups', 'Pull-ups with wide grip', 'pull', 6.5, 5, ARRAY['back', 'biceps'], 'Use wider than shoulder-width grip for pull-ups'),
('L-sit Pull-ups', 'Pull-ups with legs extended forward', 'pull', 7.5, 6, ARRAY['back', 'biceps', 'core'], 'Perform pull-ups while keeping legs straight and extended forward'),
('One-arm Pull-ups', 'Pull-ups using only one arm', 'pull', 9.0, 7, ARRAY['back', 'biceps'], 'Perform pull-up using only one arm');

-- SQUAT PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Assisted Squats', 'Squats with support (wall or chair)', 'squat', 1.5, 1, ARRAY['quadriceps', 'glutes'], 'Hold onto wall or chair for support while performing squats'),
('Bodyweight Squats', 'Standard bodyweight squats', 'squat', 2.5, 2, ARRAY['quadriceps', 'glutes'], 'Stand with feet shoulder-width apart, squat down and back up'),
('Pistol Squats (Assisted)', 'Single-leg squats with assistance', 'squat', 4.0, 3, ARRAY['quadriceps', 'glutes'], 'Hold onto support while performing single-leg squats'),
('Pistol Squats', 'Single-leg squats without assistance', 'squat', 6.5, 4, ARRAY['quadriceps', 'glutes', 'core'], 'Perform squats on one leg, other leg extended forward'),
('Jump Squats', 'Explosive squats with jump', 'squat', 5.0, 5, ARRAY['quadriceps', 'glutes'], 'Perform squat then explosively jump up'),
('Pistol Squats (Weighted)', 'Single-leg squats with added weight', 'squat', 7.5, 6, ARRAY['quadriceps', 'glutes'], 'Hold weight while performing pistol squats'),
('One-legged Box Jumps', 'Jump onto box using one leg', 'squat', 8.5, 7, ARRAY['quadriceps', 'glutes'], 'Jump onto elevated surface using only one leg');

-- HINGE PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Glute Bridges', 'Bridge exercise targeting glutes', 'hinge', 2.0, 1, ARRAY['glutes', 'hamstrings'], 'Lie on back, knees bent, lift hips up'),
('Single-leg Glute Bridges', 'Glute bridges on one leg', 'hinge', 3.5, 2, ARRAY['glutes', 'hamstrings'], 'Perform glute bridge with one leg extended'),
('Good Mornings', 'Hip hinge movement', 'hinge', 4.0, 3, ARRAY['glutes', 'hamstrings', 'lower back'], 'Stand with feet shoulder-width, hinge at hips while keeping back straight'),
('Romanian Deadlifts', 'Hip hinge with bodyweight', 'hinge', 5.0, 4, ARRAY['glutes', 'hamstrings', 'lower back'], 'Stand on one leg, hinge at hips, touch ground with opposite hand'),
('Single-leg Deadlifts', 'Deadlift movement on one leg', 'hinge', 6.5, 5, ARRAY['glutes', 'hamstrings', 'lower back'], 'Stand on one leg, hinge forward while extending other leg back'),
('Nordic Curls', 'Eccentric hamstring curls', 'hinge', 7.5, 6, ARRAY['hamstrings'], 'Kneel on ground, partner holds ankles, slowly lower upper body forward'),
('Single-leg Nordic Curls', 'Nordic curls on one leg', 'hinge', 8.5, 7, ARRAY['hamstrings'], 'Perform Nordic curl using only one leg');

-- CORE PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Planks', 'Static plank hold', 'core', 2.0, 1, ARRAY['core', 'shoulders'], 'Hold plank position with straight body'),
('Side Planks', 'Plank on one side', 'core', 3.0, 2, ARRAY['core', 'obliques'], 'Hold plank position on one side'),
('Crunches', 'Basic abdominal crunches', 'core', 2.5, 3, ARRAY['abs'], 'Lie on back, lift shoulders off ground'),
('Leg Raises', 'Lift legs while lying on back', 'core', 4.0, 4, ARRAY['abs', 'hip flexors'], 'Lie on back, lift straight legs up and down'),
('Hanging Leg Raises', 'Leg raises while hanging from bar', 'core', 6.0, 5, ARRAY['abs', 'hip flexors'], 'Hang from bar, lift legs up to parallel or higher'),
('L-sit Hold', 'Hold L-sit position', 'core', 7.0, 6, ARRAY['abs', 'hip flexors', 'shoulders'], 'Hold body in L-shape with hands on ground or bars'),
('Front Lever', 'Advanced static hold', 'core', 9.0, 7, ARRAY['abs', 'back', 'shoulders'], 'Hold body horizontal while hanging from bar');

-- LOCOMOTION PATTERN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Walking', 'Basic walking', 'locomotion', 1.0, 1, ARRAY['legs', 'cardio'], 'Walk at comfortable pace'),
('Jogging', 'Light running', 'locomotion', 2.5, 2, ARRAY['legs', 'cardio'], 'Run at light pace'),
('Running', 'Moderate running', 'locomotion', 4.0, 3, ARRAY['legs', 'cardio'], 'Run at moderate pace'),
('Sprint Intervals', 'High-intensity running intervals', 'locomotion', 6.0, 4, ARRAY['legs', 'cardio'], 'Alternate between sprinting and walking'),
('Hill Running', 'Running uphill', 'locomotion', 7.0, 5, ARRAY['legs', 'cardio'], 'Run up inclines or hills'),
('Stair Running', 'Running up stairs', 'locomotion', 7.5, 6, ARRAY['legs', 'cardio'], 'Run up and down stairs'),
('Burpees', 'Full body conditioning exercise', 'locomotion', 8.0, 7, ARRAY['full body', 'cardio'], 'Squat, jump back to plank, do push-up, jump forward, jump up');

-- WARM-UP EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Arm Circles', 'Circular arm movements', 'core', 1.0, 1, ARRAY['shoulders'], 'Make circular motions with arms'),
('Hip Circles', 'Circular hip movements', 'core', 1.0, 1, ARRAY['hips'], 'Make circular motions with hips'),
('Jumping Jacks', 'Basic jumping exercise', 'locomotion', 1.5, 1, ARRAY['full body'], 'Jump while moving arms and legs'),
('High Knees', 'Running in place with high knees', 'locomotion', 2.0, 1, ARRAY['legs', 'cardio'], 'Run in place bringing knees up high'),
('Mountain Climbers', 'Dynamic plank exercise', 'core', 2.5, 1, ARRAY['core', 'shoulders'], 'From plank position, alternate bringing knees to chest');

-- COOL-DOWN EXERCISES
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Child''s Pose', 'Gentle stretching pose', 'core', 1.0, 1, ARRAY['back', 'shoulders'], 'Kneel and sit back on heels, stretch arms forward'),
('Cat-Cow Stretch', 'Spinal mobility exercise', 'core', 1.0, 1, ARRAY['back'], 'Alternate between arching and rounding back'),
('Hamstring Stretch', 'Stretch for back of thighs', 'hinge', 1.0, 1, ARRAY['hamstrings'], 'Sit with legs extended, reach for toes'),
('Quad Stretch', 'Stretch for front of thighs', 'squat', 1.0, 1, ARRAY['quadriceps'], 'Stand on one leg, pull other foot to butt'),
('Chest Stretch', 'Stretch for chest muscles', 'push', 1.0, 1, ARRAY['chest'], 'Extend arms back to stretch chest');
