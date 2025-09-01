# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development Commands
```bash
# Root monorepo commands
npm run dev              # Start all applications in development mode
npm run build            # Build all applications
npm run lint             # Run linting across all applications
npm run lint:fix         # Fix linting issues automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run clean            # Clean all build artifacts

# Individual application commands
npm run web              # Start web app only (cd apps/web && npm run dev)
npm run mobile           # Start mobile app only (cd apps/mobile && npm run start)

# Supabase commands
npm run supabase:start   # Start Supabase local development
npm run supabase:stop    # Stop Supabase local development
npm run db:reset         # Reset database with migrations
```

### Application-specific Commands
```bash
# Web application (apps/web)
cd apps/web
npm run dev              # Next.js development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Next.js linting
npm run clean            # Remove .next directory

# Mobile application (apps/mobile)
cd apps/mobile
npm start                # Start Expo development server
npm run android          # Run on Android emulator
npm run ios              # Run on iOS simulator
npm run web              # Run Expo web version
```

## Architecture Overview

This is a **full-stack adaptive bodyweight training application** built as a monorepo with web and mobile applications sharing core business logic.

### Technology Stack
- **Monorepo Management**: Turborepo with pnpm workspaces
- **Web Frontend**: Next.js 14 + TypeScript + TailwindCSS + ShadCN UI
- **Mobile Frontend**: React Native (Expo) + TypeScript + React Native Paper
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Shared Logic**: TypeScript package (`@bodyweight/shared`)

### Project Structure
```
bodyweight/
├── apps/
│   ├── web/           # Next.js web application
│   └── mobile/        # React Native mobile app
├── packages/
│   └── shared/        # Shared types and adaptive training algorithm
├── supabase/
│   ├── migrations/    # Database schema migrations
│   └── functions/     # Edge Functions (API endpoints)
└── turbo.json         # Turborepo configuration
```

### Core Features
- **Adaptive Training Algorithm**: Calculates user's Current Capacity Index (ICA) and generates personalized workouts
- **Progressive Exercise System**: 7-level progression for each movement pattern (push, pull, squat, hinge, core, locomotion)
- **Recovery-Aware Programming**: Considers sleep, fatigue, and training history
- **Cross-Platform Sync**: Real-time synchronization between web and mobile

## Database Architecture

### Key Tables
- `user_profiles`: Extended user data beyond Supabase auth
- `exercises`: Exercise catalog with progression levels
- `training_sessions`: Completed workout sessions
- `session_exercises`: Individual exercises within sessions
- `wellness_logs`: Daily recovery metrics (sleep, fatigue)
- `algorithm_state`: Cached algorithm calculations per user

### Important Database Operations
- All tables use Row Level Security (RLS) for user data isolation
- Edge Functions handle complex calculations (ICA, routine generation)
- Database migrations are versioned and applied automatically

## Adaptive Training Algorithm

The core algorithm is implemented in `packages/shared/src/` and calculates personalized workouts based on user capability and history.

### ICA (Index of Current Ability) Formula
```typescript
ICA = (fitness_level × adherence_rate × recovery_factor × progression_velocity) / detraining_factor
```

### Key Algorithm Components
- **Recovery Factor**: Based on sleep quality, hours, and fatigue level
- **Adherence Rate**: Percentage of completed workouts in last 4 weeks  
- **Progression Velocity**: Rate of recent improvements
- **Detraining Factor**: Penalty for inactivity periods

### Exercise Progression Logic
- 7 levels per exercise pattern (wall push-ups → one-arm push-ups)
- Advance after 3 successful sessions at target reps
- Regress after 2 failed sessions or low ICA
- Safety limits prevent excessive volume increases

## New User Algorithm (Sprint 2.5 Enhancement)

### Problem Solved
The algorithm now handles completely new users who have no training history or exercise progressions, providing safe and personalized routines from day 1.

### Implementation Strategy: Conservative Progression Estimation

