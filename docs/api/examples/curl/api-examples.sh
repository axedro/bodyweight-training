#!/bin/bash

# Bodyweight Training API - cURL Examples
# Make sure to replace YOUR_PROJECT_URL and YOUR_JWT_TOKEN with actual values

set -e  # Exit on any error

# Configuration
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
JWT_TOKEN="YOUR_JWT_TOKEN"
BASE_URL="${SUPABASE_URL}/functions/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to make requests with proper error handling
make_request() {
    local endpoint=$1
    local method=${2:-POST}
    local data=${3:-}
    
    echo -e "${BLUE}Making ${method} request to ${endpoint}...${NC}"
    
    local cmd="curl -s -w '\n%{http_code}' -X ${method}"
    cmd+=" -H 'Authorization: Bearer ${JWT_TOKEN}'"
    cmd+=" -H 'Content-Type: application/json'"
    
    if [ -n "$data" ]; then
        cmd+=" -d '${data}'"
    fi
    
    cmd+=" '${BASE_URL}${endpoint}'"
    
    # Execute the command and capture response and status code
    local response=$(eval $cmd)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    echo -e "HTTP Status: ${http_code}"
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ Success${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ Error${NC}"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    fi
    
    echo -e "\n${YELLOW}---${NC}\n"
}

echo -e "${BLUE}=== Bodyweight Training API Examples ===${NC}\n"

# Check if required variables are set
if [ "$JWT_TOKEN" = "YOUR_JWT_TOKEN" ] || [ "$SUPABASE_URL" = "https://YOUR_PROJECT.supabase.co" ]; then
    echo -e "${RED}❌ Please update JWT_TOKEN and SUPABASE_URL variables at the top of this script${NC}"
    exit 1
fi

# Example 1: Calculate ICA Score
echo -e "${YELLOW}Example 1: Calculate Current ICA Score${NC}"
make_request "/calculate-ica"

# Example 2: Get Latest Biometrics
echo -e "${YELLOW}Example 2: Get Latest Biometric Data${NC}"
make_request "/get-latest-biometrics"

# Example 3: Generate Basic Routine
echo -e "${YELLOW}Example 3: Generate Basic Training Routine${NC}"
make_request "/generate-routine" "POST" '{
  "daysToGenerate": 1
}'

# Example 4: Generate Routine with Biometric Data
echo -e "${YELLOW}Example 4: Generate Routine with Biometric Update${NC}"
make_request "/generate-routine" "POST" '{
  "daysToGenerate": 1,
  "biometricData": {
    "weight": 75.5,
    "body_fat_percentage": 18.0,
    "resting_hr": 65,
    "training_hr_avg": 145,
    "sleep_hours": 7.0,
    "sleep_quality": 3,
    "fatigue_level": 2
  }
}'

# Example 5: Get Current Routine
echo -e "${YELLOW}Example 5: Get Current Active Routine${NC}"
make_request "/get-current-routine"

# Example 6: Save Session Feedback (Basic)
echo -e "${YELLOW}Example 6: Save Session Feedback (Basic)${NC}"
# Note: Replace with actual session ID from your generate-routine response
make_request "/save-session-feedback" "POST" '{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "feedback": {
    "rpe_reported": 7,
    "completion_rate": 0.9,
    "technical_quality": 4,
    "enjoyment_level": 4,
    "recovery_feeling": 3,
    "actual_duration": 35
  }
}'

# Example 7: Save Session Feedback with Exercise Performance
echo -e "${YELLOW}Example 7: Save Detailed Session Feedback${NC}"
make_request "/save-session-feedback" "POST" '{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "feedback": {
    "rpe_reported": 7,
    "completion_rate": 0.9,
    "technical_quality": 4,
    "enjoyment_level": 4,
    "recovery_feeling": 3,
    "actual_duration": 35
  },
  "exercisePerformance": [
    {
      "sessionExerciseId": "456e7890-e89b-12d3-a456-426614174000",
      "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
      "setNumber": 1,
      "repsCompleted": 10,
      "rpeReported": 7,
      "techniqueQuality": 4,
      "restTimeActual": 65,
      "difficultyPerceived": 6
    },
    {
      "sessionExerciseId": "456e7890-e89b-12d3-a456-426614174000",
      "exerciseId": "550e8400-e29b-41d4-a716-446655440000",
      "setNumber": 2,
      "repsCompleted": 9,
      "rpeReported": 8,
      "techniqueQuality": 3,
      "restTimeActual": 70,
      "difficultyPerceived": 7
    }
  ]
}'

