/**
 * Bodyweight Training API - JavaScript Examples
 * Routine Generation and Management
 */

// Example 1: Complete Routine Generation Workflow
class BodyweightTrainingClient {
  constructor(supabaseUrl, jwtToken) {
    this.baseUrl = `${supabaseUrl}/functions/v1`;
    this.headers = {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Generate a personalized training routine
  async generateRoutine(options = {}) {
    const { 
      daysToGenerate = 1, 
      biometricData = null,
      preferences = {} 
    } = options;

    const payload = { daysToGenerate };
    
    if (biometricData) {
      payload.biometricData = biometricData;
    }

    try {
      const response = await fetch(`${this.baseUrl}/generate-routine`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Routine generated successfully:', result.trainingPlan);
      return result;
    } catch (error) {
      console.error('❌ Failed to generate routine:', error);
      throw error;
    }
  }

  // Get latest biometric data before generating routine
  async getLatestBiometrics() {
    try {
      const response = await fetch(`${this.baseUrl}/get-latest-biometrics`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const biometrics = await response.json();
      console.log('📊 Latest biometrics:', biometrics);
      return biometrics;
    } catch (error) {
      console.error('❌ Failed to get biometrics:', error);
      throw error;
    }
  }

  // Get current active routine
  async getCurrentRoutine() {
    try {
      const response = await fetch(`${this.baseUrl}/get-current-routine`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🏋️ Current routine:', result.routine);
      return result.routine;
    } catch (error) {
      console.error('❌ Failed to get current routine:', error);
      throw error;
    }
  }

  // Calculate current ICA score
  async calculateICA() {
    try {
      const response = await fetch(`${this.baseUrl}/calculate-ica`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icaData = await response.json();
      console.log('🧠 ICA Score:', icaData.ica_score, 'Recommendations:', icaData.recommendations);
      return icaData;
    } catch (error) {
      console.error('❌ Failed to calculate ICA:', error);
      throw error;
    }
  }

  // Save session feedback after workout completion
  async saveSessionFeedback(sessionId, feedback, exercisePerformance = []) {
    const payload = {
      sessionId,
      feedback,
    };

    if (exercisePerformance.length > 0) {
      payload.exercisePerformance = exercisePerformance;
    }

    try {
      const response = await fetch(`${this.baseUrl}/save-session-feedback`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('💾 Session feedback saved:', result);
      
      // Log progression updates
      if (result.session.updated_progressions) {
        result.session.updated_progressions.forEach(progression => {
          console.log(`📈 ${progression.progression_triggered ? 'LEVEL UP!' : 'Maintained'} ${progression.exercise_id}: Level ${progression.old_level} → ${progression.new_level}`);
        });
      }
      
      return result;
    } catch (error) {
      console.error('❌ Failed to save session feedback:', error);
      throw error;
    }
  }

  // Analyze muscle group balance
  async analyzeMuscleGroups() {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-muscle-groups`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const analysis = await response.json();
      console.log('💪 Muscle Group Analysis:', analysis);
      
      // Log imbalances
      analysis.muscle_group_analyses.forEach(group => {
        if (group.imbalance_score > 30) {
          console.log(`⚠️ Imbalance detected in ${group.muscle_group}: ${group.imbalance_score.toFixed(1)}%`);
        }
      });
      
      return analysis;
    } catch (error) {
      console.error('❌ Failed to analyze muscle groups:', error);
      throw error;
    }
  }

  // Analyze training evolution over time
  async analyzeEvolution() {
    try {
      const response = await fetch(`${this.baseUrl}/analyze-evolution`, {
        method: 'POST',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const evolution = await response.json();
      console.log('📈 Evolution Analysis:', evolution);
      
      // Log key insights
      console.log(`🎯 Current ICA: ${evolution.ica_evolution.current_ica} (${evolution.ica_evolution.trend})`);
      console.log(`🏆 Overall Progress: ${evolution.overall_progress.score.toFixed(2)} - ${evolution.overall_progress.classification}`);
      
      return evolution;
    } catch (error) {
      console.error('❌ Failed to analyze evolution:', error);
      throw error;
    }
  }
}

// Usage Examples

async function example1_BasicRoutineGeneration() {
  console.log('\n=== Example 1: Basic Routine Generation ===');
  
  const client = new BodyweightTrainingClient(
    'https://your-project.supabase.co',
    'your-jwt-token'
  );

  try {
    // Generate a basic routine
    const routine = await client.generateRoutine();
    console.log(`Generated ${routine.trainingPlan.current_session.exercise_blocks.length} exercises`);
  } catch (error) {
    console.error('Example 1 failed:', error.message);
  }
}

async function example2_RoutineWithBiometrics() {
  console.log('\n=== Example 2: Routine Generation with Biometric Data ===');
  
  const client = new BodyweightTrainingClient(
    'https://your-project.supabase.co',
    'your-jwt-token'
  );

  try {
    // Generate routine with current biometric state
    const routine = await client.generateRoutine({
      daysToGenerate: 1,
      biometricData: {
        weight: 75.5,
        body_fat_percentage: 18.0,
        resting_hr: 65,
        training_hr_avg: 145,
        sleep_hours: 7.0,
        sleep_quality: 3,  // Poor sleep
        fatigue_level: 4   // High fatigue
      }
    });

    console.log('Routine adapted for current state:');
    console.log(`- Duration: ${routine.trainingPlan.current_session.duration_minutes} minutes`);
    console.log(`- Intensity: ${routine.trainingPlan.current_session.intensity}`);
    console.log('- Algorithm recommendations:', routine.trainingPlan.recommendations);
  } catch (error) {
    console.error('Example 2 failed:', error.message);
  }
}

async function example3_CompleteWorkoutFlow() {
  console.log('\n=== Example 3: Complete Workout Flow ===');
  
  const client = new BodyweightTrainingClient(
    'https://your-project.supabase.co',
    'your-jwt-token'
  );

  try {
    // Step 1: Check current routine
    let routine = await client.getCurrentRoutine();
    
    if (!routine) {
      console.log('No active routine found, generating new one...');
      
      // Step 2: Get latest biometrics
      const biometrics = await client.getLatestBiometrics();
      
      // Step 3: Generate new routine with biometrics
      const newRoutine = await client.generateRoutine({
        biometricData: {
          ...biometrics,
          sleep_hours: 7.5,    // Update current sleep
          sleep_quality: 4,    // Update current sleep quality
          fatigue_level: 2     // Update current fatigue
        }
      });
      
      routine = newRoutine.trainingPlan.current_session;
    }

    console.log(`Starting workout: ${routine.exercise_blocks.length} main exercises`);

    // Step 4: Simulate workout completion with detailed feedback
    const sessionFeedback = {
      rpe_reported: 7,        // Felt challenging but manageable
      completion_rate: 0.9,   // Completed 90% of planned work
      technical_quality: 4,   // Good form throughout
      enjoyment_level: 4,     // Enjoyed the workout
      recovery_feeling: 3,    // Moderate recovery feeling
      actual_duration: 35     // Took 35 minutes
    };

    // Detailed per-exercise performance
    const exercisePerformance = routine.exercise_blocks.map((block, index) => ({
      sessionExerciseId: block.session_exercise_id,
      exerciseId: block.exercise.id,
      setNumber: 1,
      repsCompleted: Math.floor(block.reps * 0.9), // Completed 90% of planned reps
      rpeReported: 7,
      techniqueQuality: 4,
      restTimeActual: block.rest_seconds + 10, // Took slightly longer rest
      difficultyPerceived: 6
    }));

    // Step 5: Save comprehensive feedback
    const feedbackResult = await client.saveSessionFeedback(
      routine.id,
      sessionFeedback,
      exercisePerformance
    );

    console.log('Workout completed and feedback saved!');
    console.log('Progression updates:', feedbackResult.session.updated_progressions?.length || 0);

  } catch (error) {
    console.error('Example 3 failed:', error.message);
  }
}

async function example4_AnalyticsAndInsights() {
  console.log('\n=== Example 4: Analytics and Insights ===');
  
  const client = new BodyweightTrainingClient(
    'https://your-project.supabase.co',
    'your-jwt-token'
  );

  try {
    // Get current ability score
    const ica = await client.calculateICA();
    console.log(`Your current ability score: ${ica.ica_score}/5.0`);
    console.log(`Adherence rate: ${(ica.adherence_rate * 100).toFixed(1)}%`);
    console.log(`Recovery factor: ${(ica.recovery_factor * 100).toFixed(1)}%`);

    // Analyze muscle group balance
    const muscleAnalysis = await client.analyzeMuscleGroups();
    console.log(`\nMuscle groups trained: ${muscleAnalysis.summary.total_muscle_groups_trained}`);
    console.log(`Most trained: ${muscleAnalysis.summary.most_trained}`);
    console.log(`Balance score: ${(muscleAnalysis.summary.overall_balance_score * 100).toFixed(1)}%`);

    // Get evolution insights
    const evolution = await client.analyzeEvolution();
    console.log(`\nICA trend: ${evolution.ica_evolution.trend}`);
    console.log(`Predicted ICA in 4 weeks: ${evolution.ica_evolution.prediction_4_weeks}`);
    console.log(`Overall progress: ${evolution.overall_progress.classification}`);
    
    // Show top recommendations
    console.log('\nTop recommendations:');
    evolution.overall_progress.recommendations.slice(0, 3).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });

  } catch (error) {
    console.error('Example 4 failed:', error.message);
  }
}

async function example5_ErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===');
  
  const client = new BodyweightTrainingClient(
    'https://your-project.supabase.co',
    'invalid-jwt-token'  // Intentionally invalid token
  );

  try {
    await client.generateRoutine();
  } catch (error) {
    if (error.message.includes('401')) {
      console.log('🔐 Authentication error detected - refresh token needed');
    } else if (error.message.includes('429')) {
      console.log('⏰ Rate limit exceeded - need to wait');
    } else {
      console.log('❌ Other error:', error.message);
    }
  }
}

// Advanced Usage: Custom Retry Logic
class AdvancedBodyweightClient extends BodyweightTrainingClient {
  constructor(supabaseUrl, jwtToken, options = {}) {
    super(supabaseUrl, jwtToken);
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  async makeRequest(url, options, retries = 0) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        if (response.status === 429 && retries < this.maxRetries) {
          console.log(`⏰ Rate limited, retrying in ${this.retryDelay}ms... (${retries + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, retries)));
          return this.makeRequest(url, options, retries + 1);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      if (retries < this.maxRetries && !error.message.includes('401')) {
        console.log(`🔄 Request failed, retrying... (${retries + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.makeRequest(url, options, retries + 1);
      }
      throw error;
    }
  }

  async generateRoutine(options = {}) {
    const { daysToGenerate = 1, biometricData = null } = options;
    const payload = { daysToGenerate };
    if (biometricData) payload.biometricData = biometricData;

    return this.makeRequest(`${this.baseUrl}/generate-routine`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });
  }
}

// Run examples (uncomment to test)
// example1_BasicRoutineGeneration();
// example2_RoutineWithBiometrics();
// example3_CompleteWorkoutFlow();
// example4_AnalyticsAndInsights();
// example5_ErrorHandling();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    BodyweightTrainingClient, 
    AdvancedBodyweightClient 
  };
}