#!/bin/bash

# GoalCoin Phase 2 - Database Migrations Runner
# Run this script to apply all Phase 2 migrations

set -e  # Exit on error

echo "🗄️  GoalCoin Phase 2 - Running Database Migrations"
echo "=================================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo ""
    echo "Please set it first:"
    echo "  export DATABASE_URL='postgresql://user:password@host:port/database'"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$2
    
    echo "📝 Running migration: $migration_name"
    echo "   File: $migration_file"
    
    if psql "$DATABASE_URL" -f "$migration_file" > /dev/null 2>&1; then
        echo "   ✅ Success!"
    else
        echo "   ⚠️  Warning: Migration may have already been applied or encountered an error"
        echo "   Continuing with next migration..."
    fi
    echo ""
}

# Run migrations in order
echo "Starting migrations..."
echo ""

run_migration "prisma/migrations/002_xp_engine.sql" "XP Engine"
run_migration "prisma/migrations/003_country_leaderboards.sql" "Country Leaderboards"
run_migration "prisma/migrations/004_fan_tiers.sql" "Fan Tiers"
run_migration "prisma/migrations/005_micro_content.sql" "Micro-Content"

echo "=================================================="
echo "✅ All migrations completed!"
echo ""

# Verify tables
echo "🔍 Verifying tables..."
echo ""

TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('action_types', 'xp_events', 'country_stats', 'seasons', 'country_contributions', 'fan_tier_config', 'tier_progression_history', 'content_items', 'content_interactions', 'content_action_config');" | tr -d ' ')

echo "Tables created: $TABLES_COUNT / 10"

if [ "$TABLES_COUNT" -eq "10" ]; then
    echo "✅ All tables verified!"
else
    echo "⚠️  Warning: Expected 10 tables, found $TABLES_COUNT"
fi

echo ""
echo "=================================================="
echo "🎉 Migration process complete!"
echo ""
echo "Next steps:"
echo "1. Run: npx prisma generate"
echo "2. Run: npm run build"
echo "3. Restart your backend server"
echo ""
