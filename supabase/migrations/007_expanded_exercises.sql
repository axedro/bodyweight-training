-- Expanded exercise database with more options, alternatives, warm-ups, and cool-downs
-- This migration expands the exercise catalog significantly

-- Clear existing exercises first to avoid conflicts
DELETE FROM public.exercises;

-- WARM-UP EXERCISES - Always difficulty_level 1.0, progression_level 1
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Arm Circles', 'Small to large circular arm movements to warm shoulders', 'warmup', 1.0, 1, ARRAY['shoulders'], 'Start with small circles, gradually increase size. 10 forward, 10 backward per arm'),
('Leg Swings', 'Dynamic hip mobility warm-up', 'warmup', 1.0, 1, ARRAY['hips', 'legs'], 'Hold wall for support, swing leg forward/back, then side to side. 10 each direction'),
('Hip Circles', 'Hip mobility and warm-up', 'warmup', 1.0, 1, ARRAY['hips', 'core'], 'Hands on hips, make large circles. 10 each direction'),
('Torso Twists', 'Spinal mobility and core warm-up', 'warmup', 1.0, 1, ARRAY['core', 'obliques'], 'Hands on shoulders, twist left and right. Keep hips facing forward'),
('Jumping Jacks', 'Full body cardiovascular warm-up', 'warmup', 1.0, 1, ARRAY['full body', 'cardio'], 'Jump feet apart while raising arms overhead, return to start'),
('High Knees', 'Dynamic leg warm-up', 'warmup', 1.0, 1, ARRAY['legs', 'cardio'], 'Run in place bringing knees to waist height. Quick, light steps'),
('Butt Kicks', 'Hamstring activation warm-up', 'warmup', 1.0, 1, ARRAY['hamstrings', 'cardio'], 'Run in place kicking heels to glutes. Light, quick motion'),
('Ankle Circles', 'Ankle mobility warm-up', 'warmup', 1.0, 1, ARRAY['ankles'], 'Lift one foot, make circles with ankle. 10 each direction, each foot'),
('Shoulder Rolls', 'Shoulder mobility warm-up', 'warmup', 1.0, 1, ARRAY['shoulders'], 'Roll shoulders backward in large circles. 10 repetitions'),
('Wrist Circles', 'Wrist mobility for push exercises', 'warmup', 1.0, 1, ARRAY['wrists'], 'Extend arms, circle wrists. 10 each direction');

