# 🚀 GoalCoin Phase 2 - Quick Start Guide

## 📊 Current Status: Phase 1 Complete (75%)

### ✅ What's Working
- Hybrid auth (email + wallet)
- Basic XP tracking
- Payment system
- Submission reviews
- Admin dashboard

### ❌ What's Missing (Phase 2)
- Configurable XP engine with multipliers
- Fan tier auto-progression
- Country leaderboards (EWBI formula)
- Micro-content engine
- Redis caching
- Message queue
- Advanced analytics

---

## 🎯 Phase 2 Priority Order

### Week 1-2: XP Engine Refactor 🔴 CRITICAL
**Why:** Foundation for all other features

**Tasks:**
1. Create `action_types` table
2. Implement XP service with multipliers
3. Add streak calculation (+2% every 7 days)
4. Add milestone bonuses (90-day = 1.5×)
5. Implement cooldowns and daily caps

**Files to Create:**
- `backend/prisma/migrations/002_xp_engine.sql`
- `backend/src/services/xpService.ts`
- `backend/src/routes/xpRoutes.ts`

### Week 3-4: Country Leaderboards 🔴 CRITICAL
**Why:** Core competitive feature

**Tasks:**
1. Create `country_stats` table
2. Implement EWBI formula
3. Add seasonal rotation
4. Create background aggregators
5. Build leaderboard API

**Formula:**
```
Country_Score = Σ(User_XP × StreakMult) / √(ActiveUsers + 500)
```

### Week 5-6: Infrastructure 🟡 HIGH
**Why:** Performance and scalability

**Tasks:**
1. Set up Redis caching
2. Add message queue (RabbitMQ)
3. Implement health monitoring
4. Add rate limiting

### Week 7-8: Fan Tiers & Content 🟡 MEDIUM
**Why:** User engagement

**Tasks:**
1. Fan tier auto-progression
2. Micro-content engine
3. Enhanced admin dashboard

---

## 🛠️ Quick Implementation Steps

### Step 1: Database Migrations

```sql
-- Create action_types table
CREATE TABLE action_types (
  action_key VARCHAR(50) PRIMARY KEY,
  xp_value INT NOT NULL,
  cooldown_sec INT DEFAULT 0,
  daily_cap INT DEFAULT 0,
  enabled BOOLEAN DEFAULT true
);

-- Seed initial actions
INSERT INTO action_types VALUES
('warmup_session', 10, 3600, 3, true),
('workout_cardio', 20, 3600, 2, true),
('meal_log', 15, 14400, 3, true);

-- Add multiplier columns
ALTER TABLE users ADD COLUMN streak_multiplier FLOAT DEFAULT 1.0;
ALTER TABLE users ADD COLUMN milestone_multiplier FLOAT DEFAULT 1.0;

-- Country stats
CREATE TABLE country_stats (
  country_code VARCHAR(2) PRIMARY KEY,
  total_xp BIGINT DEFAULT 0,
  active_users INT DEFAULT 0,
  country_score FLOAT,
  buffer_factor INT DEFAULT 500
);
```

### Step 2: XP Service

```typescript
// backend/src/services/xpService.ts
class XPService {
  async awardXP(userId: string, actionKey: string) {
    // 1. Get action config
    const action = await prisma.actionType.findUnique({
      where: { action_key: actionKey }
    });
    
    // 2. Check cooldown
    // 3. Calculate multipliers
    // 4. Award XP
    // 5. Update country stats
  }
}
```

### Step 3: API Endpoints

```typescript
POST /api/xp/event          # Award XP
GET  /api/xp/actions        # List actions
GET  /api/leaderboards/country  # Country rankings
```

---

## 📦 Environment Variables Needed

```bash
# Add to .env
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
ENABLE_COUNTRY_LEADERBOARDS=true
BUFFER_FACTOR=500
```

---

## 🧪 Testing Checklist

- [ ] XP multipliers calculate correctly
- [ ] Cooldowns enforced
- [ ] Daily caps working
- [ ] Country scores update
- [ ] Leaderboards cached
- [ ] Health endpoint responds

---

## 📞 Next Actions

1. **Review** `ARCHITECTURE_REVIEW.md` for full details
2. **Start** with XP engine refactor
3. **Deploy** incrementally
4. **Monitor** performance

**Estimated Time:** 8 weeks  
**Team Size:** 2-3 developers  
**Status:** Ready to begin
