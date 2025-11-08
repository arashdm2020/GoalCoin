# GoalCoin Fitness MVP Implementation Guide

## Overview
This guide documents the implementation of James's fitness MVP add-ons and architecture updates for the GoalCoin platform.

## New Features Implemented

### 1. **Fitness MVP Add-Ons**

#### Warm-Up Sessions
- **Purpose**: 5-8 minute guided warm-up sessions before workouts
- **XP Reward**: 10 XP per completed warm-up
- **Backend Tracking**: `warmup_completed` flag triggers streak/reward logic
- **API Endpoints**:
  - `GET /api/fitness/warmup-sessions` - List all active warmup sessions
  - `POST /api/fitness/warmup/log` - Log warmup completion

#### Workout Logging
- **Purpose**: Track user workout activities
- **XP Reward**: 20 XP per workout
- **API Endpoints**:
  - `POST /api/fitness/workout/log` - Log workout completion

#### Diet Plans (Lite)
- **Tiers**: Budget / Balanced / Protein Boost
- **Regional Support**: Global, Middle East, Mediterranean, Western, Asia
- **XP Reward**: 15 XP per meal logged
- **Features**:
  - "GoalCoin Meal of the Day"
  - Text-based recipes with ingredients and instructions
  - Calorie and protein tracking
- **API Endpoints**:
  - `GET /api/fitness/diet-plans` - Get diet plans (filterable by tier/region)
  - `POST /api/fitness/meal/log` - Log meal completion

### 2. **XP and Streak System**

#### User Progress Tracking
- **XP Points**: Earned from all activities (warmups, workouts, meals)
- **Goal Points**: Converted from XP, tied to burn multiplier
- **Current Streak**: Days of consecutive activity
- **Longest Streak**: Personal best streak record
- **Burn Multiplier**: Increases with streak (default 1.0)
- **Last Activity Date**: Tracks daily engagement

#### Streak Logic
- Consecutive daily activity increments streak
- Missing a day resets streak to 1
- Bonus XP awarded for maintaining streaks
- **API Endpoints**:
  - `GET /api/fitness/progress/:userId` - Get user progress stats

### 3. **Hybrid Authentication**

#### Email + Wallet Login
- **Wallet Connect**: Primary authentication method (crypto-native users)
- **Email Sign-In**: Optional for general users
- **Email Verification**: `email_verified` flag for KYC compliance
- **Schema Fields**:
  - `email` (optional, unique)
  - `email_verified` (boolean, default false)

### 4. **Utility Bridge for Non-Holders**

#### Referral System
- **Reward**: 50 micro-GoalPoints per successful referral
- **Tracking**: Full referral history and leaderboard
- **API Endpoints**:
  - `POST /api/utility-bridge/referral` - Create referral
  - `GET /api/utility-bridge/referrals/:userId` - Get user referrals
  - `GET /api/utility-bridge/referral-leaderboard` - Top referrers

#### Ad Views
- **Reward**: 5 micro-GoalPoints per ad view
- **Types**: Video ads, banner ads
- **API Endpoints**:
  - `POST /api/utility-bridge/ad-view` - Log ad view

#### Micro-GoalPoints
- Separate point system for non-holders
- Earned through referrals, ad views, and content sharing
- Can be converted to GoalPoints when user becomes holder

### 5. **DAO Governance**

#### Proposal System
- **Max Votes per Wallet**: 2 votes (locked)
- **Proposal States**: ACTIVE, PASSED, REJECTED, EXPIRED
- **Vote Types**: APPROVE, REJECT
- **API Endpoints**:
  - `GET /api/dao/proposals` - List all proposals
  - `GET /api/dao/proposals/:id` - Get proposal details
  - `POST /api/dao/proposals` - Create new proposal (admin)
  - `POST /api/dao/vote` - Vote on proposal
  - `PATCH /api/dao/proposals/:id/status` - Update proposal status (admin)

### 6. **Enhanced Admin Dashboard**

#### New Metrics
- **User Stats**:
  - Total users
  - Active users (7-day)
- **XP & Streaks**:
  - Total XP points across platform
  - Total Goal Points
  - Average current streak
  - Average burn multiplier
- **Burns**:
  - Total GoalCoin burned
  - Burn event count
- **Treasury**:
  - Total prize pool (USDT)
  - Total treasury (USDT)
  - Total burned (USDT value)
- **Activity**:
  - Warmup completions
  - Workout completions
  - Meal logs
- **Utility Bridge**:
  - Total referrals
  - Referral points distributed
  - Total ad views
  - Ad view points distributed

#### API Endpoints
- `GET /api/admin/dashboard-stats` - Comprehensive dashboard statistics

### 7. **Burn Tracking**

#### Burn Events
- **Sources**: 
  - Treasury buyback
  - Streak multiplier burns
  - Manual burns
- **Tracking**: Amount, transaction hash, source, timestamp
- **Schema**: `BurnEvent` model

## Database Schema Changes

### New Tables
1. **warmup_sessions** - Warmup content library
2. **warmup_logs** - User warmup completion tracking
3. **workout_logs** - User workout tracking
4. **diet_plans** - Diet plan content library
5. **meal_logs** - User meal completion tracking
6. **referrals** - Referral tracking
7. **ad_views** - Ad view tracking
8. **dao_proposals** - DAO governance proposals
9. **dao_votes** - DAO voting records
10. **burn_events** - GoalCoin burn tracking

