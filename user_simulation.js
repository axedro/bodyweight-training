#!/usr/bin/env node

/**
 * User Simulation Script - 6 months of realistic bodyweight training  
 * Simulates a real user interacting with Edge Functions
 * Creates routines, provides realistic feedback, tracks progression
 */

// Use global fetch (Node 18+) or polyfill
if (!globalThis.fetch) {
  const { default: fetch } = await import('node-fetch');
  globalThis.fetch = fetch;
}

const SUPABASE_URL = 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Test user credentials (will create if doesn't exist)
const TEST_USER = {
  email: 'test.simulation@bodyweight.app',
  password: 'simulation123',
  profile: {
    age: 28,
    weight: 75.0,
    height: 175.0,
    fitness_level: 'beginner',
    experience_years: 0,
    available_days_per_week: 3,
    preferred_session_duration: 30,
    preferred_intensity: 0.7
  }
};

// Simulation parameters
const SIMULATION_CONFIG = {
  startDate: '2025-03-01', // Start 6 months ago
  endDate: '2025-09-04',   // Today
  sessionsPerWeek: 3,
  realismFactor: 0.85 // 85% completion rate on average
};

class UserSimulator {
  constructor() {
    this.accessToken = null;
    this.userId = null;
    this.currentICA = 0.8; // Starting ICA
    this.sessionCount = 0;
    this.progressionTrend = 'improving'; // improving, stable, declining
    this.fatigueFactor = 1.0; // Affects performance
  }

  // Helper function to make authenticated requests
  async apiRequest(endpoint, method = 'POST', body = null) {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Client-Info': 'simulation-script/1.0.0'
      },
      body: body ? JSON.stringify(body) : null
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API request failed: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  // Authenticate or create user
  async authenticate() {
    console.log('🔐 Authenticating simulation user...');
    
    // Try to sign in first
    const signInResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (signInResponse.ok) {
      const authData = await signInResponse.json();
      this.accessToken = authData.access_token;
      this.userId = authData.user.id;
      console.log('✅ Signed in existing user:', this.userId);
      return;
    }

    // If sign in failed, create new user
    const signUpResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (!signUpResponse.ok) {
      throw new Error('Failed to create simulation user');
    }

    const authData = await signUpResponse.json();
    this.accessToken = authData.access_token;
    this.userId = authData.user.id;

    console.log('✅ Created new user:', this.userId);

    // Update profile
    await this.updateProfile();
  }

  // Update user profile with simulation data
  async updateProfile() {
    console.log('📝 Updating user profile...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${this.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        ...TEST_USER.profile,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Profile update failed:', response.status, errorText);
      throw new Error(`Failed to update profile: ${errorText}`);
    } else {
      console.log('✅ Profile updated successfully');
    }
  }

  // Generate realistic performance based on user progression
  generateRealisticPerformance(sessionDate, exerciseCount) {
    const daysSinceStart = Math.floor((new Date(sessionDate) - new Date(SIMULATION_CONFIG.startDate)) / (1000 * 60 * 60 * 24));
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    
    // Base performance improves over time
    const progressionMultiplier = Math.min(1.5, 1.0 + (weeksSinceStart * 0.02)); // 2% improvement per week, max 50%
    
    // Random variation for realism
    const variation = 0.8 + (Math.random() * 0.4); // 80% to 120%
    
    // Fatigue affects performance
    const performanceBase = SIMULATION_CONFIG.realismFactor * progressionMultiplier * variation * this.fatigueFactor;
    
    // Completion rate with some sessions being missed or cut short
    const completionRate = Math.max(0.3, Math.min(1.0, performanceBase + (Math.random() - 0.5) * 0.2));
    
    // RPE tends to be higher early on, lower as fitness improves
    const baseRPE = Math.max(4, Math.min(9, 8 - (weeksSinceStart * 0.1) + (Math.random() - 0.5) * 2));
    
    // Technical quality improves over time
    const baseTechnicalQuality = Math.max(2, Math.min(5, 2.5 + (weeksSinceStart * 0.05) + (Math.random() - 0.5) * 0.5));
    
    // Adjust fatigue factor for next session
    if (completionRate > 0.9 && baseRPE < 6) {
      this.fatigueFactor = Math.min(1.1, this.fatigueFactor + 0.05); // Getting stronger
    } else if (completionRate < 0.7 || baseRPE > 8) {
      this.fatigueFactor = Math.max(0.7, this.fatigueFactor - 0.1); // Need recovery
    }

    return {
      completion_rate: Math.round(completionRate * 100) / 100,
      rpe_reported: Math.round(baseRPE),
      technical_quality: Math.round(baseTechnicalQuality),
      enjoyment_level: Math.round(3 + Math.random() * 2), // 3-5
      recovery_feeling: Math.round(3 + Math.random() * 2), // 3-5
      actual_duration: Math.round((20 + Math.random() * 20) * completionRate) // 20-40 minutes based on completion
    };
  }

  // Simulate a single training session
  async simulateSession(sessionDate) {
    try {
      console.log(`\n🏋️ Simulating session for ${sessionDate}...`);

      // Step 1: Calculate current ICA
      console.log('📊 Calculating ICA...');
      const icaResult = await this.apiRequest('calculate-ica');
      this.currentICA = icaResult.ica || this.currentICA;
      console.log(`Current ICA: ${this.currentICA.toFixed(3)}`);

      // Step 2: Generate routine
      console.log('🎯 Generating routine...');
      const routineResponse = await this.apiRequest('generate-routine', 'POST', {
        preferences: {
          duration: TEST_USER.profile.preferred_duration,
          intensity: TEST_USER.profile.preferred_intensity,
          focus_areas: ['strength', 'endurance']
        }
      });

      // Handle different response formats
      let routine, sessionId;
      
      if (routineResponse.trainingPlan?.current_session) {
        routine = routineResponse.trainingPlan.current_session;
        sessionId = routine.id;
      } else if (routineResponse.session) {
        routine = routineResponse.session;
        sessionId = routine.id;
      } else if (routineResponse.id) {
        routine = routineResponse;
        sessionId = routine.id;
      }
      
      if (!sessionId) {
        throw new Error(`No session ID found in response structure`);
      }

      const exerciseCount = (routine.warm_up?.length || 0) + (routine.exercise_blocks?.length || 0) + (routine.cool_down?.length || 0);
      console.log(`Generated routine with ${exerciseCount} exercises, Session ID: ${sessionId}`);

      // Step 3: Simulate realistic performance
      const performance = this.generateRealisticPerformance(sessionDate, exerciseCount);
      console.log(`Performance: ${Math.round(performance.completion_rate * 100)}% completion, RPE: ${performance.rpe_reported}, Quality: ${performance.technical_quality}`);

      // Step 4: Submit session feedback
      console.log('💾 Submitting session feedback...');
      await this.apiRequest('save-session-feedback', 'POST', {
        sessionId,
        feedback: performance
      });

      this.sessionCount++;
      console.log(`✅ Session ${this.sessionCount} completed successfully`);

      // Simulate rest days
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between sessions

      return {
        sessionId,
        date: sessionDate,
        performance,
        exerciseCount,
        ica: this.currentICA
      };

    } catch (error) {
      console.error(`❌ Session failed for ${sessionDate}:`, error.message);
      return null;
    }
  }

  // Generate training schedule (3x per week, realistic gaps)
  generateTrainingSchedule() {
    const schedule = [];
    const startDate = new Date(SIMULATION_CONFIG.startDate);
    const endDate = new Date(SIMULATION_CONFIG.endDate);
    
    let currentDate = new Date(startDate);
    let sessionsThisWeek = 0;
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday
      
      // Reset weekly counter on Monday
      if (dayOfWeek === 1) {
        sessionsThisWeek = 0;
      }
      
      // Train on Mon/Wed/Fri typically, with some variation
      const shouldTrain = (
        (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5) && // Mon/Wed/Fri
        sessionsThisWeek < SIMULATION_CONFIG.sessionsPerWeek &&
        Math.random() > 0.15 // 15% chance of skipping (realistic)
      );
      
      if (shouldTrain) {
        schedule.push(currentDate.toISOString().split('T')[0]);
        sessionsThisWeek++;
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return schedule;
  }

  // Run complete simulation
  async runSimulation() {
    console.log('🚀 Starting 6-month user simulation...');
    console.log(`📅 Period: ${SIMULATION_CONFIG.startDate} to ${SIMULATION_CONFIG.endDate}`);
    console.log(`🎯 Target: ${SIMULATION_CONFIG.sessionsPerWeek} sessions/week\n`);

    try {
      // Authenticate
      await this.authenticate();

      // Generate training schedule
      const trainingDays = this.generateTrainingSchedule();
      console.log(`📋 Generated ${trainingDays.length} training sessions over ${Math.floor(trainingDays.length / SIMULATION_CONFIG.sessionsPerWeek)} weeks\n`);

      const results = [];
      
      // Simulate each session
      for (let i = 0; i < trainingDays.length; i++) {
        const sessionDate = trainingDays[i];
        const result = await this.simulateSession(sessionDate);
        
        if (result) {
          results.push(result);
        }

        // Progress indicator
        if ((i + 1) % 10 === 0) {
          console.log(`\n📈 Progress: ${i + 1}/${trainingDays.length} sessions (${Math.round((i + 1) / trainingDays.length * 100)}%)`);
          console.log(`Current stats: ICA: ${this.currentICA.toFixed(3)}, Fatigue: ${this.fatigueFactor.toFixed(2)}\n`);
        }
      }

      console.log('\n🎉 Simulation completed successfully!');
      console.log(`📊 Final Stats:`);
      console.log(`  • Total sessions: ${results.length}`);
      console.log(`  • Success rate: ${Math.round(results.length / trainingDays.length * 100)}%`);
      console.log(`  • Final ICA: ${this.currentICA.toFixed(3)}`);
      console.log(`  • Average completion: ${Math.round(results.reduce((sum, r) => sum + r.performance.completion_rate, 0) / results.length * 100)}%`);
      console.log(`  • Average RPE: ${Math.round(results.reduce((sum, r) => sum + r.performance.rpe_reported, 0) / results.length * 10) / 10}`);

      return results;

    } catch (error) {
      console.error('💥 Simulation failed:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const simulator = new UserSimulator();
  try {
    await simulator.runSimulation();
    console.log('\n✨ Simulation complete! Check database tables for results.');
    process.exit(0);
  } catch (error) {
    console.error('Simulation failed:', error);
    process.exit(1);
  }
}

main();