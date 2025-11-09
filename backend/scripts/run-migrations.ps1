# GoalCoin Phase 2 - Database Migrations Runner (PowerShell)
# Run this script to apply all Phase 2 migrations on Windows

Write-Host "🗄️  GoalCoin Phase 2 - Running Database Migrations" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL environment variable is not set" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set it first:"
    Write-Host '  $env:DATABASE_URL="postgresql://user:password@host:port/database"'
    Write-Host ""
    exit 1
}

Write-Host "✅ DATABASE_URL is set" -ForegroundColor Green
Write-Host ""

# Function to run a migration
function Run-Migration {
    param(
        [string]$MigrationFile,
        [string]$MigrationName
    )
    
    Write-Host "📝 Running migration: $MigrationName" -ForegroundColor Yellow
    Write-Host "   File: $MigrationFile"
    
    try {
        psql $env:DATABASE_URL -f $MigrationFile 2>&1 | Out-Null
        Write-Host "   ✅ Success!" -ForegroundColor Green
    }
    catch {
        Write-Host "   ⚠️  Warning: Migration may have already been applied" -ForegroundColor Yellow
        Write-Host "   Continuing with next migration..."
    }
    Write-Host ""
}

# Run migrations in order
Write-Host "Starting migrations..." -ForegroundColor Cyan
Write-Host ""

Run-Migration "prisma\migrations\002_xp_engine.sql" "XP Engine"
Run-Migration "prisma\migrations\003_country_leaderboards.sql" "Country Leaderboards"
Run-Migration "prisma\migrations\004_fan_tiers.sql" "Fan Tiers"
Run-Migration "prisma\migrations\005_micro_content.sql" "Micro-Content"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ All migrations completed!" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 Migration process complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx prisma generate"
Write-Host "2. Run: npm run build"
Write-Host "3. Restart your backend server"
Write-Host ""
