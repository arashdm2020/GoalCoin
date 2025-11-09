# 🗄️ Database Migrations - Quick Run Guide

## ⚠️ IMPORTANT: Run these commands on your PostgreSQL database

### Option 1: Using psql Command Line

```bash
# Set your database URL
export DATABASE_URL="postgresql://user:password@host:port/database"

# Or on Windows PowerShell:
$env:DATABASE_URL="postgresql://user:password@host:port/database"

# Run all migrations in order
psql $DATABASE_URL -f backend/prisma/migrations/002_xp_engine.sql
psql $DATABASE_URL -f backend/prisma/migrations/003_country_leaderboards.sql
psql $DATABASE_URL -f backend/prisma/migrations/004_fan_tiers.sql
psql $DATABASE_URL -f backend/prisma/migrations/005_micro_content.sql
```

### Option 2: Using Render.com Shell

1. Go to https://dashboard.render.com
2. Select your PostgreSQL database
3. Click "Connect" → "External Connection"
4. Copy the connection string
5. Use psql or any PostgreSQL client to run migrations

### Option 3: Direct SQL Execution

Connect to your database and run each file's content manually:

#### Migration 1: XP Engine
```sql
-- Copy and paste content from: backend/prisma/migrations/002_xp_engine.sql
```

#### Migration 2: Country Leaderboards
```sql
-- Copy and paste content from: backend/prisma/migrations/003_country_leaderboards.sql
```

#### Migration 3: Fan Tiers
```sql
-- Copy and paste content from: backend/prisma/migrations/004_fan_tiers.sql
```

#### Migration 4: Micro-Content
```sql
-- Copy and paste content from: backend/prisma/migrations/005_micro_content.sql
```

---

## ✅ Verification Commands

After running migrations, verify tables were created:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'action_types',
  'xp_events',
  'country_stats',
  'seasons',
  'country_contributions',
  'fan_tier_config',
  'tier_progression_history',
  'content_items',
  'content_interactions',
  'content_action_config'
);

-- Should return 10 rows

-- Check action types seeded
SELECT COUNT(*) FROM action_types;
-- Should return: 17

-- Check fan tiers seeded
SELECT COUNT(*) FROM fan_tier_config;
-- Should return: 5

-- Check content items seeded
SELECT COUNT(*) FROM content_items;
-- Should return: 5
```

---

## 🔄 If Migrations Fail

### Error: "relation already exists"
```sql
-- Tables already exist, skip that migration
-- Or drop and recreate (CAUTION: loses data)
DROP TABLE IF EXISTS xp_events CASCADE;
DROP TABLE IF EXISTS action_types CASCADE;
-- Then re-run migration
```

### Error: "column already exists"
```sql
-- Column already added, safe to ignore
-- Or check if it needs updating
ALTER TABLE users ALTER COLUMN streak_multiplier SET DEFAULT 1.0;
```

---

## 📊 Post-Migration Steps

### 1. Regenerate Prisma Client (Important!)

```bash
cd backend
npx prisma generate
```

This will update TypeScript types to include new columns like `fan_tier`, `tier_updated_at`, etc.

### 2. Rebuild Backend

```bash
cd backend
npm run build
```

### 3. Restart Backend Server

If running locally:
```bash
npm run dev
```

If on Render.com:
- Deployment will auto-restart after git push

---

## 🧪 Test Migrations

### Test XP Engine:
```bash
curl -X POST https://goalcoin.onrender.com/api/xp/event \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"actionKey": "daily_login"}'
```

### Test Country Leaderboards:
```bash
curl https://goalcoin.onrender.com/api/leaderboards/country
```

### Test Health:
```bash
curl https://goalcoin.onrender.com/api/dev/health
```

---

## 📝 Migration Summary

| Migration | Tables Created | Rows Seeded |
|-----------|----------------|-------------|
| 002_xp_engine.sql | action_types, xp_events | 17 actions |
| 003_country_leaderboards.sql | country_stats, seasons, country_contributions | 1 season |
| 004_fan_tiers.sql | fan_tier_config, tier_progression_history | 5 tiers |
| 005_micro_content.sql | content_items, content_interactions, content_action_config | 5 items, 5 actions |

**Total:** 10 new tables, ~32 seeded rows

---

## ✅ Success Indicators

After migrations complete:

- [ ] All 10 tables exist
- [ ] 17 action types seeded
- [ ] 5 fan tiers seeded
- [ ] 5 content items seeded
- [ ] No errors in migration output
- [ ] `npx prisma generate` runs successfully
- [ ] Backend builds without errors
- [ ] Health endpoint returns 200

---

**Status:** Ready to run migrations  
**Estimated Time:** 2-5 minutes  
**Risk:** LOW (migrations are idempotent)
