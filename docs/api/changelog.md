# API Changelog

All notable changes to the Bodyweight Adaptive Training API will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.8.0] - 2024-09-04

### Added
- **Comprehensive Biometric Tracking System**
  - New `/get-latest-biometrics` endpoint for retrieving current biometric data
  - `biometricData` parameter support in `/generate-routine` for pre-routine updates
  - Automatic biometric snapshot creation with temporal tracking
  - BMI calculation and age tracking from birth_date
  - Data source classification (onboarding, pre_routine, manual, automatic)

- **Enhanced Algorithm Intelligence**
  - Historical biometric data integration in ICA calculations
  - Enhanced recovery factor calculation using sleep, fatigue, and HR data
  - Automatic profile updates with most recent biometric measurements
  - Fallback mechanisms for missing biometric data

- **Database Improvements**
  - New `biometric_snapshots` table for temporal data storage
  - `get_latest_biometrics()` PostgreSQL function
  - `estimate_biometric_values()` function for BMI-based approximations
  - Enhanced Row Level Security (RLS) for biometric data

### Enhanced
- **`/generate-routine`** endpoint now accepts optional `biometricData` parameter
- **`/calculate-ica`** endpoint now uses historical biometric data for enhanced accuracy
- **All endpoints** now include comprehensive error handling and validation
- **Response schemas** updated with additional biometric fields and metadata

### Documentation
- Complete OpenAPI 3.0.3 specification with all endpoints
- Comprehensive examples in JavaScript, Python, and cURL
- Detailed integration guides for web and mobile applications
- Error handling best practices and troubleshooting guides

## [2.7.0] - 2024-08-28

### Added
- **Muscle Group Analysis System**
  - New `/analyze-muscle-groups` endpoint for balance analysis
  - Current week volume and intensity tracking per muscle group
  - 4-week trend analysis and progression velocity
  - Imbalance detection with severity scoring
  - Personalized muscle group recommendations

- **Enhanced Session Feedback**
  - Detailed exercise performance tracking in `/save-session-feedback`
  - Set-by-set performance data collection
  - Technique quality and RPE per exercise
  - Muscle group association for performance analysis

- **Database Schema**
  - New `muscle_group_metrics` table for weekly aggregated data
  - New `exercise_performance` table for granular tracking
  - Updated `session_exercises` with muscle group denormalization

### Enhanced
- **Algorithm Intelligence** now considers muscle group balance in routine generation
- **Smart Exercise Selection** prioritizes underworked muscle groups
- **Adaptive Volume** adjusts sets/reps based on muscle group needs

## [2.6.0] - 2024-08-15

### Changed
- **Unified Algorithm Architecture** - Consolidated from dual implementations to single Edge Functions approach
- **Removed Next.js API Routes** - All API calls now go directly to Supabase Edge Functions
- **Algorithm Corrections** - Fixed exercise selection to use real database exercises instead of mock data

### Added
- **Consistent API Layer** - Single API for both web and mobile applications
- **Improved Error Handling** - Standardized error responses across all endpoints

### Removed
- `packages/shared/src/algorithm.ts` - Moved logic to Edge Functions
- All Next.js API routes in `/apps/web/app/api/*` - Replaced with direct Edge Function calls

## [2.5.0] - 2024-08-01

### Added
- **New User Algorithm** - Complete handling for users with no training history
  - Automatic progression estimation based on fitness level and experience
  - Conservative safety factors for new users
  - Seamless integration with existing algorithm

- **Enhanced Intelligence Systems**
  - Muscle group balance system with forced minimums
  - Early warning system for declining performance
  - Confidence factor system based on user reliability
  - Rescue routine system for struggling users

- **Advanced Analytics**
  - `/analyze-evolution` endpoint for temporal KPI tracking
  - Comprehensive trend analysis and predictions
  - Performance classification and recommendations

### Enhanced
- **ICA Calculation** with new user safety factors
- **Exercise Selection** with muscle group prioritization
- **Progression System** with confidence-based adaptation

## [2.4.0] - 2024-07-20

### Added
- **Enhanced Feedback System** in `/save-session-feedback`
  - Exercise-level performance tracking
  - Automatic progression updates
  - Comprehensive muscle group data collection

### Enhanced
- **Algorithm Accuracy** with improved progression logic
- **Database Performance** with optimized queries and indexing