**Automatic Progression Creation for New Users:**
```typescript
estimateInitialProgressions(profile: UserProfile): { [category: string]: number } {
  const baseLevel = FITNESS_LEVELS[profile.fitness_level] // beginner: 1.0, intermediate: 1.5, advanced: 2.0
  const experienceBonus = Math.min(2, profile.experience_years * 0.5)
  const ageAdjustment = profile.age ? Math.max(0, (30 - profile.age) * 0.05) : 0
  
  // Conservative estimation - start 20% lower than expected
  const estimatedLevel = Math.max(1, Math.floor((baseLevel + experienceBonus + ageAdjustment) * 0.8))
  
  return {
    push: Math.max(1, estimatedLevel - 1),     // Push-ups harder
    pull: Math.max(1, estimatedLevel - 1),     // Pull-ups hardest  
    squat: estimatedLevel,                     // Squats accessible
    hinge: Math.max(1, estimatedLevel - 1),   // Hip hinges need practice
    core: estimatedLevel,                      // Core work accessible
    locomotion: estimatedLevel + 1             // Movement easiest
  }
}
```

### Safety Features for New Users

**1. Conservative ICA Calculation**
- Brand new users (0 sessions): Special `generateNewUserICA()` method
- ICA range: 0.1 - 2.0 with conservative base (0.8 × fitness_level)
- Experience bonus: Max +0.3 from years of experience
- Age adjustment: Slight bonus for younger users

**2. Safety Factor Application**
- 30% intensity reduction for users with <3 completed sessions
- `NEW_USER_SAFETY_FACTOR = 0.7` applied to final ICA
- Conservative volume recommendations (lower reps/sets)

**3. Automatic Progression Seeding**
- Creates exercise progressions automatically when none exist
- Maps onboarding data to appropriate progression levels
- Stores progressions in database for future refinement
- Falls back to level 1 if no suitable exercises found

### New User Experience Flow

```
New User Registration → Onboarding Data → First Routine Request
                                             ↓
No Progressions Detected → estimateInitialProgressions() 
                                             ↓
Create Database Progressions → generateNewUserICA() → Safety Factor Applied
                                             ↓
Generate Conservative Routine → Store Results → Ready for Feedback Loop
```

### Validation Results (Tested)

**Test Case: Complete Beginner (0 experience)**
- **Profile**: 25yr, beginner, 0 experience years, 3 days/week
- **Generated ICA**: 0.64 (with safety factor)
- **Routine**: Push-ups 3x7, Squats 3x6, Plank 2x6
- **Progressions Created**: 6 categories, all level 1-2
- **Recommendations**: Beginner-specific guidance messages

**Benefits Achieved:**
- ✅ Unified algorithm experience for all users
- ✅ Safe routines from day 1, no risk of overexertion  
- ✅ Automatic adaptation after 2-3 sessions with feedback
- ✅ No dual logic or manual configuration required
- ✅ Seamless progression tracking from first workout

## Architectural Decision (Sprint 2.6 - Unification)

### **PROBLEMA IDENTIFICADO**: Implementaciones Duplicadas

Durante la integración se descubrió que existían **DOS algoritmos completamente separados**:

1. **📦 Packages/Shared Algorithm** (`/packages/shared/src/algorithm.ts`)
   - Algoritmo completo y corregido
   - Usa ejercicios reales de la base de datos
   - ❌ NO se usaba por las Edge Functions

2. **🚀 Edge Function Algorithm** (`/supabase/functions/_shared/algorithm.ts`)
   - Implementación diferente e incompleta
   - Creaba ejercicios falsos con IDs inválidos (`"warmup-mobility"`)
   - ✅ Era la que usaban las Edge Functions

3. **🌐 Next.js API Routes** (`/apps/web/app/api/*/route.ts`)
   - Proxy innecesario que llamaba a Edge Functions
   - Añadía complejidad sin valor

### **SOLUCIÓN ARQUITECTURAL**: Solo Edge Functions

**Decisión**: Mantener únicamente **Supabase Edge Functions** como API layer único.

