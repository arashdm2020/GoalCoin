-- GoalCoin Definitive Database Reset Script
-- This script will DROP all existing tables and types and recreate them from scratch.
-- WARNING: This will delete all data.

-- Drop all tables in reverse order of dependency
DROP TABLE IF EXISTS "pools_ledger";
DROP TABLE IF EXISTS "commissions";
DROP TABLE IF EXISTS "payouts";
DROP TABLE IF EXISTS "reviews";
DROP TABLE IF EXISTS "review_assignments";
DROP TABLE IF EXISTS "submissions";
DROP TABLE IF EXISTS "payments";
DROP TABLE IF EXISTS "challenges";
DROP TABLE IF EXISTS "reviewer_wallets";
DROP TABLE IF EXISTS "audit_logs";
-- The 'users' table is dropped last as many tables depend on it.
-- We will handle its migration separately.

-- Drop all enums
DROP TYPE IF EXISTS "PayoutStatus";
DROP TYPE IF EXISTS "VoteType";
DROP TYPE IF EXISTS "AssignmentStatus";
DROP TYPE IF EXISTS "SubmissionStatus";
DROP TYPE IF EXISTS "PaymentTier";
DROP TYPE IF EXISTS "UserTier";

-- Section 1: Recreate Users Table and Migrate Data
-- This ensures the 'users' table is correct before anything else.

-- Add new columns to 'users' table if they don't exist
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wallet" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'FAN';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "founder_nft" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Populate new columns from old ones
UPDATE "users" SET 
    "id" = COALESCE("id", 'user_' || EXTRACT(EPOCH FROM NOW()) || '_' || RANDOM()),
    "wallet" = COALESCE("wallet", "address"),
    "created_at" = COALESCE("created_at", "connectedAt", CURRENT_TIMESTAMP)
WHERE "id" IS NULL OR "wallet" IS NULL;

-- Apply constraints to the 'users' table
ALTER TABLE "users" ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");
ALTER TABLE "users" ADD CONSTRAINT "users_wallet_key" UNIQUE ("wallet");
ALTER TABLE "users" ALTER COLUMN "wallet" SET NOT NULL;


-- Section 2: Recreate All Other Tables and Enums from Scratch

-- Recreate Enums
CREATE TYPE "UserTier" AS ENUM ('FAN', 'FOUNDER', 'PLAYER');
CREATE TYPE "PaymentTier" AS ENUM ('TIER_19', 'TIER_35', 'TIER_49');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEAL');
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'VOTED', 'REASSIGNED');
CREATE TYPE "VoteType" AS ENUM ('APPROVE', 'REJECT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- Recreate All Other Tables
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '90-Day Challenge',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rules" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "tx_id" TEXT NOT NULL UNIQUE,
    "amount" DOUBLE PRECISION NOT NULL,
    "tier" "PaymentTier" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "raw_webhook" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "challenge_id" TEXT NOT NULL REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "week_no" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "watermark_code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "review_assignments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "reviewer_wallet" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "reviewer_wallet" TEXT NOT NULL,
    "vote" "VoteType" NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_id" TEXT NOT NULL UNIQUE REFERENCES "review_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reviewer_wallets" (
    "wallet" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accuracy_7d" DOUBLE PRECISION DEFAULT 100,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "wrong_votes" INTEGER NOT NULL DEFAULT 0,
    "suspended_until" TIMESTAMP(3),
    CONSTRAINT "reviewer_wallets_pkey" PRIMARY KEY ("wallet")
);

CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "amount_usdt" DOUBLE PRECISION NOT NULL,
    "tx_hash" TEXT,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commissions" (
    "id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "amount_usdt" DOUBLE PRECISION NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payout_id" TEXT REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pools_ledger" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL UNIQUE REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    "prize_usdt" DOUBLE PRECISION NOT NULL,
    "treasury_usdt" DOUBLE PRECISION NOT NULL,
    "burn_usdt" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pools_ledger_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "user_wallet" TEXT,
    "admin_user" TEXT,
    "old_data" JSONB,
    "new_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Final Confirmation
SELECT 'Database has been reset and recreated successfully.' as status;
