-- Safe migration for GoalCoin schema update
-- This migration handles the transition from old User schema to new schema

-- Step 1: Add new columns as nullable first (safe for existing data)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wallet" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "country_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tier" TEXT DEFAULT 'FAN';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "founder_nft" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Backfill data for existing records
-- Generate IDs for existing records that don't have them
UPDATE "users" 
SET "id" = 'user_' || EXTRACT(EPOCH FROM NOW())::TEXT || '_' || ROW_NUMBER() OVER (ORDER BY COALESCE("created_at", NOW()))
WHERE "id" IS NULL;

-- Copy address to wallet if wallet is empty and address exists
UPDATE "users" 
SET "wallet" = "address" 
WHERE "wallet" IS NULL AND "address" IS NOT NULL;

-- Set default values for other fields
UPDATE "users" 
SET "tier" = 'FAN' 
WHERE "tier" IS NULL;

UPDATE "users" 
SET "founder_nft" = false 
WHERE "founder_nft" IS NULL;

UPDATE "users" 
SET "created_at" = COALESCE("connectedAt", NOW()) 
WHERE "created_at" IS NULL;

-- Step 3: Make required columns non-nullable and add constraints
ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "wallet" SET NOT NULL;

-- Step 4: Add unique constraints
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_id_key" UNIQUE ("id");
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_wallet_key" UNIQUE ("wallet");
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_email_key" UNIQUE ("email");
ALTER TABLE "users" ADD CONSTRAINT IF NOT EXISTS "users_handle_key" UNIQUE ("handle");

-- Step 5: Set primary key if not already set
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'PRIMARY KEY' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE "users" ADD PRIMARY KEY ("id");
    END IF;
END $$;

-- Step 6: Create UserTier enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserTier') THEN
        CREATE TYPE "UserTier" AS ENUM ('FAN', 'FOUNDER', 'PLAYER');
    END IF;
END $$;

-- Step 7: Create other required enums
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentTier') THEN
        CREATE TYPE "PaymentTier" AS ENUM ('TIER_19', 'TIER_35', 'TIER_49');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SubmissionStatus') THEN
        CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEAL');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AssignmentStatus') THEN
        CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'VOTED', 'REASSIGNED');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'VoteType') THEN
        CREATE TYPE "VoteType" AS ENUM ('APPROVE', 'REJECT');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PayoutStatus') THEN
        CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
    END IF;
END $$;

-- Step 8: Update tier column to use enum
ALTER TABLE "users" ALTER COLUMN "tier" TYPE "UserTier" USING "tier"::"UserTier";

-- Step 9: Create all other required tables if they don't exist

-- Challenges table
CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '90-Day Challenge',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rules" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- Payments table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tx_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tier" "PaymentTier" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "raw_webhook" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_tx_id_key" UNIQUE ("tx_id")
);

-- Submissions table
CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "week_no" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "watermark_code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- Review assignments table
CREATE TABLE IF NOT EXISTS "review_assignments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

-- Reviews table
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "vote" "VoteType" NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_id" TEXT NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_assignment_id_key" UNIQUE ("assignment_id")
);

-- Reviewer wallets table
CREATE TABLE IF NOT EXISTS "reviewer_wallets" (
    "wallet" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accuracy_7d" DOUBLE PRECISION DEFAULT 100,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "wrong_votes" INTEGER NOT NULL DEFAULT 0,
    "suspended_until" TIMESTAMP(3),
    CONSTRAINT "reviewer_wallets_pkey" PRIMARY KEY ("wallet")
);

-- Commissions table
CREATE TABLE IF NOT EXISTS "commissions" (
    "id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "amount_usdt" DOUBLE PRECISION NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payout_id" TEXT,
    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- Payouts table
CREATE TABLE IF NOT EXISTS "payouts" (
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

-- Pools ledger table
CREATE TABLE IF NOT EXISTS "pools_ledger" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "prize_usdt" DOUBLE PRECISION NOT NULL,
    "treasury_usdt" DOUBLE PRECISION NOT NULL,
    "burn_usdt" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pools_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pools_ledger_payment_id_key" UNIQUE ("payment_id")
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS "audit_logs" (
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

-- Step 10: Add foreign key constraints
ALTER TABLE "payments" ADD CONSTRAINT IF NOT EXISTS "payments_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "submissions" ADD CONSTRAINT IF NOT EXISTS "submissions_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "submissions" ADD CONSTRAINT IF NOT EXISTS "submissions_challenge_id_fkey" 
    FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "review_assignments" ADD CONSTRAINT IF NOT EXISTS "review_assignments_submission_id_fkey" 
    FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT IF NOT EXISTS "reviews_submission_id_fkey" 
    FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT IF NOT EXISTS "reviews_assignment_id_fkey" 
    FOREIGN KEY ("assignment_id") REFERENCES "review_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commissions" ADD CONSTRAINT IF NOT EXISTS "commissions_payout_id_fkey" 
    FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "pools_ledger" ADD CONSTRAINT IF NOT EXISTS "pools_ledger_payment_id_fkey" 
    FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS "review_assignments_reviewer_wallet_assigned_at_idx" 
    ON "review_assignments"("reviewer_wallet", "assigned_at");

-- Step 12: Clean up old columns (optional - can be done later)
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "address";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "connectedAt";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "online";
-- ALTER TABLE "users" DROP COLUMN IF EXISTS "lastSeen";

-- Migration completed successfully
