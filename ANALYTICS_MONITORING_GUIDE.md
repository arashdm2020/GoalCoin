# 📊 Analytics & Monitoring Guide

## Overview
Comprehensive analytics and monitoring setup for GoalCoin platform.

---

## 🎯 Key Metrics to Track

### User Metrics
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- User retention (7-day, 30-day)
- Signup conversion rate
- Wallet connection rate

### Engagement Metrics
- XP earned per user
- Streak lengths
- Workout completion rate
- Meal logging rate
- Referral conversion rate

### Financial Metrics
- Revenue (daily, monthly)
- Tier distribution
- Average revenue per user (ARPU)
- Payment success rate
- Burn rate & treasury balance

### Performance Metrics
- API response times
- Error rates
- Database query performance
- Cache hit rates
- Uptime percentage

---

## 🔧 Analytics Stack

### Option 1: Self-Hosted (Recommended)
```
PostgreSQL → Event Stream → ClickHouse → Metabase
```

**Benefits:**
- Full data ownership
- No data limits
- Cost-effective
- Custom queries

### Option 2: Cloud Services
```
PostgreSQL → Segment → Mixpanel/Amplitude
```

**Benefits:**
- Quick setup
- Pre-built dashboards
- Real-time analytics
- Easy integration

---

## 📊 Event Tracking Schema

### Event Log Table
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  country_code TEXT,
  device_type TEXT,
  platform TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_country ON analytics_events(country_code);
```

### Key Events to Track
```typescript
// User Events
- user_signup
- wallet_connected
- email_verified
- profile_updated

// Engagement Events
- workout_completed
- meal_logged
- warmup_completed
- streak_milestone (7, 30, 90 days)

// Financial Events
- tier_purchased
- payment_initiated
- payment_completed
- payment_failed

// Social Events
- referral_sent
- referral_activated
- content_shared
- leaderboard_viewed

// DAO Events
- proposal_created
- vote_cast
- proposal_executed
```

---

## 💻 Implementation

### Event Tracking Service
```typescript
// backend/src/services/analyticsService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsService = {
  async trackEvent(params: {
    eventName: string;
    userId?: string;
    sessionId?: string;
    properties?: Record<string, any>;
    countryCode?: string;
    deviceType?: string;
    platform?: string;
  }) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          event_name: params.eventName,
          user_id: params.userId,
          session_id: params.sessionId,
          properties: params.properties || {},
          country_code: params.countryCode,
          device_type: params.deviceType,
          platform: params.platform,
        },
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Analytics tracking error:', error);
    }
  },

  async getUserMetrics(userId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const events = await prisma.analyticsEvent.groupBy({
      by: ['event_name'],
      where: {
        user_id: userId,
        created_at: { gte: since },
      },
      _count: true,
    });

    return events.map(e => ({
      event: e.event_name,
      count: e._count,
    }));
  },

  async getPlatformMetrics(days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [dau, mau, totalEvents, topEvents] = await Promise.all([
      // Daily Active Users
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: {
          created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          user_id: { not: null },
        },
      }),

      // Monthly Active Users
      prisma.analyticsEvent.groupBy({
        by: ['user_id'],
        where: {
          created_at: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          user_id: { not: null },
        },
      }),

      // Total Events
      prisma.analyticsEvent.count({
        where: { created_at: { gte: since } },
      }),

      // Top Events
      prisma.analyticsEvent.groupBy({
        by: ['event_name'],
        where: { created_at: { gte: since } },
        _count: true,
        orderBy: { _count: { event_name: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      dau: dau.length,
      mau: mau.length,
      total_events: totalEvents,
      top_events: topEvents.map(e => ({
        name: e.event_name,
        count: e._count,
      })),
    };
  },
};
```

### Usage Example
```typescript
// In any controller/service
import { analyticsService } from './analyticsService';

// Track workout completion
await analyticsService.trackEvent({
  eventName: 'workout_completed',
  userId: user.id,
  properties: {
    workout_type: 'cardio',
    duration_min: 30,
    xp_earned: 10,
  },
  countryCode: user.country_code,
});
```

---

## 📈 Dashboard Setup

### Metabase (Open Source)
```bash
# Docker setup
docker run -d -p 3000:3000 \
  -e "MB_DB_TYPE=postgres" \
  -e "MB_DB_DBNAME=goalcoin" \
  -e "MB_DB_PORT=5432" \
  -e "MB_DB_USER=goalcoin_user" \
  -e "MB_DB_PASS=password" \
  -e "MB_DB_HOST=db_host" \
  --name metabase metabase/metabase
```

### Key Dashboards
1. **Executive Dashboard**
   - DAU/MAU trends
   - Revenue metrics
   - User growth
   - Engagement rates

2. **Product Dashboard**
   - Feature usage
   - Funnel conversions
   - Retention cohorts
   - A/B test results

3. **Operations Dashboard**
   - System health
   - Error rates
   - API performance
   - Database metrics

---

## 🚨 Monitoring & Alerts

### Health Checks
```typescript
// backend/src/routes/healthRoutes.ts
router.get('/health', async (req, res) => {
  const checks = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkExternalAPIs(),
  ]);

  const healthy = checks.every(c => c.status === 'ok');

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date(),
  });
});
```

### Error Tracking
**Recommended: Sentry**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Error handler middleware
app.use(Sentry.Handlers.errorHandler());
```

### Uptime Monitoring
**Options:**
- UptimeRobot (free)
- Pingdom
- StatusCake
- Better Uptime

---

## 📊 SQL Queries for Common Metrics

### Daily Active Users
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### Retention Cohort
```sql
WITH cohorts AS (
  SELECT 
    user_id,
    DATE_TRUNC('month', created_at) as cohort_month
  FROM users
)
SELECT 
  c.cohort_month,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE 
    WHEN e.created_at >= c.cohort_month + INTERVAL '7 days' 
    THEN e.user_id 
  END) as retained_7d
FROM cohorts c
LEFT JOIN analytics_events e ON c.user_id = e.user_id
GROUP BY c.cohort_month
ORDER BY c.cohort_month DESC;
```

### Revenue by Tier
```sql
SELECT 
  tier,
  COUNT(*) as users,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_revenue
FROM payments
WHERE status = 'completed'
GROUP BY tier
ORDER BY total_revenue DESC;
```

---

## 💰 Cost Estimates

### Self-Hosted (Recommended)
- ClickHouse: $0 (self-hosted)
- Metabase: $0 (open-source)
- Storage: ~$10/month
- **Total: ~$10/month**

### Cloud Services
- Mixpanel: $25-89/month
- Sentry: $26/month
- Uptime Robot: $0-7/month
- **Total: ~$50-120/month**

---

## 🚀 Implementation Priority

### Phase 1 (MVP)
- ✅ Basic event tracking
- ✅ User metrics
- ⏳ Simple dashboards

### Phase 2
- 🔄 Advanced analytics
- 🔄 Cohort analysis
- 🔄 A/B testing framework

### Phase 3
- 🔄 ML-powered insights
- 🔄 Predictive analytics
- 🔄 Automated alerts

---

**Status:** Documentation complete, basic tracking ready, advanced features for Phase 2
