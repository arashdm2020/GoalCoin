# GoalCoin MVP API Endpoints

## Overview
This document outlines all the API endpoints implemented for the GoalCoin MVP backend, aligned with James's detailed specifications.

## Authentication
- **Admin endpoints**: Protected with Basic Auth (username/password)
- **Review endpoints**: Currently open (wallet signature auth to be implemented)

## Core Endpoints

### 1. Payments & Webhooks
- `POST /api/payments/challenge` - Create payment for 90-day challenge entry
- `POST /api/webhooks/coinpayments` - CoinPayments IPN webhook (HMAC verified)

### 2. Admin Panel (Basic Auth Required)
- `POST /api/admin/reviewers` - Add new reviewer wallet
- `GET /api/admin/reviewers` - List all reviewers
- `PUT /api/admin/reviewers/status` - Enable/disable reviewer
- `GET /api/admin/submissions` - View all submissions with reviews
- `POST /api/admin/submissions/assign` - Assign 5 random reviewers to submission
- `GET /api/admin/commissions` - View unpaid commissions
- `POST /api/admin/payouts` - Create payout for reviewer commissions

### 3. Submissions (User-facing)
- `POST /api/submissions` - Submit weekly proof
- `GET /api/submissions/user/:user_wallet` - Get user's submissions
- `GET /api/submissions/:id` - Get specific submission details

### 4. Reviews (Reviewer-facing)
- `GET /api/reviews/assignments/:reviewer_wallet` - Get assigned submissions
- `POST /api/reviews/vote` - Submit vote (APPROVE/REJECT)
- `GET /api/reviews/history/:reviewer_wallet` - Get review history

### 5. Leaderboard
- `GET /api/leaderboard/countries` - Countries ranked by user count
- `GET /api/leaderboard/users?country_code=XX` - Users by country

### 6. Challenges
- `POST /api/challenges` - Create new challenge (Admin only)
- `GET /api/challenges` - Get active challenges
- `GET /api/challenges/:id` - Get challenge details with submissions

### 7. Users
- `POST /api/users/connect` - Connect user wallet
- `POST /api/users/disconnect` - Disconnect user (no-op in new schema)
- `POST /api/users/heartbeat` - User heartbeat (no-op in new schema)

### 8. System
- `GET /health` - Health check endpoint

## Data Flow

### Payment Flow
1. User calls `POST /api/payments/challenge` with wallet, tier ($19/$35/$49)
2. Creates User record and Payment record
3. Initiates CoinPayments transaction
4. CoinPayments sends webhook to `/api/webhooks/coinpayments`
5. Webhook verifies HMAC, marks payment confirmed, creates pools ledger (70/20/10 split)

### Review Flow
1. User submits weekly proof via `POST /api/submissions`
2. Admin assigns 5 reviewers via `POST /api/admin/submissions/assign`
3. Reviewers vote via `POST /api/reviews/vote`
4. When 3-vote quorum reached, submission is closed
5. $0.005 USDT commission awarded to each reviewer
6. Admin creates payouts when reviewer balance ≥ $5

## Environment Variables Required
```
# Database
DATABASE_URL="postgresql://..."

# Server
PORT=3001
FRONTEND_URL="https://goal-coin.vercel.app"
BACKEND_BASE_URL="https://goalcoin.onrender.com"

# Admin Auth
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="$2b$10$..."

# CoinPayments
COINPAYMENTS_PUBLIC_KEY=""
COINPAYMENTS_PRIVATE_KEY=""
COINPAYMENTS_MERCHANT_ID=""
COINPAYMENTS_IPN_SECRET=""
COINPAYMENTS_IPN_URL="https://goalcoin.onrender.com/api/webhooks/coinpayments"
COINPAYMENTS_CURRENCY="USDT.MATIC"
```

## Database Schema
- **User**: wallet, email, handle, country_code, tier, founder_nft
- **Challenge**: title, start_date, end_date, rules, active
- **Payment**: user_id, tx_id, amount, tier, status, paid_at
- **Submission**: user_id, challenge_id, week_no, file_url, watermark_code, status
- **ReviewAssignment**: submission_id, reviewer_wallet, expires_at, status
- **Review**: submission_id, reviewer_wallet, vote, voted_at
- **ReviewerWallet**: wallet, enabled, accuracy_7d, total_votes, wrong_votes
- **Commission**: reviewer_wallet, submission_id, amount_usdt, earned_at
- **Payout**: reviewer_wallet, amount_usdt, tx_hash, period_start, period_end
- **PoolsLedger**: payment_id, prize_usdt, treasury_usdt, burn_usdt

## Key Features Implemented
✅ 90-Day Challenge payment entry via CoinPayments  
✅ HMAC-verified webhook processing  
✅ 70/20/10 revenue split to pools  
✅ Weekly proof submission system  
✅ 3-of-5 reviewer quorum logic  
✅ $0.005 USDT commission per vote  
✅ Country-based leaderboard  
✅ Admin panel for reviewer management  
✅ Payout system for reviewers  
✅ Automatic reviewer assignment  
✅ Submission status tracking  

## Next Phase Features (Not Implemented)
- Duels system
- On-chain staking
- Auto-burn contracts
- JWT admin auth
- Wallet signature auth for reviewers
- Accuracy tracking and auto-suspension
- Appeal system
