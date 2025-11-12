-- Create reviewer table
CREATE TABLE IF NOT EXISTS "reviewers" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "voting_weight" INTEGER NOT NULL DEFAULT 1,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviewers_pkey" PRIMARY KEY ("id")
);

-- Create submission table
CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "thumbnail" TEXT,
    "description" TEXT,
    "country_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- Create review table
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_wallet" TEXT NOT NULL,
    "vote" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "reviewers" ADD CONSTRAINT "reviewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews" ADD CONSTRAINT "reviews_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "reviewers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "reviewers_user_id_idx" ON "reviewers"("user_id");
CREATE INDEX IF NOT EXISTS "reviewers_status_idx" ON "reviewers"("status");
CREATE INDEX IF NOT EXISTS "submissions_user_id_idx" ON "submissions"("user_id");
CREATE INDEX IF NOT EXISTS "submissions_status_idx" ON "submissions"("status");
CREATE INDEX IF NOT EXISTS "reviews_submission_id_idx" ON "reviews"("submission_id");
CREATE INDEX IF NOT EXISTS "reviews_reviewer_wallet_idx" ON "reviews"("reviewer_wallet");
CREATE INDEX IF NOT EXISTS "audit_logs_reviewer_id_idx" ON "audit_logs"("reviewer_id");
