# GoalCoin API Reference - New Endpoints

## Base URL
- **Production**: `https://goalcoin.onrender.com`
- **Local**: `http://localhost:3001`

---

## 🏋️ Fitness API (`/api/fitness`)

### Get Warmup Sessions
```http
GET /api/fitness/warmup-sessions
```

**Response:**
```json
[
  {
    "id": "clxxx",
    "title": "Dynamic Stretching Routine",
    "description": "A 5-minute dynamic stretching routine",
    "video_url": "https://example.com/video",
    "duration_min": 5,
    "order": 1,
    "active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Log Warmup Completion
```http
POST /api/fitness/warmup/log
Content-Type: application/json

{
  "userId": "user_id",
  "sessionId": "session_id"
}
```

**Response:**
```json
{
  "success": true,
  "log": { ... },
  "xp_earned": 10
}
```

### Log Workout
```http
POST /api/fitness/workout/log
Content-Type: application/json

{
  "userId": "user_id",
  "workoutType": "cardio",
  "durationMin": 30
}
```

**Response:**
```json
{
  "success": true,
  "log": { ... },
  "xp_earned": 20
}
```

### Get Diet Plans
```http
GET /api/fitness/diet-plans?tier=BALANCED&region=Global
```

**Query Parameters:**
- `tier` (optional): `BUDGET`, `BALANCED`, `PROTEIN_BOOST`
- `region` (optional): `Global`, `Middle East`, `Mediterranean`, etc.

**Response:**
```json
[
  {
    "id": "clxxx",
    "title": "Grilled Chicken & Quinoa",
    "tier": "BALANCED",
    "region": "Global",
    "description": "Balanced meal with lean protein",
    "ingredients": "150g chicken breast, 1 cup quinoa...",
    "instructions": "Grill seasoned chicken...",
    "calories": 520,
    "protein_g": 42,
    "active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Log Meal
```http
POST /api/fitness/meal/log
Content-Type: application/json

{
  "userId": "user_id",
  "planId": "plan_id"
}
```

**Response:**
```json
{
  "success": true,
  "log": { ... },
  "xp_earned": 15
}
```

### Get User Progress
```http
GET /api/fitness/progress/:userId
```

**Response:**
```json
{
  "xp_points": 150,
  "goal_points": 75,
  "current_streak": 7,
  "longest_streak": 14,
  "burn_multiplier": 1.2,
  "last_activity_date": "2024-01-08T00:00:00.000Z",
  "activity_counts": {
    "warmups": 20,
    "workouts": 15,
    "meals": 25
  }
}
```

---

## 🌉 Utility Bridge API (`/api/utility-bridge`)

### Create Referral
```http
POST /api/utility-bridge/referral
Content-Type: application/json

{
  "referrerId": "referrer_user_id",
  "referredId": "referred_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "referral": { ... },
  "points_earned": 50
}
```

### Get User Referrals
```http
GET /api/utility-bridge/referrals/:userId
```

**Response:**
```json
{
  "referrals": [
    {
      "id": "clxxx",
      "referrer_id": "user1",
      "referred_id": "user2",
      "reward_points": 50,
      "created_at": "2024-01-01T00:00:00.000Z",
      "referred": {
        "id": "user2",
        "handle": "john_doe",
        "wallet": "0x...",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    }
  ],
  "total_referrals": 5,
  "total_points": 250
}
```

### Get Referral Leaderboard
```http
GET /api/utility-bridge/referral-leaderboard?limit=10
```

**Response:**
```json
[
  {
    "user": {
      "id": "user1",
      "handle": "top_referrer",
      "wallet": "0x..."
    },
    "referral_count": 25,
    "total_points": 1250
  }
]
```

### Log Ad View
```http
POST /api/utility-bridge/ad-view
Content-Type: application/json

{
  "userId": "user_id",
  "adType": "video"
}
```

**Response:**
```json
{
  "success": true,
  "adView": { ... },
  "points_earned": 5
}
```

---

## 🏛️ DAO API (`/api/dao`)

### Get Proposals
```http
GET /api/dao/proposals?status=ACTIVE
```

**Query Parameters:**
- `status` (optional): `ACTIVE`, `PASSED`, `REJECTED`, `EXPIRED`

**Response:**
```json
[
  {
    "id": "clxxx",
    "title": "Increase Burn Rate",
    "description": "Proposal to increase monthly burn...",
    "proposer_wallet": "0x...",
    "status": "ACTIVE",
    "votes_for": 150,
    "votes_against": 30,
    "created_at": "2024-01-01T00:00:00.000Z",
    "expires_at": "2024-01-15T00:00:00.000Z",
    "votes": [ ... ]
  }
]
```

### Get Proposal by ID
```http
GET /api/dao/proposals/:id
```

**Response:**
```json
{
  "id": "clxxx",
  "title": "Increase Burn Rate",
  "description": "Proposal to increase monthly burn...",
  "proposer_wallet": "0x...",
  "status": "ACTIVE",
  "votes_for": 150,
  "votes_against": 30,
  "created_at": "2024-01-01T00:00:00.000Z",
  "expires_at": "2024-01-15T00:00:00.000Z",
  "votes": [
    {
      "id": "vote1",
      "voter_wallet": "0x...",
      "vote_type": "APPROVE",
      "vote_count": 2,
      "voted_at": "2024-01-02T00:00:00.000Z"
    }
  ]
}
```

### Create Proposal (Admin Only)
```http
POST /api/dao/proposals
Content-Type: application/json
Authorization: Basic admin:password

{
  "title": "New Proposal",
  "description": "Description of the proposal",
  "proposerWallet": "0x...",
  "expiresAt": "2024-01-15T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "proposal": { ... }
}
```

### Vote on Proposal
```http
POST /api/dao/vote
Content-Type: application/json

{
  "proposalId": "proposal_id",
  "voterWallet": "0x...",
  "voteType": "APPROVE"
}
```

**Vote Types:** `APPROVE`, `REJECT`

**Response:**
```json
{
  "success": true,
  "vote": { ... }
}
```

**Note:** Maximum 2 votes per wallet address.

### Update Proposal Status (Admin Only)
```http
PATCH /api/dao/proposals/:id/status
Content-Type: application/json
Authorization: Basic admin:password

{
  "status": "PASSED"
}
```

**Response:**
```json
{
  "success": true,
  "proposal": { ... }
}
```

---

## 📊 Admin API (`/api/admin`)

### Get Dashboard Stats
```http
GET /api/admin/dashboard-stats
Authorization: Basic admin:password
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "users": {
      "total": 1250,
      "active_7d": 450
    },
    "xp": {
      "total_xp": 125000,
      "total_goal_points": 62500,
      "avg_streak": 5.2,
      "avg_burn_multiplier": 1.15
    },
    "burns": {
      "total_goalcoin_burned": 50000,
      "burn_events_count": 12
    },
    "treasury": {
      "total_prize_pool": 25000,
      "total_treasury": 15000,
      "total_burned_usdt": 10000
    },
    "activity": {
      "warmups": 3500,
      "workouts": 2800,
      "meals": 4200
    },
    "utility_bridge": {
      "referrals": 250,
      "referral_points": 12500,
      "ad_views": 1500,
      "ad_view_points": 7500
    }
  }
}
```

---

## 🔐 Authentication

Most endpoints are public. Admin endpoints require Basic Authentication:

```http
Authorization: Basic base64(username:password)
```

---

## ⚠️ Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid parameters)
- `401` - Unauthorized (admin endpoints)
- `404` - Not Found
- `500` - Internal Server Error

---

## 📈 Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Response Header**: `X-RateLimit-Remaining`

---

## 🎯 XP Rewards Summary

| Activity | XP | Endpoint |
|----------|-----|----------|
| Warmup | 10 XP | `POST /api/fitness/warmup/log` |
| Workout | 20 XP | `POST /api/fitness/workout/log` |
| Meal | 15 XP | `POST /api/fitness/meal/log` |
| Daily Streak | 5 XP | Automatic |

## 🌟 Micro-GoalPoints (Non-Holders)

| Activity | Points | Endpoint |
|----------|--------|----------|
| Referral | 50 micro-GP | `POST /api/utility-bridge/referral` |
| Ad View | 5 micro-GP | `POST /api/utility-bridge/ad-view` |

---

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. User IDs and entity IDs use CUID format
3. Wallet addresses should be lowercase
4. XP calculations are server-side (cannot be manipulated)
5. Streak calculations run automatically on each activity
6. DAO votes are limited to 2 per wallet address

---

## 🔄 Webhook Events (Future)

Coming in Phase 2:
- User XP milestone reached
- Streak milestone reached
- Burn event completed
- DAO proposal passed

---

For complete implementation details, see `IMPLEMENTATION_GUIDE.md`
