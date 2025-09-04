"""
Bodyweight Training API - Python Client
Comprehensive Python client for the Bodyweight Adaptive Training API
"""

import requests
import json
import time
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from datetime import datetime, timedelta
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class BiometricData:
    """Biometric data structure"""
    weight: Optional[float] = None
    body_fat_percentage: Optional[float] = None
    resting_hr: Optional[int] = None
    training_hr_avg: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[int] = None
    fatigue_level: Optional[int] = None
    age: Optional[int] = None
    last_updated: Optional[str] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class SessionFeedback:
    """Session feedback structure"""
    rpe_reported: int
    completion_rate: float
    technical_quality: int
    enjoyment_level: Optional[int] = None
    recovery_feeling: Optional[int] = None
    actual_duration: Optional[int] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in self.__dict__.items() if v is not None}


@dataclass
class ExercisePerformance:
    """Exercise performance data structure"""
    sessionExerciseId: str
    exerciseId: str
    setNumber: int
    repsCompleted: int
    rpeReported: Optional[int] = None
    techniqueQuality: Optional[int] = None
    restTimeActual: Optional[int] = None
    difficultyPerceived: Optional[int] = None

    def to_dict(self) -> Dict:
        """Convert to dictionary, excluding None values"""
        return {k: v for k, v in self.__dict__.items() if v is not None}


class APIError(Exception):
    """Custom API error class"""
    def __init__(self, message: str, status_code: int = None, response_data: Dict = None):
        self.message = message
        self.status_code = status_code
        self.response_data = response_data or {}
        super().__init__(self.message)