**Justificación**:
- ✅ **Multiplataforma**: Una API para web y móvil 
- ✅ **Consistencia**: Mismo comportamiento en todas las plataformas
- ✅ **Escalabilidad**: Supabase maneja el scaling automáticamente
- ✅ **Autenticación**: JWT funciona igual para web/móvil
- ✅ **Simplicidad**: Una sola fuente de verdad

**Flujo Final Limpio**:
```
Web Frontend ─┐
              ├─→ Supabase Edge Functions → Algoritmo Unificado
Mobile App ───┘
```

### **Cambios Realizados**:
- ❌ Eliminadas todas las Next.js API Routes (`/apps/web/app/api/*`)
- ✅ Copiado algoritmo correcto a Edge Functions
- ✅ Frontend llama directamente a Edge Functions
- ✅ Algoritmo unificado usando ejercicios reales de la base de datos

## Development Guidelines

### Code Organization
- **Shared Types**: All TypeScript interfaces in `packages/shared/src/types.ts` 
- **Algorithm Logic**: ⚠️ **SOLO en Edge Functions** `supabase/functions/_shared/algorithm.ts`
- **UI Components**: 
  - Web: ShadCN components in `apps/web/app/components/ui/`
  - Mobile: React Native Paper components
- **API Layer**: ⚠️ **SOLO Supabase Edge Functions** in `supabase/functions/`

### Environment Setup
1. Supabase requires `.env.local` (web) and `.env` (mobile) with connection strings
2. Shared package must be built before running applications: `cd packages/shared && npm run build`
3. Use local Supabase for development: `npm run supabase:start`

### Testing Strategy
- Algorithm logic should be unit tested in shared package
- Integration tests for API endpoints
- Component testing for critical UI flows
- Test database migrations with `npm run db:reset`

### Key Integration Points
- **API Communication**: Apps communicate with Supabase Edge Functions
- **State Management**: React Context for user state and algorithm data
- **Authentication**: Supabase Auth with automatic user profile creation
- **Real-time Updates**: Supabase realtime subscriptions for cross-device sync

## Authentication System

The authentication system has been completely rewritten and uses a state-based approach for reliable user flows:

### Authentication Flow States
```typescript
type AppState = 'loading' | 'auth' | 'onboarding' | 'dashboard'
```

### Key Authentication Components

#### Main App (`apps/web/app/page.tsx`)
- **State Management**: Centralized authentication state with proper session handling
- **Session Persistence**: Handles Supabase session cookies properly
- **Navigation Logic**: Automatic routing based on user state and profile completion
- **Comprehensive Logging**: Detailed console logs with emoji prefixes for debugging

#### Auth Component (`apps/web/app/components/auth.tsx`)
- **Callback Architecture**: Uses `onAuthSuccess` callback for proper state management
- **Auto-Login**: Automatically logs in user after successful registration
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Dual Forms**: Login and signup in tabs with shared form validation

#### Onboarding Component (`apps/web/app/components/onboarding.tsx`)
- **Multi-Step Flow**: 3-step onboarding process with progress tracking
  - Step 1: Basic Information (age, weight, height)
  - Step 2: Fitness Experience (level, years, available days)
  - Step 3: Training Preferences (duration, intensity)
- **Step Validation**: Each step validates required fields before allowing progression
- **Progress Indicator**: Visual progress bar and step counter
- **Enhanced UX**: Emojis, descriptive labels, and motivational messaging

#### Dashboard Component (`apps/web/app/components/dashboard.tsx`)
- **Props-Based Architecture**: Receives user data via props instead of managing auth internally
- **Logout Callback**: Uses callback system for proper logout handling
- **ICA Integration**: Displays user's adaptive training metrics and recommendations

### Database Integration
- **Auto Profile Creation**: Database trigger automatically creates user_profiles record
- **Profile Updates**: Onboarding updates existing profile instead of creating new ones
- **Error Recovery**: Proper error handling for database timeout and connection issues