# Example 8: Analyze Muscle Groups
echo -e "${YELLOW}Example 8: Analyze Muscle Group Balance${NC}"
make_request "/analyze-muscle-groups"

# Example 9: Analyze Evolution
echo -e "${YELLOW}Example 9: Analyze Training Evolution${NC}"
make_request "/analyze-evolution"

# Example 10: Update Progressions (Direct Call)
echo -e "${YELLOW}Example 10: Update Exercise Progressions${NC}"
make_request "/update-progressions" "POST" '{
  "sessionId": "123e4567-e89b-12d3-a456-426614174000",
  "exerciseBlocks": [
    {
      "exercise_id": "550e8400-e29b-41d4-a716-446655440000",
      "sets_completed": 3,
      "reps_completed": 25,
      "rpe_reported": 7,
      "technical_quality": 4,
      "enjoyment_level": 4,
      "notes": "Felt strong today, good form throughout"
    },
    {
      "exercise_id": "660e8400-e29b-41d4-a716-446655440001",
      "sets_completed": 2,
      "reps_completed": 8,
      "rpe_reported": 9,
      "technical_quality": 3,
      "enjoyment_level": 2,
      "notes": "Struggling with this exercise, form breakdown in last set"
    }
  ]
}'

echo -e "${GREEN}=== All Examples Completed ===${NC}"
echo -e "${BLUE}Check the responses above for API behavior and data structures${NC}"

# Example with error handling
echo -e "\n${YELLOW}Example: Error Handling (Invalid Token)${NC}"
ORIGINAL_TOKEN="$JWT_TOKEN"
JWT_TOKEN="invalid-token-example"
make_request "/calculate-ica"
JWT_TOKEN="$ORIGINAL_TOKEN"

# Advanced example: Complete workflow simulation
echo -e "${YELLOW}Advanced Example: Complete Workout Flow Simulation${NC}"
echo -e "${BLUE}This simulates a complete user workout session...${NC}"

# Step 1: Check current routine
echo -e "Step 1: Checking for active routine..."
current_routine_response=$(curl -s -X POST \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/get-current-routine")

echo "$current_routine_response" | jq '.'

# Step 2: Generate new routine if none exists
echo -e "\nStep 2: Generating new routine with biometric data..."
routine_response=$(curl -s -X POST \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "daysToGenerate": 1,
    "biometricData": {
      "weight": 75.0,
      "sleep_hours": 8.0,
      "sleep_quality": 4,
      "fatigue_level": 2
    }
  }' \
  "${BASE_URL}/generate-routine")

echo "$routine_response" | jq '.'

# Extract session ID for feedback (in real usage, you'd parse this properly)
session_id=$(echo "$routine_response" | jq -r '.trainingPlan.current_session.id // "demo-session-id"')

echo -e "\nStep 3: Simulating workout completion and saving feedback..."
feedback_response=$(curl -s -X POST \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"${session_id}\",
    \"feedback\": {
      \"rpe_reported\": 7,
      \"completion_rate\": 0.95,
      \"technical_quality\": 4,
      \"enjoyment_level\": 5,
      \"recovery_feeling\": 4,
      \"actual_duration\": 32
    }
  }" \
  "${BASE_URL}/save-session-feedback")

echo "$feedback_response" | jq '.'

echo -e "\n${GREEN}✅ Complete workflow simulation finished${NC}"
echo -e "${BLUE}In a real application, you would:${NC}"
echo -e "1. Parse the JSON responses properly"
echo -e "2. Handle errors gracefully"
echo -e "3. Update your UI based on the data"
echo -e "4. Store relevant IDs for future requests"

# Performance testing example
echo -e "\n${YELLOW}Performance Test: Multiple ICA Calculations${NC}"
echo -e "${BLUE}Testing API response times...${NC}"

for i in {1..3}; do
    echo -e "Request $i:"
    time curl -s -X POST \
        -H "Authorization: Bearer ${JWT_TOKEN}" \
        -H "Content-Type: application/json" \
        "${BASE_URL}/calculate-ica" > /dev/null
done

echo -e "\n${GREEN}=== Performance Test Complete ===${NC}"
echo -e "${BLUE}Note: Response times include network latency${NC}"