class BodyweightTrainingClient:
    """
    Python client for the Bodyweight Adaptive Training API
    
    This client provides a comprehensive interface to all API endpoints
    with proper error handling, retries, and type hints.
    """
    
    def __init__(self, supabase_url: str, jwt_token: str, timeout: int = 30):
        """
        Initialize the client
        
        Args:
            supabase_url: Base Supabase URL (e.g., https://your-project.supabase.co)
            jwt_token: JWT authentication token
            timeout: Request timeout in seconds
        """
        self.base_url = f"{supabase_url.rstrip('/')}/functions/v1"
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json',
            'User-Agent': 'BodyweightTraining-Python-Client/1.0'
        })
        
        logger.info(f"Initialized client for {supabase_url}")
    
    def _make_request(self, endpoint: str, method: str = 'POST', data: Dict = None) -> Dict:
        """
        Make HTTP request with error handling
        
        Args:
            endpoint: API endpoint (without base URL)
            method: HTTP method
            data: Request payload
            
        Returns:
            Parsed JSON response
            
        Raises:
            APIError: On HTTP errors or invalid responses
        """
        url = f"{self.base_url}{endpoint}"
        
        try:
            logger.debug(f"Making {method} request to {endpoint}")
            
            if method.upper() == 'GET':
                response = self.session.get(url, timeout=self.timeout)
            else:
                response = self.session.post(
                    url, 
                    json=data, 
                    timeout=self.timeout
                )
            
            # Log response time
            response_time = response.elapsed.total_seconds()
            logger.debug(f"Request completed in {response_time:.2f}s")
            
            if response.status_code == 401:
                raise APIError("Authentication failed - invalid or expired JWT token", 401)
            elif response.status_code == 404:
                raise APIError("Resource not found", 404)
            elif response.status_code == 429:
                raise APIError("Rate limit exceeded - please wait before retrying", 429)
            elif not response.ok:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', f"HTTP {response.status_code}")
                    details = error_data.get('details', '')
                    full_msg = f"{error_msg}. {details}".strip()
                except:
                    full_msg = f"HTTP {response.status_code}: {response.reason}"
                
                raise APIError(full_msg, response.status_code, error_data if 'error_data' in locals() else {})
            
            return response.json()
            
        except requests.exceptions.Timeout:
            raise APIError(f"Request timed out after {self.timeout}s")
        except requests.exceptions.ConnectionError:
            raise APIError("Failed to connect to API server")
        except requests.exceptions.RequestException as e:
            raise APIError(f"Request failed: {str(e)}")
    
    def generate_routine(self, days_to_generate: int = 1, biometric_data: Optional[BiometricData] = None) -> Dict:
        """
        Generate a personalized training routine
        
        Args:
            days_to_generate: Number of days to generate (1-7)
            biometric_data: Current biometric data for personalization
            
        Returns:
            Training plan with generated session
        """
        payload = {"daysToGenerate": days_to_generate}
        
        if biometric_data:
            payload["biometricData"] = biometric_data.to_dict()
        
        response = self._make_request("/generate-routine", data=payload)
        
        logger.info("✅ Routine generated successfully")
        return response
    
    def calculate_ica(self) -> Dict:
        """
        Calculate current ICA (Index of Current Ability) score
        
        Returns:
            ICA data with score, factors, and recommendations
        """
        response = self._make_request("/calculate-ica")
        
        ica_score = response.get('ica_score', 'N/A')
        logger.info(f"🧠 Current ICA score: {ica_score}")
        
        return response
    
    def get_latest_biometrics(self) -> BiometricData:
        """
        Get latest biometric data for the user
        
        Returns:
            BiometricData object with latest measurements
        """
        response = self._make_request("/get-latest-biometrics")
        
        logger.info("📊 Retrieved latest biometric data")
        return BiometricData(**{k: v for k, v in response.items() if k in BiometricData.__dataclass_fields__})
    
    def get_current_routine(self) -> Optional[Dict]:
        """
        Get current active routine
        
        Returns:
            Current routine data or None if no active routine
        """
        response = self._make_request("/get-current-routine")
        routine = response.get('routine')
        
        if routine:
            logger.info("🏋️ Retrieved current active routine")
        else:
            logger.info("No active routine found")
        
        return routine
    
    def save_session_feedback(self, 
                            session_id: str, 
                            feedback: SessionFeedback, 
                            exercise_performance: Optional[List[ExercisePerformance]] = None) -> Dict:
        """
        Save session feedback after workout completion
        
        Args:
            session_id: ID of the completed session
            feedback: Session feedback data
            exercise_performance: Detailed exercise performance data
            
        Returns:
            Response with updated progressions and session data
        """
        payload = {
            "sessionId": session_id,
            "feedback": feedback.to_dict()
        }
        
        if exercise_performance:
            payload["exercisePerformance"] = [ep.to_dict() for ep in exercise_performance]
        
        response = self._make_request("/save-session-feedback", data=payload)
        
        # Log progression updates
        progressions = response.get('session', {}).get('updated_progressions', [])
        if progressions:
            for progression in progressions:
                status = "🚀 LEVEL UP!" if progression.get('progression_triggered') else "📊 Maintained"
                logger.info(f"{status} Exercise {progression.get('exercise_id', '')[:8]}...")
        
        logger.info("💾 Session feedback saved successfully")
        return response
    
    def analyze_muscle_groups(self) -> Dict:
        """
        Analyze muscle group balance and performance
        
        Returns:
            Muscle group analysis with balance scores and recommendations
        """
        response = self._make_request("/analyze-muscle-groups")
        
        # Log significant imbalances
        analyses = response.get('muscle_group_analyses', [])
        for analysis in analyses:
            imbalance = analysis.get('imbalance_score', 0)
            if imbalance > 30:
                muscle_group = analysis.get('muscle_group', 'Unknown')
                logger.warning(f"⚠️ Imbalance detected in {muscle_group}: {imbalance:.1f}%")
        
        logger.info("💪 Muscle group analysis completed")
        return response
    
    def analyze_evolution(self) -> Dict:
        """
        Analyze training evolution and progress over time
        
        Returns:
            Evolution analysis with trends and predictions
        """
        response = self._make_request("/analyze-evolution")
        
        # Log key insights
        ica_evolution = response.get('ica_evolution', {})
        current_ica = ica_evolution.get('current_ica', 'N/A')
        trend = ica_evolution.get('trend', 'unknown')
        
        overall_progress = response.get('overall_progress', {})
        progress_score = overall_progress.get('score', 0)
        classification = overall_progress.get('classification', 'Unknown')
        
        logger.info(f"📈 Current ICA: {current_ica} ({trend})")
        logger.info(f"🏆 Overall progress: {progress_score:.2f} - {classification}")
        
        return response
    
    def update_progressions(self, session_id: str, exercise_blocks: List[Dict]) -> Dict:
        """
        Update exercise progressions based on performance
        
        Args:
            session_id: Session ID for tracking
            exercise_blocks: List of exercise performance data
            
        Returns:
            Updated progression information
        """
        payload = {
            "sessionId": session_id,
            "exerciseBlocks": exercise_blocks
        }
        
        response = self._make_request("/update-progressions", data=payload)
        
        progressions = response.get('progressions_updated', [])
        logger.info(f"📊 Updated {len(progressions)} exercise progressions")
        
        return response


