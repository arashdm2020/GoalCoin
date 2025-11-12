-- Create the feature_toggles table
CREATE TABLE "feature_toggles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL
);

-- Create a unique index on the "key" column
CREATE UNIQUE INDEX "feature_toggles_key_key" ON "feature_toggles"("key");
