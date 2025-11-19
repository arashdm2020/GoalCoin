# Admin Dashboard Credentials for James

## Access Information

**Admin Dashboard URL:** https://goal-coin.vercel.app/admin/dashboard

### Login Credentials:
- **Username:** `admin`
- **Password:** `GoalCoin2024!`

---

## Available Admin Pages:

1. **Dashboard** - `/admin/dashboard`
   - Overview of all system stats
   - Quick access to all modules

2. **Submissions** - `/admin/submissions`
   - Review user weekly submissions
   - Approve/Reject submissions
   - Bulk operations

3. **Users** - `/admin/users`
   - Manage user accounts
   - View user details
   - Edit user tiers

4. **Memberships & Payments** - `/admin/memberships`
   - View all challenge entries
   - Track payment status
   - Export data to CSV

5. **Reviewers** - `/admin/reviewers`
   - Manage reviewer accounts
   - Track accuracy and strikes
   - Auto-refresh every 30s

6. **Referrals** - `/admin/referrals` ⭐ **NEW!**
   - View referral leaderboard
   - Monitor monthly winners
   - Track conversion rates

7. **Settings** - `/admin/settings`
   - Configure XP points
   - Set challenge parameters
   - Manage system settings

8. **Leaderboard** - `/admin/leaderboard`
   - Recompute leaderboard
   - View global rankings

---

## Authentication Method:

The admin panel uses **Basic Authentication**.

When you first visit the admin dashboard, you'll be prompted to enter:
- Username: `admin`
- Password: `GoalCoin2024!`

The credentials are stored in localStorage and will persist until you log out.

---

## Important Notes:

1. **Security:** These credentials should be kept confidential
2. **Session:** Your session will remain active until you click "Logout"
3. **Access:** You have full admin privileges across all modules
4. **Support:** If you encounter any issues, contact the development team

---

## Recent Updates (Nov 19, 2025):

✅ **Dashboard Improvements:**
- Challenge Progress indicator (Day X/90) with progress bar
- Burn Multiplier displayed with fire emoji (🔥 2.0X)
- Streak data prominently shown (⚡ X days)
- Leaderboard preview (top 5 performers)
- XP Logs page with complete history
- Payment tier visibility
- All CTA actions clearly visible

✅ **Previous Fixes (Nov 18, 2025):**
- Video upload (.mov/.mp4) working
- Week selector fixed for iOS/Android
- Notification drawer responsive
- Warmup page scroll fixed
- Referral system completed
- Admin referrals page added
- Messages page improved

✅ **Admin Features:**
- XP logs endpoint (`/api/xp/logs`)
- User XP history tracking
- Submission review panel
- Reviewer management
- Referral analytics

---

## What You Can Review:

### User Side:
1. **Dashboard** - View challenge progress, burn multiplier, streak
2. **XP Logs** - Complete history of all XP earned
3. **Leaderboard** - Top performers preview
4. **Submissions** - Weekly proof uploads
5. **Referrals** - Invite tracking

### Admin Side:
1. **Submissions** - Review and approve user submissions
2. **Users** - Manage user accounts and tiers
3. **XP Logs** - View any user's XP history
4. **Streak Validation** - Monitor user streaks
5. **Challenge Activity** - Track all user activity

---

**Last Updated:** November 19, 2025
**Version:** 1.1 (Beta MVP - Dashboard Enhanced)
