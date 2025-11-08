-- GoalCoin Fitness MVP Add-Ons Migration
-- This script adds new tables and columns for James's requirements

-- Step 1: Add new columns to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp_points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "goal_points" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "current_streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "longest_streak" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_activity_date" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "burn_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_holder" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "micro_goal_points" INTEGER NOT NULL DEFAULT 0;

-- Step 2: Create new enums
DO $$ BEGIN
    CREATE TYPE "DietTier" AS ENUM ('BUDGET', 'BALANCED', 'PROTEIN_BOOST');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "ProposalStatus" AS ENUM ('ACTIVE', 'PASSED', 'REJECTED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create warmup_sessions table
CREATE TABLE IF NOT EXISTS "warmup_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT,
    "duration_min" INTEGER NOT NULL DEFAULT 5,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "warmup_sessions_pkey" PRIMARY KEY ("id")
);

-- Step 4: Create warmup_logs table
CREATE TABLE IF NOT EXISTS "warmup_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "xp_earned" INTEGER NOT NULL DEFAULT 10,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "warmup_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "warmup_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "warmup_logs_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "warmup_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "warmup_logs_user_id_completed_at_idx" ON "warmup_logs"("user_id", "completed_at");

-- Step 5: Create workout_logs table
CREATE TABLE IF NOT EXISTS "workout_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "workout_type" TEXT NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "xp_earned" INTEGER NOT NULL DEFAULT 20,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workout_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workout_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "workout_logs_user_id_completed_at_idx" ON "workout_logs"("user_id", "completed_at");

-- Step 6: Create diet_plans table
CREATE TABLE IF NOT EXISTS "diet_plans" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tier" "DietTier" NOT NULL DEFAULT 'BALANCED',
    "region" TEXT,
    "description" TEXT NOT NULL,
    "ingredients" TEXT,
    "instructions" TEXT,
    "calories" INTEGER,
    "protein_g" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create meal_logs table
CREATE TABLE IF NOT EXISTS "meal_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "xp_earned" INTEGER NOT NULL DEFAULT 15,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "meal_logs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "meal_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "meal_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "diet_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "meal_logs_user_id_completed_at_idx" ON "meal_logs"("user_id", "completed_at");

-- Step 8: Create referrals table
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referred_id" TEXT NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 50,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referrer_id_referred_id_key" ON "referrals"("referrer_id", "referred_id");

-- Step 9: Create ad_views table
CREATE TABLE IF NOT EXISTS "ad_views" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "ad_type" TEXT NOT NULL,
    "reward_points" INTEGER NOT NULL DEFAULT 5,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_views_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ad_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ad_views_user_id_viewed_at_idx" ON "ad_views"("user_id", "viewed_at");

-- Step 10: Create dao_proposals table
CREATE TABLE IF NOT EXISTS "dao_proposals" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "proposer_wallet" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'ACTIVE',
    "votes_for" INTEGER NOT NULL DEFAULT 0,
    "votes_against" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dao_proposals_pkey" PRIMARY KEY ("id")
);

-- Step 11: Create dao_votes table
CREATE TABLE IF NOT EXISTS "dao_votes" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "voter_wallet" TEXT NOT NULL,
    "vote_type" "VoteType" NOT NULL,
    "vote_count" INTEGER NOT NULL DEFAULT 1,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dao_votes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "dao_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "dao_proposals"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "dao_votes_proposal_id_voter_wallet_key" ON "dao_votes"("proposal_id", "voter_wallet");

-- Step 12: Create burn_events table
CREATE TABLE IF NOT EXISTS "burn_events" (
    "id" TEXT NOT NULL,
    "amount_goalcoin" DOUBLE PRECISION NOT NULL,
    "tx_hash" TEXT,
    "source" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "burn_events_pkey" PRIMARY KEY ("id")
);

-- Success message
SELECT 'Fitness MVP features migration completed successfully!' as status;