## [2.3.0] - 2024-07-10

### Added
- **Evolution Analytics** - `/analyze-evolution` endpoint
  - ICA progression tracking over time
  - Exercise progression analysis
  - Performance metrics evolution
  - Predictive analytics for future performance

### Enhanced
- **Database Schema** with temporal analysis support
- **Algorithm Performance** with caching optimizations

## [2.2.0] - 2024-06-25

### Added
- **Current Routine Management** - `/get-current-routine` endpoint
- **Progression Updates** - `/update-progressions` endpoint
- **Enhanced Error Responses** with detailed error information

### Enhanced
- **Session Management** with improved state tracking
- **Authentication** with better JWT validation

## [2.1.0] - 2024-06-15

### Added
- **ICA Calculation** - `/calculate-ica` endpoint
- **Session Feedback** - `/save-session-feedback` endpoint
- **Comprehensive Algorithm** with adaptive training logic

### Enhanced
- **Database Schema** with full workout tracking
- **Security** with Row Level Security (RLS) implementation

## [2.0.0] - 2024-06-01

### Added
- **Adaptive Training Algorithm** - Core algorithm implementation
- **Routine Generation** - `/generate-routine` endpoint
- **User Progression System** - 7-level progression tracking
- **Comprehensive Database Schema** - Complete workout and user management

### Security
- **JWT Authentication** - Secure token-based authentication
- **CORS Support** - Proper cross-origin resource sharing
- **Input Validation** - Request validation and sanitization

## [1.0.0] - 2024-05-15

### Added
- **Initial API Structure** - Basic endpoint framework
- **Supabase Integration** - Database and authentication setup
- **Edge Functions** - Serverless function architecture

---

## API Versioning Strategy

### Version Format
We use semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes that require client updates
- **MINOR**: New features that are backward compatible  
- **PATCH**: Bug fixes and small improvements

### Breaking Changes Policy
- Breaking changes are announced at least 30 days in advance
- Previous major version is supported for 90 days after new release
- Migration guides are provided for all breaking changes

### Feature Deprecation
- Features marked as deprecated continue to work for at least one major version
- Deprecation warnings are included in API responses
- Alternative approaches are documented in the changelog

## Migration Guides

### Migrating from v2.7 to v2.8
**New Features (Backward Compatible):**
- Optional `biometricData` parameter in `/generate-routine`
- New `/get-latest-biometrics` endpoint
- Enhanced ICA calculation with historical data

**No breaking changes** - all existing integrations continue to work.

### Migrating from v2.6 to v2.7
**New Features (Backward Compatible):**
- New `/analyze-muscle-groups` endpoint
- Enhanced `/save-session-feedback` with exercise performance tracking
- Additional response fields in session feedback

**Recommended Updates:**
```javascript
// Before v2.7
await saveSessionFeedback(sessionId, basicFeedback);

// v2.7+ with enhanced tracking
await saveSessionFeedback(sessionId, basicFeedback, exercisePerformance);
```

### Migrating from v2.5 to v2.6
**Breaking Changes:**
- Removed Next.js API routes - update base URLs to point directly to Edge Functions
- Algorithm responses now include real exercise data instead of mock exercises

**Migration Steps:**
1. Update base URL from `/api/` to `${SUPABASE_URL}/functions/v1/`
2. Update authentication headers to include Supabase JWT tokens
3. Test exercise data parsing with real exercise objects

**Before v2.6:**
```javascript
const response = await fetch('/api/generate-routine', { ... });
```

**After v2.6:**
```javascript
const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-routine`, {
  headers: {
    'Authorization': `Bearer ${jwt_token}`,
    'Content-Type': 'application/json'
  }
});
```

## Support and Compatibility

### Supported Versions
| Version | Status | Support Until | Notes |
|---------|---------|---------------|--------|
| 2.8.x   | Current | Active | Latest features |
| 2.7.x   | Maintained | 2024-12-01 | Security updates only |
| 2.6.x   | Deprecated | 2024-10-01 | Critical fixes only |
| ≤2.5.x  | End of Life | - | No longer supported |

### Getting Help
- **Documentation**: Check the OpenAPI specification and examples
- **Issues**: Report bugs and request features on GitHub
- **Migration Support**: Follow migration guides for version updates

---

*Last Updated: September 4, 2024*