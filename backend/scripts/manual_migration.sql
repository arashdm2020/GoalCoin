-- GoalCoin Manual Database Migration
-- This script creates all necessary tables and relationships.
-- Execute this directly on your Render.com PostgreSQL database.

-- Create Enums (Custom Types) if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'usertier') THEN
        CREATE TYPE "UserTier" AS ENUM ('FAN', 'FOUNDER', 'PLAYER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paymenttier') THEN
        CREATE TYPE "PaymentTier" AS ENUM ('TIER_19', 'TIER_35', 'TIER_49');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'submissionstatus') THEN
        CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignmentstatus') THEN
        CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'VOTED', 'REASSIGNED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'votetype') THEN
        CREATE TYPE "VoteType" AS ENUM ('APPROVE', 'REJECT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payoutstatus') THEN
        CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');
    END IF;
END
$$;

-- Create challenges Table
CREATE TABLE IF NOT EXISTS "challenges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '90-Day Challenge',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rules" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- Create payments Table
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
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Create submissions Table
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

-- Create review_assignments Table
CREATE TABLE IF NOT EXISTS "review_assignments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id")
);

-- Create reviews Table
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "vote" "VoteType" NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_id" TEXT NOT NULL,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Create reviewer_wallets Table
CREATE TABLE IF NOT EXISTS "reviewer_wallets" (
    "wallet" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "accuracy_7d" DOUBLE PRECISION DEFAULT 100,
    "total_votes" INTEGER NOT NULL DEFAULT 0,
    "wrong_votes" INTEGER NOT NULL DEFAULT 0,
    "suspended_until" TIMESTAMP(3),
    CONSTRAINT "reviewer_wallets_pkey" PRIMARY KEY ("wallet")
);

-- Create commissions Table
CREATE TABLE IF NOT EXISTS "commissions" (
    "id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "amount_usdt" DOUBLE PRECISION NOT NULL,
    "earned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payout_id" TEXT,
    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- Create payouts Table
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

-- Create pools_ledger Table
CREATE TABLE IF NOT EXISTS "pools_ledger" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "prize_usdt" DOUBLE PRECISION NOT NULL,
    "treasury_usdt" DOUBLE PRECISION NOT NULL,
    "burn_usdt" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pools_ledger_pkey" PRIMARY KEY ("id")
);

-- Create audit_logs Table
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

-- Add Columns and Constraints IF NOT EXISTS
DO $$
BEGIN
    -- Add columns to existing tables if they are missing
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'payments') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'tx_id') THEN
            ALTER TABLE "payments" ADD COLUMN "tx_id" TEXT;
        END IF;
    END IF;

    -- Add Constraints
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'payments_tx_id_key') THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_tx_id_key" UNIQUE ("tx_id");
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'reviews_assignment_id_key') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_assignment_id_key" UNIQUE ("assignment_id");
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'pools_ledger_payment_id_key') THEN
        ALTER TABLE "pools_ledger" ADD CONSTRAINT "pools_ledger_payment_id_key" UNIQUE ("payment_id");
    END IF;
END
$$;

-- Add Foreign Key Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'payments_user_id_fkey') THEN
        ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'submissions_user_id_fkey') THEN
        ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'submissions_challenge_id_fkey') THEN
        ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'review_assignments_submission_id_fkey') THEN
        ALTER TABLE "review_assignments" ADD CONSTRAINT "review_assignments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'reviews_submission_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'reviews_assignment_id_fkey') THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "review_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'commissions_payout_id_fkey') THEN
        ALTER TABLE "commissions" ADD CONSTRAINT "commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'pools_ledger_payment_id_fkey') THEN
        ALTER TABLE "pools_ledger" ADD CONSTRAINT "pools_ledger_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END
$$;

-- Create Indexes
CREATE INDEX IF NOT EXISTS "review_assignments_reviewer_wallet_assigned_at_idx" ON "review_assignments"("reviewer_wallet", "assigned_at");

-- Final Confirmation
SELECT 'Manual migration completed successfully.' as status;