class AdvancedBodyweightClient(BodyweightTrainingClient):
    """
    Advanced client with retry logic, rate limiting, and caching
    """
    
    def __init__(self, supabase_url: str, jwt_token: str, timeout: int = 30, 
                 max_retries: int = 3, retry_delay: float = 1.0):
        """
        Initialize advanced client
        
        Args:
            supabase_url: Base Supabase URL
            jwt_token: JWT authentication token
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries for failed requests
            retry_delay: Initial delay between retries (exponential backoff)
        """
        super().__init__(supabase_url, jwt_token, timeout)
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._cache = {}  # Simple in-memory cache
    
    def _make_request_with_retry(self, endpoint: str, method: str = 'POST', data: Dict = None) -> Dict:
        """
        Make request with retry logic and exponential backoff
        """
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                return self._make_request(endpoint, method, data)
            except APIError as e:
                last_exception = e
                
                # Don't retry on authentication errors
                if e.status_code == 401:
                    raise
                
                # Handle rate limiting
                if e.status_code == 429:
                    delay = self.retry_delay * (2 ** attempt)
                    logger.warning(f"Rate limited, waiting {delay:.1f}s before retry {attempt + 1}/{self.max_retries}")
                    time.sleep(delay)
                    continue
                
                # Retry on 5xx errors or connection issues
                if e.status_code is None or e.status_code >= 500:
                    if attempt < self.max_retries:
                        delay = self.retry_delay * (2 ** attempt)
                        logger.warning(f"Request failed, retrying in {delay:.1f}s... ({attempt + 1}/{self.max_retries})")
                        time.sleep(delay)
                        continue
                
                # Don't retry on 4xx errors (except 429)
                raise
        
        # If we've exhausted retries
        raise last_exception
    
    def calculate_ica_cached(self, cache_duration: int = 300) -> Dict:
        """
        Calculate ICA with caching (5 minute default)
        
        Args:
            cache_duration: Cache duration in seconds
            
        Returns:
            ICA data (may be from cache)
        """
        cache_key = "ica_data"
        now = time.time()
        
        # Check cache
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            if now - cached_time < cache_duration:
                logger.info("📋 Using cached ICA data")
                return cached_data
        
        # Fetch fresh data
        response = self.calculate_ica()
        self._cache[cache_key] = (response, now)
        
        return response
    
    def bulk_analyze(self) -> Dict:
        """
        Perform bulk analysis (ICA, muscle groups, evolution) in parallel-like fashion
        
        Returns:
            Combined analysis results
        """
        logger.info("🔄 Performing bulk analysis...")
        
        results = {}
        
        try:
            results['ica'] = self.calculate_ica()
        except APIError as e:
            logger.error(f"ICA analysis failed: {e}")
            results['ica'] = None
        
        try:
            results['muscle_groups'] = self.analyze_muscle_groups()
        except APIError as e:
            logger.error(f"Muscle group analysis failed: {e}")
            results['muscle_groups'] = None
        
        try:
            results['evolution'] = self.analyze_evolution()
        except APIError as e:
            logger.error(f"Evolution analysis failed: {e}")
            results['evolution'] = None
        
        logger.info("📊 Bulk analysis completed")
        return results