### Updated Tables
- **users**: Added XP, streak, burn multiplier, email verification, holder status, micro-GoalPoints

### New Enums
- **DietTier**: BUDGET, BALANCED, PROTEIN_BOOST
- **ProposalStatus**: ACTIVE, PASSED, REJECTED, EXPIRED

## Migration Instructions

### Step 1: Run SQL Migration on Production
```bash
cd backend/scripts
psql "YOUR_DATABASE_URL" -f add_fitness_features.sql
```

### Step 2: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 3: Seed Fitness Content
```bash
cd backend
npx ts-node scripts/seed_fitness_content.ts
```

### Step 4: Deploy Backend
The backend is already configured with all new routes. Simply redeploy:
```bash
# On Render.com, trigger a new deployment
# Or manually:
cd backend
npm run build
npm start
```

## API Routes Summary

### Fitness Routes (`/api/fitness`)
- `GET /warmup-sessions` - List warmup sessions
- `POST /warmup/log` - Log warmup
- `POST /workout/log` - Log workout
- `GET /diet-plans` - List diet plans
- `POST /meal/log` - Log meal
- `GET /progress/:userId` - Get user progress

### Utility Bridge Routes (`/api/utility-bridge`)
- `POST /referral` - Create referral
- `GET /referrals/:userId` - Get user referrals
- `GET /referral-leaderboard` - Referral leaderboard
- `POST /ad-view` - Log ad view

### DAO Routes (`/api/dao`)
- `GET /proposals` - List proposals
- `GET /proposals/:id` - Get proposal
- `POST /proposals` - Create proposal
- `POST /vote` - Vote on proposal
- `PATCH /proposals/:id/status` - Update proposal status

### Admin Routes (`/api/admin`)
- `GET /dashboard-stats` - Dashboard statistics (NEW)
- All existing admin routes remain unchanged

## XP Reward Structure

| Activity | XP Earned | Notes |
|----------|-----------|-------|
| Warmup Completion | 10 XP | Per session |
| Workout Completion | 20 XP | Per workout |
| Meal Logging | 15 XP | Per meal |
| Daily Streak Bonus | 5 XP | Consecutive days |
| Referral (Non-Holder) | 50 micro-GP | Utility bridge |
| Ad View (Non-Holder) | 5 micro-GP | Utility bridge |

## Monetization Hooks (Phase 2 Ready)

The architecture is modular and ready for:
1. **Premium Tiers** ($19 / $35 / $49)
   - Advanced workout plans
   - Personalized diet plans
   - 1-on-1 coaching
2. **Sponsorship Integration**
   - Branded warmup sessions
   - Sponsored meal plans
   - Ad placements
3. **Referral Leaderboard Rewards**
   - Top referrer prizes
   - Monthly competitions
4. **Automated Buyback & Burn**
   - 20% of treasury revenue → buyback fund
   - Monthly automated burns (MVP phase)
   - Annual burns (post-MVP)

## Frontend Integration TODO

### 1. User Dashboard
- Display XP, Goal Points, current streak, longest streak
- Show burn multiplier
- Activity history (warmups, workouts, meals)
- Streak calendar visualization

### 2. Fitness Section
- Warmup session library with video players
- Workout logging interface
- Diet plan browser (filterable by tier/region)
- Meal logging with "Meal of the Day" feature

### 3. Utility Bridge Section
- Referral link generator
- Referral history and stats
- Referral leaderboard
- Ad viewing interface (when ready)

### 4. DAO Governance Page
- Active proposals list
- Proposal details and voting interface
- Vote history
- "Full Constitution coming soon" placeholder

### 5. Enhanced Admin Dashboard
- New metrics cards for XP, streaks, burns
- Treasury stats visualization
- Activity charts (warmups, workouts, meals)
- Utility bridge analytics

## Security & Compliance

### KYC Guardrails (MVP)
- Verified email required for certain actions
- Username/handle required
- Light KYC sufficient for MVP phase

### DAO Rules (MVP)
- Max 2 votes per wallet (enforced in backend)
- Simple DAO Rules page in app
- Full constitution coming in Phase 2

## Testing Checklist

- [ ] Test warmup session creation and logging
- [ ] Test workout logging
- [ ] Test diet plan filtering and meal logging
- [ ] Test XP accumulation from all activities
- [ ] Test streak calculation (consecutive days)
- [ ] Test streak reset (missed day)
- [ ] Test referral creation and point distribution
- [ ] Test ad view logging
- [ ] Test DAO proposal creation
- [ ] Test DAO voting (including 2-vote limit)
- [ ] Test admin dashboard stats endpoint
- [ ] Test burn event tracking

## Environment Variables

No new environment variables required. All features use existing `DATABASE_URL`.

## Notes

- All lint errors in controllers are expected until Prisma Client is regenerated after migration
- The system is designed to be modular and extensible
- Premium features can be easily added by extending existing models
- All timestamps use UTC
- XP calculations are server-side to prevent manipulation

## Support

For questions or issues, refer to:
- Prisma schema: `backend/prisma/schema.prisma`
- Migration script: `backend/scripts/add_fitness_features.sql`
- Seed script: `backend/scripts/seed_fitness_content.ts`
- Controllers: `backend/src/controllers/`
- Routes: `backend/src/routes/`
