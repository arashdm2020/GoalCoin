# GoalCoin MVP Deployment Guide

## 🚀 New Features Added

### 1. **Hybrid Login System** ✅
- Email/Password authentication
- JWT-based sessions
- Link wallet to email account
- Endpoints:
  - `POST /api/auth/register` - Register with email
  - `POST /api/auth/login` - Login with email
  - `POST /api/auth/link-wallet` - Link wallet to account
  - `GET /api/auth/me` - Get current user info

### 2. **Shopify Integration** ✅
- Redeem order codes for challenge entry
- Verify order code validity
- Endpoints:
  - `POST /api/shopify/redeem` - Redeem order code
  - `GET /api/shopify/verify/:orderCode` - Verify order code

### 3. **Staking Simulation** ✅
- Test stakes on Polygon Mumbai testnet
- $1-$3 test amounts
- Endpoints:
  - `POST /api/staking/test-stake` - Create test stake
  - `GET /api/staking/stakes/:wallet` - Get wallet stakes
  - `POST /api/staking/unstake/:stakeId` - Unstake

### 4. **Admin Panel UI** ✅
- Submissions table with filters
- Commissions table with payout tracking
- Leaderboard table with rankings

---

## 📦 Required Dependencies

Add these to `backend/package.json`:

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

---

## 🗄️ Database Migration

### Step 1: Run SQL Migration

```bash
# Connect to your Render.com PostgreSQL database
psql "postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin"

# Run the migration script
\i backend/scripts/add_mvp_features.sql
```

### Step 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 3: Push Schema to Database

```bash
npx prisma db push
```

---

## 🔧 Environment Variables

Add to your Render.com environment:

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

---

## 🌐 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register with email
- `POST /api/auth/login` - Login with email
- `POST /api/auth/link-wallet` - Link wallet (requires JWT)
- `GET /api/auth/me` - Get user info (requires JWT)

### Shopify
- `POST /api/shopify/redeem` - Redeem order code
- `GET /api/shopify/verify/:orderCode` - Verify order code

### Staking
- `POST /api/staking/test-stake` - Create test stake
- `GET /api/staking/stakes/:wallet` - Get stakes
- `POST /api/staking/unstake/:stakeId` - Unstake

### Fitness (Already Deployed)
- `GET /api/fitness/warmup-sessions` - Get warmup sessions
- `POST /api/fitness/warmup/log` - Log warmup
- `POST /api/fitness/workout/log` - Log workout
- `GET /api/fitness/diet-plans` - Get diet plans
- `POST /api/fitness/meal/log` - Log meal
- `GET /api/fitness/progress/:userId` - Get user progress

### Utility Bridge (Already Deployed)
- `POST /api/utility-bridge/referral` - Create referral
- `GET /api/utility-bridge/referrals/:userId` - Get referrals
- `GET /api/utility-bridge/referral-leaderboard` - Get leaderboard
- `POST /api/utility-bridge/ad-view` - Log ad view

### DAO (Already Deployed)
- `GET /api/dao/proposals` - Get proposals
- `POST /api/dao/proposals` - Create proposal
- `POST /api/dao/vote` - Vote on proposal

---

## 🧪 Testing

### Test Hybrid Login

```bash
# Register
curl -X POST https://goalcoin.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","handle":"testuser"}'

# Login
curl -X POST https://goalcoin.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Link Wallet (use token from login response)
curl -X POST https://goalcoin.onrender.com/api/auth/link-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"wallet":"0x1234567890123456789012345678901234567890"}'
```

### Test Shopify Redeem

```bash
curl -X POST https://goalcoin.onrender.com/api/shopify/redeem \
  -H "Content-Type: application/json" \
  -d '{"orderCode":"SHOP-12345","wallet":"0x1234567890123456789012345678901234567890"}'
```

### Test Staking

```bash
curl -X POST https://goalcoin.onrender.com/api/staking/test-stake \
  -H "Content-Type: application/json" \
  -d '{"wallet":"0x1234567890123456789012345678901234567890","amount":"2.5"}'
```

---

## 📝 Next Steps

1. ✅ Push code to GitHub
2. ✅ Render.com will auto-deploy
3. ✅ Run database migration
4. ✅ Install dependencies (`npm install`)
5. ✅ Test all endpoints
6. 🔄 Frontend integration (next phase)

---

## ⚠️ Important Notes

- **JWT_SECRET**: Must be set in production environment
- **Database**: Migration must be run before deployment
- **Dependencies**: `bcrypt` and `jsonwebtoken` must be installed
- **Prisma**: Client must be regenerated after schema changes

---

## 🎯 MVP Completion Status

- ✅ User Management
- ✅ Payment System (CoinPayments)
- ✅ Challenge & Submission System
- ✅ Review & Commission System
- ✅ Leaderboard (Global + Country)
- ✅ Fitness Features (Warmup, Workout, Diet)
- ✅ XP & Streak System
- ✅ Utility Bridge (Referrals, Ads)
- ✅ DAO Governance
- ✅ Admin Panel UI
- ✅ Hybrid Login (Email + Wallet)
- ✅ Shopify Integration
- ✅ Staking Simulation
- ⏳ Frontend UI Integration (Next)
- ⏳ Fiat Gateway (Phase 2)

---

**All backend features are now complete and ready for deployment!** 🎉
