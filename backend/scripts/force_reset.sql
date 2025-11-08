-- GoalCoin FORCE RESET Script
-- This script will forcefully DROP ALL tables and types using CASCADE.
-- WARNING: This will delete ALL data in the database.

-- Drop all tables with CASCADE to remove all dependencies
DROP TABLE IF EXISTS "pools_ledger" CASCADE;
DROP TABLE IF EXISTS "commissions" CASCADE;
DROP TABLE IF EXISTS "payouts" CASCADE;
DROP TABLE IF EXISTS "reviews" CASCADE;
DROP TABLE IF EXISTS "review_assignments" CASCADE;
DROP TABLE IF EXISTS "submissions" CASCADE;
DROP TABLE IF EXISTS "payments" CASCADE;
DROP TABLE IF EXISTS "challenges" CASCADE;
DROP TABLE IF EXISTS "reviewer_wallets" CASCADE;
DROP TABLE IF EXISTS "audit_logs" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "revenue_splits" CASCADE;

-- Drop all enums with CASCADE
DROP TYPE IF EXISTS "PayoutStatus" CASCADE;
DROP TYPE IF EXISTS "VoteType" CASCADE;
DROP TYPE IF EXISTS "AssignmentStatus" CASCADE;
DROP TYPE IF EXISTS "SubmissionStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentTier" CASCADE;
DROP TYPE IF EXISTS "UserTier" CASCADE;

-- Recreate Enums
CREATE TYPE "UserTier" AS ENUM ('FAN', 'FOUNDER', 'PLAYER');
CREATE TYPE "PaymentTier" AS ENUM ('TIER_19', 'TIER_35', 'TIER_49');
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'APPEAL');
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'VOTED', 'REASSIGNED');
CREATE TYPE "VoteType" AS ENUM ('APPROVE', 'REJECT');
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'FAILED');

-- Recreate Users Table
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wallet" TEXT NOT NULL UNIQUE,
    "email" TEXT UNIQUE,
    "handle" TEXT UNIQUE,
    "country_code" TEXT,
    "tier" "UserTier" NOT NULL DEFAULT 'FAN',
    "founder_nft" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

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
    "user_id" TEXT NOT NULL,
    "tx_id" TEXT NOT NULL UNIQUE,
    "amount" DOUBLE PRECISION NOT NULL,
    "tier" "PaymentTier" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMP(3),
    "raw_webhook" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "week_no" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "watermark_code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "review_assignments" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "review_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "review_assignments_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "review_assignments_reviewer_wallet_assigned_at_idx" ON "review_assignments"("reviewer_wallet", "assigned_at");

CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "vote" "VoteType" NOT NULL,
    "voted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignment_id" TEXT NOT NULL UNIQUE,
    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "review_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "payout_id" TEXT,
    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "commissions_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "pools_ledger" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL UNIQUE,
    "prize_usdt" DOUBLE PRECISION NOT NULL,
    "treasury_usdt" DOUBLE PRECISION NOT NULL,
    "burn_usdt" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pools_ledger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pools_ledger_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
SELECT 'Database has been completely reset and recreated successfully!' as status;