-- PUSH PATTERN EXERCISES - Expanded with more progressions and alternatives
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
-- Beginner Push Progressions
('Wall Push-ups', 'Beginner-friendly push-ups against wall', 'push', 1.5, 1, ARRAY['chest', 'triceps', 'shoulders'], 'Stand arms length from wall, hands flat against wall at shoulder height. Lean in and push back'),
('Elevated Wall Push-ups', 'Wall push-ups with hands higher', 'push', 1.8, 1, ARRAY['chest', 'triceps', 'shoulders'], 'Place hands on wall above head height, perform push-up motion'),
('Table Push-ups', 'Push-ups with hands on table edge', 'push', 2.2, 2, ARRAY['chest', 'triceps', 'shoulders'], 'Hands on sturdy table edge, walk feet back, perform push-ups'),
('Chair Push-ups', 'Push-ups with hands on chair seat', 'push', 2.5, 2, ARRAY['chest', 'triceps', 'shoulders'], 'Hands on stable chair seat, perform inclined push-ups'),
('Knee Push-ups', 'Push-ups from kneeling position', 'push', 3.0, 3, ARRAY['chest', 'triceps', 'shoulders'], 'Kneel on ground, hands shoulder-width apart, maintain straight line from knees to head'),
-- Intermediate Push Progressions
('Standard Push-ups', 'Traditional push-ups from plank position', 'push', 4.5, 4, ARRAY['chest', 'triceps', 'shoulders', 'core'], 'Plank position, lower until chest nearly touches ground, push back up'),
('Wide-grip Push-ups', 'Push-ups with wider hand placement', 'push', 4.7, 4, ARRAY['chest', 'shoulders'], 'Hands wider than shoulders, emphasizes chest muscles'),
('Close-grip Push-ups', 'Push-ups with hands close together', 'push', 5.2, 4, ARRAY['triceps', 'chest'], 'Hands close together under chest, emphasizes triceps'),
('Pike Push-ups', 'Push-ups in downward dog position', 'push', 5.5, 5, ARRAY['shoulders', 'triceps'], 'Downward dog position, lower head toward hands, push back up'),
('Diamond Push-ups', 'Push-ups with hands forming diamond', 'push', 6.0, 5, ARRAY['triceps', 'chest'], 'Make diamond shape with thumbs and fingers, challenging tricep variation'),
-- Advanced Push Progressions
('Archer Push-ups', 'Push-ups shifting weight to one arm', 'push', 7.0, 6, ARRAY['chest', 'triceps', 'shoulders'], 'Wide hand position, shift weight to one arm during descent, alternate sides'),
('Pseudo Planche Push-ups', 'Push-ups with hands positioned lower', 'push', 7.5, 6, ARRAY['chest', 'shoulders', 'core'], 'Hands positioned near ribs, lean forward, very challenging'),
('One-arm Push-ups', 'Push-ups using only one arm', 'push', 9.0, 7, ARRAY['chest', 'triceps', 'shoulders', 'core'], 'One hand behind back, perform push-up with single arm'),
('Handstand Push-ups', 'Push-ups in handstand position against wall', 'push', 9.5, 7, ARRAY['shoulders', 'triceps'], 'Handstand against wall, lower head to ground, push back up'),
-- Push Alternative Exercises (for those who can't do standard push-ups)
('Isometric Chest Press', 'Static chest activation', 'push', 2.0, 2, ARRAY['chest'], 'Press palms together at chest level, hold for time instead of reps'),
('Wall Slides', 'Standing chest and shoulder exercise', 'push', 1.8, 1, ARRAY['chest', 'shoulders'], 'Back against wall, slide arms up and down maintaining contact'),
('Resistance Band Chest Press', 'Chest exercise with resistance band', 'push', 2.5, 2, ARRAY['chest', 'triceps'], 'Use resistance band anchored behind you, press forward');

-- PULL PATTERN EXERCISES - Expanded with alternatives for those without pull-up bar
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
-- Pull Alternatives (no pull-up bar needed)
('Reverse Plank', 'Back strengthening without pull-up bar', 'pull', 2.0, 1, ARRAY['back', 'shoulders'], 'Sit with legs extended, hands behind you, lift hips to make straight line'),
('Superman', 'Back strengthening lying on stomach', 'pull', 2.2, 1, ARRAY['back', 'glutes'], 'Lie face down, lift chest and legs simultaneously, hold briefly'),
('Prone Y-T-W', 'Shoulder and upper back strengthening', 'pull', 2.5, 2, ARRAY['back', 'shoulders'], 'Lie face down, lift arms in Y, T, then W positions'),
('Door Pull-ups', 'Pull-ups using sturdy door', 'pull', 3.0, 2, ARRAY['back', 'biceps'], 'Use door pull-up bar or towel over sturdy door, lean back and pull'),
('Table Rows', 'Rowing under a table', 'pull', 3.2, 2, ARRAY['back', 'biceps'], 'Lie under sturdy table, pull chest to table edge'),
-- Traditional Pull Progressions
('Band-assisted Pull-ups', 'Pull-ups with resistance band assistance', 'pull', 2.8, 1, ARRAY['back', 'biceps'], 'Loop resistance band over bar and under knees/feet for assistance'),
('Negative Pull-ups', 'Eccentric-only pull-ups', 'pull', 3.5, 2, ARRAY['back', 'biceps'], 'Jump to top position, slowly lower down taking 3-5 seconds'),
('Australian Pull-ups', 'Horizontal pull-ups', 'pull', 4.0, 3, ARRAY['back', 'biceps'], 'Bar at waist height, pull chest to bar while body stays straight'),
('Chin-ups', 'Pull-ups with underhand grip', 'pull', 5.0, 3, ARRAY['back', 'biceps'], 'Underhand grip, pull chin over bar, easier than standard pull-ups'),
('Standard Pull-ups', 'Traditional overhand pull-ups', 'pull', 5.5, 4, ARRAY['back', 'biceps'], 'Overhand grip, pull chin over bar, full range of motion'),
('Wide-grip Pull-ups', 'Pull-ups with hands wider than shoulders', 'pull', 6.0, 4, ARRAY['back'], 'Grip wider than shoulders, emphasizes lats'),
('Commando Pull-ups', 'Pull-ups alternating sides of bar', 'pull', 7.0, 5, ARRAY['back', 'biceps', 'core'], 'Pull up to one side of bar, lower, pull to other side'),
('L-sit Pull-ups', 'Pull-ups with legs extended forward', 'pull', 7.5, 6, ARRAY['back', 'biceps', 'core'], 'Hold L-sit position while performing pull-ups'),
('Muscle-ups', 'Pull-up transitioning to dip', 'pull', 8.5, 6, ARRAY['back', 'biceps', 'triceps'], 'Pull up explosively and transition over bar to support position'),
('One-arm Pull-ups', 'Pull-ups using only one arm', 'pull', 9.0, 7, ARRAY['back', 'biceps'], 'Ultimate pulling exercise, one arm only');

-- SQUAT PATTERN EXERCISES - More progressions and alternatives
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
-- Beginner Squat Progressions
('Chair-assisted Squats', 'Squats with chair for support', 'squat', 1.5, 1, ARRAY['quadriceps', 'glutes'], 'Hold chair back for support, squat down and up'),
('Wall Squats', 'Squats with back against wall', 'squat', 1.8, 1, ARRAY['quadriceps', 'glutes'], 'Back against wall, slide down to squat position'),
('Box Squats', 'Squats sitting on box/chair', 'squat', 2.0, 1, ARRAY['quadriceps', 'glutes'], 'Sit on box, stand up without using hands, control descent'),
('Goblet Squats', 'Squats holding weight at chest', 'squat', 2.2, 2, ARRAY['quadriceps', 'glutes', 'core'], 'Hold water bottle/book at chest, perform squat'),
('Bodyweight Squats', 'Standard air squats', 'squat', 2.5, 2, ARRAY['quadriceps', 'glutes'], 'Feet shoulder-width apart, squat down keeping chest up'),
-- Intermediate Squat Progressions  
('Sumo Squats', 'Wide-stance squats', 'squat', 2.8, 2, ARRAY['quadriceps', 'glutes', 'adductors'], 'Wide stance, toes turned out, squat down'),
('Pause Squats', 'Squats with pause at bottom', 'squat', 3.2, 3, ARRAY['quadriceps', 'glutes'], 'Regular squat but pause for 2-3 seconds at bottom'),
('Jump Squats', 'Explosive squats with jump', 'squat', 4.0, 3, ARRAY['quadriceps', 'glutes', 'calves'], 'Squat down, explode up into jump, land softly'),
('Single-leg Box Squats', 'One-legged squats to box', 'squat', 5.0, 4, ARRAY['quadriceps', 'glutes'], 'One leg, sit on box, stand up using same leg'),
('Bulgarian Split Squats', 'Rear-foot-elevated single-leg squats', 'squat', 5.5, 4, ARRAY['quadriceps', 'glutes'], 'Rear foot on chair, squat on front leg'),
-- Advanced Squat Progressions
('Assisted Pistol Squats', 'Single-leg squats with assistance', 'squat', 6.0, 5, ARRAY['quadriceps', 'glutes', 'core'], 'Hold door frame/pole, perform one-legged squat'),
('Pistol Squats', 'Unassisted single-leg squats', 'squat', 7.5, 6, ARRAY['quadriceps', 'glutes', 'core'], 'One leg extended forward, squat on other leg'),
('Shrimp Squats', 'Single-leg squats holding rear foot', 'squat', 8.5, 7, ARRAY['quadriceps', 'glutes', 'core'], 'Hold rear foot while squatting on front leg'),
-- Squat Alternatives
('Wall Sits', 'Isometric squat hold against wall', 'squat', 2.5, 2, ARRAY['quadriceps', 'glutes'], 'Back against wall, slide to squat position and hold'),
('Step-ups', 'Step up onto elevated surface', 'squat', 3.0, 2, ARRAY['quadriceps', 'glutes'], 'Step up onto sturdy chair/box, step down controlled'),
('Lunges', 'Single-leg squat alternative', 'squat', 3.5, 3, ARRAY['quadriceps', 'glutes'], 'Step forward into lunge position, return to start');

-- HINGE PATTERN EXERCISES - More options for posterior chain
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
-- Beginner Hinge Progressions
('Glute Bridges', 'Basic hip bridge', 'hinge', 2.0, 1, ARRAY['glutes', 'hamstrings'], 'Lie on back, knees bent, lift hips up squeezing glutes'),
('Wall Hip Hinges', 'Learn hip hinge pattern against wall', 'hinge', 2.2, 1, ARRAY['glutes', 'hamstrings'], 'Stand close to wall, push hips back to touch wall'),
('Seated Good Mornings', 'Hip hinge while seated', 'hinge', 2.5, 1, ARRAY['glutes', 'hamstrings', 'lower back'], 'Sit on edge of chair, lean forward with straight back'),
('Single-leg Glute Bridges', 'Hip bridge on one leg', 'hinge', 3.2, 2, ARRAY['glutes', 'hamstrings'], 'Bridge position, extend one leg, lift with other'),
('Hip Thrusts', 'Glute bridge with shoulders elevated', 'hinge', 3.5, 2, ARRAY['glutes', 'hamstrings'], 'Shoulders on couch/chair, thrust hips up'),
-- Intermediate Hinge Progressions
('Standing Good Mornings', 'Standing hip hinge movement', 'hinge', 4.0, 3, ARRAY['glutes', 'hamstrings', 'lower back'], 'Hands behind head, hinge at hips keeping back straight'),
('Romanian Deadlifts', 'Single-leg hip hinge', 'hinge', 4.5, 3, ARRAY['glutes', 'hamstrings'], 'Stand on one leg, hinge forward reaching for ground'),
('Single-leg Deadlifts', 'Advanced single-leg hip hinge', 'hinge', 6.0, 4, ARRAY['glutes', 'hamstrings', 'core'], 'Balance on one leg, hinge while extending other leg back'),
('Bird Dogs', 'Core stability hip hinge', 'hinge', 3.0, 2, ARRAY['glutes', 'core', 'back'], 'Hands and knees, extend opposite arm and leg'),
-- Advanced Hinge Progressions
('Broad Jumps', 'Explosive hip hinge jump', 'hinge', 5.5, 5, ARRAY['glutes', 'hamstrings'], 'Hip hinge, explode forward into broad jump'),
('Nordic Curls (Eccentric)', 'Eccentric-only hamstring curls', 'hinge', 7.0, 6, ARRAY['hamstrings'], 'Kneel, slowly lower forward fighting gravity'),
('Nordic Curls (Full)', 'Full eccentric and concentric hamstring curls', 'hinge', 8.5, 7, ARRAY['hamstrings'], 'Kneel, lower forward slowly, pull back up'),
-- Hinge Alternatives
('Reverse Hyperextensions', 'Lying face down leg raises', 'hinge', 3.5, 2, ARRAY['glutes', 'hamstrings'], 'Lie face down on bed edge, lift legs behind you'),
('Dead Bugs', 'Core stability lying exercise', 'hinge', 2.8, 2, ARRAY['core', 'hip flexors'], 'Lie on back, opposite arm and leg movements');

-- CORE EXERCISES - Comprehensive core training
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
-- Beginner Core
('Dead Bug', 'Core stability exercise', 'core', 2.0, 1, ARRAY['abs', 'core'], 'Lie on back, extend opposite arm and leg slowly'),
('Modified Plank', 'Plank from knees', 'core', 2.2, 1, ARRAY['core', 'shoulders'], 'Plank position but on knees instead of toes'),
('Standing Marches', 'Standing core activation', 'core', 1.8, 1, ARRAY['core', 'hip flexors'], 'Standing, alternate lifting knees to waist'),
('Wall Sits', 'Isometric core and leg exercise', 'core', 2.5, 1, ARRAY['core', 'quadriceps'], 'Back against wall, hold squat position'),
('Plank', 'Standard plank hold', 'core', 3.0, 2, ARRAY['core', 'shoulders'], 'Hold plank position maintaining straight line'),
-- Intermediate Core
('Side Plank', 'Lateral core stability', 'core', 3.5, 2, ARRAY['obliques', 'core'], 'Side plank on forearm, hold straight line'),
('Mountain Climbers', 'Dynamic plank variation', 'core', 4.0, 3, ARRAY['core', 'shoulders', 'cardio'], 'Plank position, alternate bringing knees to chest'),
('Bicycle Crunches', 'Dynamic abdominal exercise', 'core', 3.8, 3, ARRAY['abs', 'obliques'], 'Lie on back, bicycle pedaling motion with legs'),
('Russian Twists', 'Rotational core exercise', 'core', 4.2, 3, ARRAY['obliques', 'abs'], 'Seated, lean back, twist side to side'),
('Leg Raises', 'Lower abdominal exercise', 'core', 4.5, 4, ARRAY['abs', 'hip flexors'], 'Lie on back, lift straight legs up and down'),
-- Advanced Core
('Hollow Body Hold', 'Advanced isometric core', 'core', 5.5, 4, ARRAY['abs', 'core'], 'Lie on back, lift shoulders and legs creating hollow shape'),
('V-ups', 'Dynamic hollow body', 'core', 6.0, 5, ARRAY['abs', 'hip flexors'], 'Lie flat, sit up bringing legs and torso together'),
('Hanging Knee Raises', 'Hanging abdominal exercise', 'core', 6.5, 5, ARRAY['abs', 'hip flexors'], 'Hang from bar, lift knees to chest'),
('L-sit Hold', 'Advanced isometric hold', 'core', 7.0, 6, ARRAY['abs', 'shoulders'], 'Support body weight with legs extended forward'),
('Dragon Flags', 'Extremely advanced core exercise', 'core', 8.5, 7, ARRAY['abs', 'core'], 'Lie on back holding anchor, lift and lower body as one unit'),
-- Core Alternatives
('Seated Crunches', 'Crunches while seated', 'core', 2.5, 2, ARRAY['abs'], 'Seated on edge of chair, perform crunching motion'),
('Standing Side Bends', 'Standing oblique exercise', 'core', 2.0, 1, ARRAY['obliques'], 'Stand with hand on hip, bend to side and return');

-- LOCOMOTION EXERCISES - Movement patterns and conditioning
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Marching in Place', 'Basic movement pattern', 'locomotion', 1.0, 1, ARRAY['legs', 'cardio'], 'March in place lifting knees to comfortable height'),
('Walking', 'Basic forward locomotion', 'locomotion', 1.2, 1, ARRAY['legs', 'cardio'], 'Walk at comfortable pace maintaining good posture'),
('Brisk Walking', 'Faster pace walking', 'locomotion', 1.8, 1, ARRAY['legs', 'cardio'], 'Walk at fast pace that slightly elevates heart rate'),
('Bear Crawls', 'Quadrupedal movement', 'locomotion', 3.5, 2, ARRAY['shoulders', 'core', 'legs'], 'Crawl forward on hands and feet, knees off ground'),
('Crab Walk', 'Reverse quadrupedal movement', 'locomotion', 4.0, 2, ARRAY['shoulders', 'glutes', 'triceps'], 'Walk backward on hands and feet, belly up'),
('Duck Walk', 'Low squat walk', 'locomotion', 4.5, 3, ARRAY['quadriceps', 'glutes'], 'Walk forward in deep squat position'),
('Lunging Walk', 'Forward lunge progression', 'locomotion', 5.0, 3, ARRAY['quadriceps', 'glutes'], 'Walking forward with alternating lunges'),
('Burpees', 'Full body conditioning', 'locomotion', 6.0, 4, ARRAY['full body', 'cardio'], 'Squat, jump back to plank, push-up, jump forward, jump up'),
('Bear Crawl to Crab Walk', 'Complex movement pattern', 'locomotion', 7.0, 5, ARRAY['full body'], 'Transition between bear crawl and crab walk'),
('Travelling Burpees', 'Burpees with forward movement', 'locomotion', 8.0, 6, ARRAY['full body', 'cardio'], 'Perform burpees while moving forward');

-- COOL-DOWN AND STRETCHING EXERCISES - Always difficulty_level 1.0, progression_level 1  
INSERT INTO public.exercises (name, description, category, difficulty_level, progression_level, muscle_groups, instructions) VALUES
('Child''s Pose', 'Gentle back and shoulder stretch', 'cooldown', 1.0, 1, ARRAY['back', 'shoulders'], 'Kneel, sit back on heels, extend arms forward on ground'),
('Cat-Cow Stretch', 'Spinal mobility stretch', 'cooldown', 1.0, 1, ARRAY['back', 'spine'], 'Hands and knees, alternate arching and rounding back'),
('Hamstring Stretch (Seated)', 'Stretch back of thighs', 'cooldown', 1.0, 1, ARRAY['hamstrings'], 'Sit with legs extended, gently reach toward toes'),
('Quad Stretch (Standing)', 'Stretch front of thighs', 'cooldown', 1.0, 1, ARRAY['quadriceps'], 'Stand on one leg, pull other foot to glutes'),
('Chest Doorway Stretch', 'Chest and shoulder stretch', 'cooldown', 1.0, 1, ARRAY['chest', 'shoulders'], 'Stand in doorway, place forearms on frame, lean forward'),
('Hip Flexor Stretch', 'Stretch front of hips', 'cooldown', 1.0, 1, ARRAY['hip flexors'], 'Lunge position, push hips forward to stretch rear leg'),
('Pigeon Stretch', 'Deep hip stretch', 'cooldown', 1.0, 1, ARRAY['hips', 'glutes'], 'Sit with one leg in front bent, other leg extended behind'),
('Shoulder Cross Stretch', 'Shoulder flexibility', 'cooldown', 1.0, 1, ARRAY['shoulders'], 'Pull one arm across chest with opposite hand'),
('Neck Rolls', 'Neck mobility', 'cooldown', 1.0, 1, ARRAY['neck'], 'Gently roll head in slow circles, both directions'),
('Ankle Stretches', 'Ankle flexibility', 'cooldown', 1.0, 1, ARRAY['ankles', 'calves'], 'Point and flex feet, circle ankles'),
('Spinal Twist', 'Gentle spinal rotation', 'cooldown', 1.0, 1, ARRAY['spine', 'obliques'], 'Sit with legs extended, twist to one side holding knee'),
('Forward Fold', 'Full body stretch', 'cooldown', 1.0, 1, ARRAY['hamstrings', 'back'], 'Standing or seated, fold forward reaching toward ground'),
('Side Stretch', 'Lateral body stretch', 'cooldown', 1.0, 1, ARRAY['obliques', 'lats'], 'Standing, reach one arm overhead and lean to side'),
('Deep Breathing', 'Relaxation and recovery', 'cooldown', 1.0, 1, ARRAY['respiratory'], 'Sit or lie comfortably, focus on deep, slow breathing');