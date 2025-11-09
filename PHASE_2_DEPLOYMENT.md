# 🚀 GoalCoin Phase 2 - Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Files Created:
- [x] XP Engine (migrations + service + routes)
- [x] Country Leaderboards (EWBI formula)
- [x] Fan Tier System (auto-progression)
- [x] Micro-Content Engine
- [x] People's Scoreboard
- [x] Treasury & Burn Events
- [x] Redis Caching (optional)
- [x] Health Monitoring

---

## 🗄️ Database Migrations

### Step 1: Run Migrations in Order

```bash
# Connect to your PostgreSQL database
psql $DATABASE_URL

# Run migrations
\i backend/prisma/migrations/002_xp_engine.sql
\i backend/prisma/migrations/003_country_leaderboards.sql
\i backend/prisma/migrations/004_fan_tiers.sql
\i backend/prisma/migrations/005_micro_content.sql
```

### Step 2: Verify Tables Created

```sql
-- Check new tables
\dt

-- Should see:
-- action_types
-- xp_events
-- country_stats
-- seasons
-- country_contributions
-- fan_tier_config
-- tier_progression_history
-- content_items
-- content_interactions
-- content_action_config
```

---

## 🔧 Environment Variables

### Add to Render.com:

```bash
# Phase 2 Features
ENABLE_COUNTRY_LEADERBOARDS=true
ENABLE_FAN_TIERS=true
ENABLE_MICRO_CONTENT=true
BUFFER_FACTOR=500

# Redis (Optional - for caching)
REDIS_URL=redis://your-redis-url:6379

# Existing variables (keep these)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=...
COINPAYMENTS_IPN_SECRET=...
```

---

## 📦 Backend Deployment

### Step 1: Install Dependencies

```bash
cd backend
npm install ioredis  # For Redis caching (optional)
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Phase 2: XP Engine, Country Leaderboards, Fan Tiers, Content, Treasury, Health"
git push origin main
```

### Step 3: Deploy to Render.com

Render.com will auto-deploy from GitHub.

Monitor: https://dashboard.render.com

---

## 🌐 Frontend Updates (Optional)

### Create Frontend Components:

1. **Tier Badge Component**
```tsx
// frontend/src/components/TierBadge.tsx
export function TierBadge({ tier }: { tier: string }) {
  const icons = {
    ROOKIE: '🌱',
    SUPPORTER: '💪',
    PRO: '🏆',
    ELITE: '⭐',
    LEGEND: '👑'
  };
  return <span>{icons[tier]} {tier}</span>;
}
```

2. **Country Leaderboard Page**
```tsx
// frontend/src/app/country-leaderboard/page.tsx
// Fetch from /api/leaderboards/country
```

3. **People's Scoreboard Widget**
```tsx
// frontend/src/components/ScoreboardWidget.tsx
// Fetch from /api/scoreboard/my-country
```

---

## 🧪 Testing Endpoints

### 1. XP Engine

```bash
# Award XP
curl -X POST https://goalcoin.onrender.com/api/xp/event \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"actionKey": "workout_cardio"}'

# Get actions
curl https://goalcoin.onrender.com/api/xp/actions
```

### 2. Country Leaderboards

```bash
# Global leaderboard
curl https://goalcoin.onrender.com/api/leaderboards/country

# My country rank
curl https://goalcoin.onrender.com/api/leaderboards/my-country \
  -H "Authorization: Bearer YOUR_JWT"

# My contribution
curl https://goalcoin.onrender.com/api/leaderboards/my-contribution \
  -H "Authorization: Bearer YOUR_JWT"
```

### 3. People's Scoreboard

```bash
# World index
curl https://goalcoin.onrender.com/api/scoreboard/world-index

# My country widget
curl https://goalcoin.onrender.com/api/scoreboard/my-country \
  -H "Authorization: Bearer YOUR_JWT"
```

### 4. Treasury & Burn Events

```bash
# Get burn events
curl https://goalcoin.onrender.com/api/treasury/burn-events

# Create burn event (admin)
curl -X POST https://goalcoin.onrender.com/api/treasury/admin/burn-events \
  -H "Authorization: Basic BASE64_ADMIN_CREDS" \
  -H "Content-Type: application/json" \
  -d '{"amountGoalcoin": 1000, "source": "treasury_buyback"}'
```

### 5. Health Monitoring

```bash
# Health check
curl https://goalcoin.onrender.com/api/dev/health

# Metrics
curl https://goalcoin.onrender.com/api/dev/metrics
```

---

## 📊 Post-Deployment Verification

### Check Logs:

```bash
# Render.com Dashboard → Logs
# Look for:
✅ Redis connected successfully (if enabled)
✅ Prisma client initialized
✅ Server running on port 3001
```

### Test Database:

```sql
-- Check action types seeded
SELECT COUNT(*) FROM action_types;
-- Should return 17

-- Check fan tier config
SELECT * FROM fan_tier_config;
-- Should return 5 tiers

-- Check content items
SELECT COUNT(*) FROM content_items;
-- Should return 5 sample items
```

### Test APIs:

1. Visit: `https://goalcoin.onrender.com/api/dev/health`
   - Should return `{"status": "healthy"}`

2. Visit: `https://goalcoin.onrender.com/api/xp/actions`
   - Should return list of 17 action types

3. Visit: `https://goalcoin.onrender.com/api/leaderboards/country`
   - Should return country leaderboard (may be empty initially)

---

## 🔄 Background Jobs

### Add Cron Jobs (Optional):

```typescript
// In backend/src/index.ts (already exists)

// Update streaks daily at midnight
cron.schedule('0 0 * * *', async () => {
  await xpService.updateStreaks();
  await countryLeaderboardService.updateActiveUserCounts();
});

// Refresh leaderboard materialized view every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY country_leaderboard`;
});
```

---

## 🐛 Troubleshooting

### Issue: TypeScript Errors

```bash
# Regenerate Prisma client after migrations
cd backend
npx prisma generate
npm run build
```

### Issue: Redis Connection Failed

```bash
# Redis is optional - app will work without it
# To enable: Add REDIS_URL to environment variables
# Or use Render.com Redis add-on
```

### Issue: Migration Errors

```bash
# Check if tables already exist
psql $DATABASE_URL -c "\dt"

# Drop and recreate if needed (CAUTION: loses data)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS xp_events CASCADE;"
```

---

## 📈 Monitoring

### Key Metrics to Watch:

1. **API Response Times**
   - Target: <200ms (p95)
   - Check: `/api/dev/health`

2. **Database Connections**
   - Target: 10-20 active
   - Check Render.com metrics

3. **Memory Usage**
   - Target: <512MB
   - Check: `/api/dev/health`

4. **Cache Hit Rate** (if Redis enabled)
   - Target: >90%
   - Check: `/api/dev/health`

---

## ✅ Success Criteria

- [ ] All migrations run successfully
- [ ] Health endpoint returns 200
- [ ] XP can be awarded
- [ ] Country leaderboard populates
- [ ] Fan tiers auto-upgrade
- [ ] Content feed loads
- [ ] Burn events can be created
- [ ] No critical errors in logs

---

## 🎉 Phase 2 Complete!

**Next Steps:**
1. Monitor production for 24-48 hours
2. Gather user feedback
3. Plan Phase 3: Message Queue & Advanced Analytics

---

**Deployment Date:** November 9, 2025  
**Status:** ✅ Ready for Production