# Example usage and testing
def example_complete_workflow():
    """Example of complete workout workflow"""
    
    # Initialize client (replace with your actual values)
    client = BodyweightTrainingClient(
        supabase_url="https://your-project.supabase.co",
        jwt_token="your-jwt-token"
    )
    
    try:
        print("🚀 Starting complete workout workflow...\n")
        
        # Step 1: Check current routine
        print("Step 1: Checking for active routine...")
        current_routine = client.get_current_routine()
        
        if not current_routine:
            print("No active routine found. Generating new one...\n")
            
            # Step 2: Get latest biometrics
            print("Step 2: Getting latest biometric data...")
            biometrics = client.get_latest_biometrics()
            print(f"Current weight: {biometrics.weight}kg, Sleep: {biometrics.sleep_hours}h\n")
            
            # Step 3: Update biometrics and generate routine
            print("Step 3: Generating routine with updated biometrics...")
            updated_biometrics = BiometricData(
                weight=biometrics.weight,
                sleep_hours=7.5,      # Updated sleep
                sleep_quality=4,      # Good sleep quality
                fatigue_level=2       # Low fatigue
            )
            
            routine_response = client.generate_routine(
                days_to_generate=1,
                biometric_data=updated_biometrics
            )
            
            current_routine = routine_response['trainingPlan']['current_session']
            print(f"Generated routine with {len(current_routine['exercise_blocks'])} exercises\n")
        
        # Step 4: Simulate workout completion
        print("Step 4: Simulating workout completion...")
        
        session_feedback = SessionFeedback(
            rpe_reported=7,
            completion_rate=0.9,
            technical_quality=4,
            enjoyment_level=4,
            recovery_feeling=3,
            actual_duration=35
        )
        
        # Create exercise performance data
        exercise_performance = []
        for i, block in enumerate(current_routine.get('exercise_blocks', [])[:2]):  # First 2 exercises
            exercise_performance.append(ExercisePerformance(
                sessionExerciseId=block.get('session_exercise_id', f'demo-{i}'),
                exerciseId=block['exercise']['id'],
                setNumber=1,
                repsCompleted=int(block['reps'] * 0.9),  # Completed 90% of planned
                rpeReported=7,
                techniqueQuality=4,
                restTimeActual=block.get('rest_seconds', 60) + 10
            ))
        
        # Save feedback
        feedback_result = client.save_session_feedback(
            session_id=current_routine['id'],
            feedback=session_feedback,
            exercise_performance=exercise_performance
        )
        
        print("✅ Workout completed and feedback saved!\n")
        
        # Step 5: Analyze progress
        print("Step 5: Analyzing progress...")
        ica_data = client.calculate_ica()
        muscle_analysis = client.analyze_muscle_groups()
        
        print(f"Updated ICA score: {ica_data.get('ica_score', 'N/A')}")
        print(f"Adherence rate: {(ica_data.get('adherence_rate', 0) * 100):.1f}%")
        print(f"Muscle groups trained: {muscle_analysis['summary']['total_muscle_groups_trained']}")
        
        print("\n🎉 Complete workflow finished successfully!")
        
    except APIError as e:
        print(f"❌ API Error: {e}")
        if e.status_code == 401:
            print("💡 Tip: Check your JWT token and make sure it's valid")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


def example_analytics():
    """Example of analytics and insights"""
    
    client = AdvancedBodyweightClient(
        supabase_url="https://your-project.supabase.co",
        jwt_token="your-jwt-token",
        max_retries=3
    )
    
    try:
        print("📊 Performing comprehensive analytics...\n")
        
        # Bulk analysis with error handling
        results = client.bulk_analyze()
        
        if results['ica']:
            ica = results['ica']
            print(f"🧠 ICA Score: {ica.get('ica_score', 'N/A')}/5.0")
            print(f"📈 Adherence: {(ica.get('adherence_rate', 0) * 100):.1f}%")
            print(f"😴 Recovery: {(ica.get('recovery_factor', 0) * 100):.1f}%")
        
        if results['muscle_groups']:
            mg = results['muscle_groups']
            balance_score = mg['summary']['overall_balance_score']
            print(f"💪 Muscle Balance: {(balance_score * 100):.1f}%")
            
            # Show imbalances
            imbalances = [
                analysis for analysis in mg['muscle_group_analyses']
                if analysis['imbalance_score'] > 20
            ]
            
            if imbalances:
                print("⚠️ Imbalances detected:")
                for imbalance in imbalances[:3]:  # Show top 3
                    print(f"   - {imbalance['muscle_group']}: {imbalance['imbalance_score']:.1f}%")
        
        if results['evolution']:
            evo = results['evolution']
            progress = evo['overall_progress']
            print(f"🏆 Progress: {progress['classification']} ({(progress['score'] * 100):.0f}%)")
            
            # Show top recommendations
            if progress['recommendations']:
                print("💡 Top recommendations:")
                for rec in progress['recommendations'][:2]:
                    print(f"   - {rec}")
        
        print("\n✅ Analytics completed!")
        
    except APIError as e:
        print(f"❌ Analytics failed: {e}")


if __name__ == "__main__":
    print("Bodyweight Training API - Python Client Examples")
    print("=" * 50)
    
    # Note: Update these with your actual values before running
    SUPABASE_URL = "https://your-project.supabase.co"
    JWT_TOKEN = "your-jwt-token"
    
    if JWT_TOKEN == "your-jwt-token":
        print("❌ Please update SUPABASE_URL and JWT_TOKEN variables before running examples")
    else:
        print("\n🔄 Running complete workflow example...")
        example_complete_workflow()
        
        print("\n" + "="*50)
        print("🔄 Running analytics example...")
        example_analytics()