### Development Notes
- **Session Management**: Sessions are stored in HTTP-only cookies, not localStorage
- **Environment Variables**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Debugging**: Extensive logging with emoji prefixes for easy troubleshooting:
  - 🚀 Initialization
  - 🔐 Authentication 
  - 📝 Registration/Updates
  - 👤 Profile operations
  - ❌ Errors
  - ✅ Success operations

## Frontend-Backend Integration Debugging

### Current Integration Issues (Sprint 2 Focus)

The application has all components implemented individually, but the integration between frontend and backend is not working properly. Key issues identified:

#### **Problem Summary**
- ✅ All UI components are implemented and functional
- ✅ All Edge Functions are deployed and exist
- ✅ Database schema is complete with proper RLS
- ❌ **Routine generation button doesn't work** - no response when clicked
- ❌ **Dashboard shows no real user data** - displays loading or empty states
- ❌ **End-to-end user flow is broken** - can't complete full workout cycle

#### **Key Debugging Areas**

**1. API Connectivity (`routine-service.ts`)**
- Edge Function endpoints might not be responding correctly
- JWT token authentication may be failing
- CORS configuration issues possible
- Verify: `/api/generate-routine`, `/api/calculate-ica`, `/api/update-progressions`

**2. Database Seeding Issues**
- `exercises` table might be empty (no base exercises to generate routines)
- `exercise_progressions` table might lack initial progression data
- User profiles might not be fully populated after onboarding
- Database triggers might not be firing correctly

**3. Dashboard Data Loading (`dashboard.tsx:53-61`)**
```typescript
// ISSUE: References to undefined 'userSession' and 'setUserProfile'
if (userSession?.user) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userSession.user.id)  // userSession undefined
    .single()
  
  setUserProfile(profile)  // setUserProfile function doesn't exist
}
```

**4. Component Integration Problems**
- `DailyRoutine` component expects specific data structure from `GeneratedSession`
- `ProgressCharts` requires historical training session data
- State management between components might be inconsistent

#### **Debug Checklist for Sprint 2**

**T2.1: API Endpoints Debug**
- [ ] Test Edge Functions directly from Supabase dashboard
- [ ] Verify JWT authentication in API calls
- [ ] Check CORS configuration and environment variables
- [ ] Validate request/response data structures

**T2.2: Database Seeding**
- [ ] Populate `exercises` table with base bodyweight exercises
- [ ] Create initial `exercise_progressions` entries for each user
- [ ] Verify `user_profiles` has complete data after onboarding
- [ ] Test database triggers for automatic profile creation

**T2.3: Dashboard Integration Fixes**
- [ ] Fix `loadDashboardData()` function to use correct user data
- [ ] Implement proper state management for user profile
- [ ] Verify `routineService` methods return expected data formats
- [ ] Test `ProgressCharts` with actual training session data

**T2.4: End-to-End Flow Testing**
- [ ] Register → Onboarding → Dashboard with real data flow
- [ ] Generate routine → Display exercises → Complete workout cycle
- [ ] Session feedback → Progress update → ICA recalculation loop

#### **Key Files for Integration Debugging**
- `apps/web/lib/routine-service.ts` - API communication layer
- `apps/web/app/components/dashboard.tsx:45-84` - Data loading logic
- `apps/web/app/components/daily-routine.tsx` - Routine display component
- `supabase/functions/generate-routine/index.ts` - Routine generation API
- `supabase/functions/calculate-ica/index.ts` - ICA calculation API

#### **Expected Working State After Sprint 2**
- Routine generation button creates real workouts with actual exercises
- Dashboard displays user's current ICA, training history, and progress charts
- Complete workout flow from generation to completion to progress tracking
- All API endpoints responding correctly with proper authentication

## Important Files to Understand
- `adaptive_bodyweight_algorithm.md`: Detailed algorithm specification
- `SPRINT_PLAN.md`: Current development roadmap and progress tracking
- `supabase/migrations/`: Database schema evolution and structure
- `packages/shared/src/`: Core business logic and shared types
- `turbo.json`: Build pipeline and task orchestration
- **Integration debugging files**: `routine-service.ts`, `dashboard.tsx`, Edge Functions