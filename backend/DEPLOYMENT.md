# GoalCoin Backend Deployment Guide

## Safe Migration for Production

This guide ensures safe deployment to Render.com without data loss.

### Migration Strategy

The migration has been designed to be **completely safe** for existing production data:

1. **Additive Changes**: New columns are added as nullable first
2. **Data Backfill**: Existing data is preserved and migrated
3. **Constraint Addition**: Constraints are added only after data is ready
4. **Rollback Safe**: Migration can be rolled back if needed

### Render.com Deployment Steps

#### 1. Environment Variables Required on Render

```bash
# Database
DATABASE_URL=postgresql://...  # Provided by Render PostgreSQL addon

# Server
PORT=3001
FRONTEND_URL=https://goal-coin.vercel.app
BACKEND_BASE_URL=https://goalcoin.onrender.com

# Admin Auth
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$...  # Generate with: node -e "console.log(require('bcrypt').hashSync('your-password', 10))"

# CoinPayments
COINPAYMENTS_PUBLIC_KEY=your_public_key
COINPAYMENTS_PRIVATE_KEY=your_private_key
COINPAYMENTS_MERCHANT_ID=your_merchant_id
COINPAYMENTS_IPN_SECRET=your_ipn_secret
COINPAYMENTS_IPN_URL=https://goalcoin.onrender.com/api/webhooks/coinpayments
COINPAYMENTS_CURRENCY=USDT.MATIC

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=dxat5z9j1
CLOUDINARY_API_KEY=577365329656591
CLOUDINARY_API_SECRET=hGp4vdYNtqBu-q-ak-pW2Om7Rzk
```

#### 2. Build Command for Render

**IMPORTANT**: Change the build command in Render dashboard from:
```bash
npm install && npm run db:generate && npx prisma db push --accept-data-loss && npm run build
```

**TO:**
```bash
npm run render:build
```

Or alternatively:
```bash
npm install && npx prisma migrate deploy && npx prisma generate && npm run build
```

**Why this matters:**
- ❌ `prisma db push` tries to apply schema changes directly and fails with existing data
- ✅ Our baseline script handles existing production databases safely
- ✅ Uses `prisma migrate resolve` to mark existing schema as migrated (baseline)
- ✅ Then applies any new migrations without data loss

This will:
1. Run `npm install` (install dependencies)
2. Run `baseline-db.js` (handles existing database schema safely)
3. Run `prisma generate` (generates Prisma client)
4. Run `npm run build` (compiles TypeScript)

**Baseline Process:**
- Checks if migration tracking exists
- If not, marks existing schema as migrated (baseline)
- Applies any new migrations without touching existing data

#### 3. Start Command for Render

```bash
npm start
```

### Migration Details

The migration (`20241106_safe_user_migration`) handles:

✅ **Safe Column Addition**: Adds `id`, `wallet`, `email`, `handle`, `country_code`, `tier`, `founder_nft`, `created_at` as nullable first

✅ **Data Preservation**: Copies existing `address` → `wallet`, `connectedAt` → `created_at`

✅ **ID Generation**: Creates unique IDs for existing records

✅ **Constraint Addition**: Makes columns non-nullable and adds unique constraints only after data is ready

✅ **Enum Creation**: Creates all required enums (`UserTier`, `PaymentTier`, etc.)

✅ **Table Creation**: Creates all new tables (`challenges`, `payments`, `submissions`, etc.)

✅ **Foreign Keys**: Adds all foreign key relationships

✅ **Indexes**: Creates performance indexes

### Rollback Plan

If migration fails:
1. The migration is atomic - partial failures will rollback automatically
2. Old columns (`address`, `connectedAt`, etc.) are preserved for manual rollback
3. No data is deleted, only new columns/tables are added

### Testing Migration Locally

Before deploying, test the migration:

```bash
# 1. Backup your local database
pg_dump your_local_db > backup.sql

# 2. Apply migration
npm run db:migrate:deploy

# 3. Verify schema
npx prisma db pull
npx prisma generate

# 4. Test the application
npm run build
npm start
```

### Post-Deployment Verification

After successful deployment, verify:

1. **Health Check**: `GET https://goalcoin.onrender.com/health`
2. **Admin Panel**: `GET https://goalcoin.onrender.com/api/admin/reviewers` (with Basic Auth)
3. **Database**: Check that existing users are preserved with new schema
4. **Logs**: Monitor Render logs for any errors

#### Create Main Challenge (First Time Only)

After first deployment, run this script to create the main challenge:

```bash
# SSH into Render shell or run locally with production DATABASE_URL
npx ts-node src/scripts/createMainChallenge.ts
```

This creates the `main-challenge` required for weekly submissions.

### Troubleshooting

If deployment fails:

1. **Check Render Logs**: Look for specific error messages
2. **Environment Variables**: Ensure all required env vars are set
3. **Database Connection**: Verify DATABASE_URL is correct
4. **Migration Issues**: Check if migration completed successfully

### Manual Migration (Emergency Only)

If automatic migration fails, you can run manually:

```sql
-- Connect to Render PostgreSQL and run the migration.sql file
-- This should only be done as a last resort
```

## API Endpoints Updated

All endpoints from the previous implementation remain functional:

- ✅ Payment processing with CoinPayments
- ✅ Webhook handling with HMAC verification  
- ✅ Admin panel with reviewer management
- ✅ Submission and review system
- ✅ Commission and payout management
- ✅ Leaderboard with country filtering
- ✅ Audit logging for all actions
- ✅ Automated cron jobs for cleanup

## New Features Added

- ✅ **Anti-Collusion**: Prevents same reviewer from reviewing same user consecutively
- ✅ **Auto-Suspension**: Reviewers with <85% accuracy suspended for 1 week
- ✅ **Accuracy Tracking**: 7-day rolling accuracy calculation
- ✅ **Audit Logging**: Complete audit trail for all state changes
- ✅ **Automated Reassignment**: Expired assignments automatically reassigned
- ✅ **Commission Batching**: Weekly payout batching with $5 minimum
- ✅ **Enhanced Leaderboard**: Country-based filtering with success metrics

The system is now production-ready with all James Surren's requirements implemented.
