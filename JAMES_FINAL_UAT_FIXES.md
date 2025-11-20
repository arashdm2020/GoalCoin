# James's Final UAT Fixes - November 20, 2025

**Deadline:** November 22, 2025  
**Status:** IN PROGRESS

---

## 📋 Issue Tracking

### **1. Dashboard (Homepage)** ⏳ IN PROGRESS

#### **1.1 ✅ Burn Multiplier Display**
- **Issue:** Shows only "X" instead of 1.00x, 1.20x, 1.50x, 2.00x
- **Fix:** Changed `{user.burn_multiplier}X` to `{user.burn_multiplier.toFixed(2)}x`
- **Status:** ✅ FIXED
- **File:** `frontend/src/app/dashboard/page.tsx` line 406

#### **1.2 ✅ Payment Tier Visibility**
- **Issue:** $19/$35/$49 tier not visible
- **Fix:** Added payment tier display in challenge status section
- **Status:** ✅ FIXED
- **File:** `frontend/src/app/dashboard/page.tsx` lines 412-417

#### **1.3 ⏳ GC Balance Breakdown**
- **Issue:** No earning history or breakdown for 150 GC
- **Fix Needed:** Add GC transaction history page/modal
- **Status:** ⏳ TODO
- **Plan:** Create `/dashboard/gc-history` page

#### **1.4 ⏳ XP Activity Log**
- **Issue:** 2,800 XP has no activity log
- **Fix Needed:** XP logs page already exists but may not be populated
- **Status:** ⏳ TODO
- **File:** `frontend/src/app/dashboard/xp-logs/page.tsx`

#### **1.5 ⏳ Challenge Progress (Day X/90)**
- **Issue:** Missing from dashboard
- **Fix Needed:** Add Day X/90 display
- **Status:** ⏳ TODO
- **Note:** Already exists in admin, need to add to user dashboard

#### **1.6 ⏳ Notification Drawer Mobile**
- **Issue:** Too large on mobile
- **Fix Needed:** Reduce size/improve responsive design
- **Status:** ⏳ TODO
- **File:** `frontend/src/app/dashboard/page.tsx` lines 200-279

---

### **2. XP History Page** ⏳ TODO

#### **Issues:**
- All sections show 0 XP
- Activity log empty
- Not reflecting real XP sources

#### **Fix Plan:**
- Check `/api/xp/logs` endpoint
- Verify XP events are being written
- Ensure frontend fetches and displays correctly

---

### **3. Warm-up Sessions** ⏳ TODO

#### **Issues:**
- Streak resets after refresh
- Complete button doesn't update streak/XP
- Session count not writing to database

#### **Fix Plan:**
- Fix streak persistence in backend
- Wire Complete button to backend endpoint
- Ensure XP is awarded and logged

---

### **4. Weekly Submissions** ⏳ TODO

#### **Issue:**
- Submit button stays disabled after file upload

#### **Fix Plan:**
- Enable submit button after successful file upload
- Add file validation feedback

---

### **5. Leaderboard** ⏳ TODO

#### **Issues:**
- User in "My Country" but not "Global"
- Global rankings inconsistent with XP
- Pagination shows duplicates

#### **Fix Plan:**
- Fix leaderboard query logic
- Verify global vs country filtering
- Fix pagination offset calculation
- Confirm using challenge_tier not fan_tier

---

### **6. Referrals Page** ⏳ TODO

#### **Issues:**
- Total Referrals (199) and Active (0) logic broken
- Rank shows "N/A"
- Link preview missing

#### **Fix Plan:**
- Fix referral counting logic
- Calculate rank correctly
- Add link preview component

---

### **7. My Stats Page** ⏳ TODO

#### **Issues:**
- Tier Progress using default values
- Burn Multiplier stuck at 1.00x
- Global Rank shows "#999 out of 100"

#### **Fix Plan:**
- Use challenge tier XP for progress
- Display correct burn multiplier
- Fix global rank calculation

---

### **8. Meal Logs** ⏳ TODO

#### **Issue:**
- Shows 9 meals logged but 0 XP in history

#### **Fix Plan:**
- Ensure meal logging awards XP
- Verify XP events are created
- Check XP history endpoint

---

### **9. Top Performers** ⏳ TODO

#### **Issue:**
- Different data than leaderboard
- Pulling from wrong table/cache

#### **Fix Plan:**
- Use same endpoint as leaderboard
- Remove any caching
- Ensure data consistency

---

### **10. UI/Navigation** ⏳ TODO

#### **Issues:**
- Back button redirects wrong
- Tab switching lags
- Notification animation too large on mobile

#### **Fix Plan:**
- Fix router.back() logic
- Optimize tab rendering
- Reduce notification panel size

---

### **11. Fan Tiers Labels** ⏳ TODO

#### **Update Required:**
Change fan_tier labels to:
1. Minted
2. Staked
3. Verified
4. Ascendant
5. Apex

**Note:** Cosmetic only, doesn't affect challenge tiers

#### **Fix Plan:**
- Update database fan_tier values
- Update frontend display logic
- Keep challenge tiers (Rookie → Elite) unchanged

---

### **12. Admin Dashboard Login** ✅ READY

#### **Credentials:**
```
URL: https://goal-coin.vercel.app/admin/login
Username: admin
Password: GoalCoin2024!
```

#### **Status:** ✅ READY TO SEND

---

## 🎯 Priority Order

### **CRITICAL (Must fix first):**
1. ✅ Burn Multiplier format
2. ✅ Payment Tier visibility
3. ⏳ XP History showing 0
4. ⏳ Warm-up Complete button
5. ⏳ Weekly Submissions button
6. ⏳ Leaderboard Global vs Country

### **HIGH:**
7. ⏳ GC Balance breakdown
8. ⏳ Challenge Progress Day X/90
9. ⏳ Meal Logs XP
10. ⏳ My Stats fixes

### **MEDIUM:**
11. ⏳ Referrals logic
12. ⏳ Top Performers consistency
13. ⏳ UI/Navigation issues
14. ⏳ Fan Tiers labels

---

## 📊 Progress Tracker

| Category | Total | Fixed | Remaining |
|----------|-------|-------|-----------|
| Dashboard | 6 | 2 | 4 |
| XP History | 1 | 0 | 1 |
| Warm-up | 1 | 0 | 1 |
| Submissions | 1 | 0 | 1 |
| Leaderboard | 1 | 0 | 1 |
| Referrals | 1 | 0 | 1 |
| My Stats | 1 | 0 | 1 |
| Meal Logs | 1 | 0 | 1 |
| Top Performers | 1 | 0 | 1 |
| UI/Navigation | 1 | 0 | 1 |
| Fan Tiers | 1 | 0 | 1 |
| Admin Login | 1 | 1 | 0 |
| **TOTAL** | **12** | **3** | **9** |

---

## ✅ Completed Fixes

1. ✅ Burn Multiplier - Now shows 1.00x, 1.20x, 1.50x, 2.00x format
2. ✅ Payment Tier - Now visible in dashboard challenge section
3. ✅ Admin Login - Credentials ready to send

---

## ⏳ Next Steps

1. Fix XP History page (all sections showing 0)
2. Fix Warm-up Complete button
3. Fix Weekly Submissions button
4. Fix Leaderboard Global vs Country
5. Continue through remaining items

---

**Last Updated:** November 20, 2025, 4:00 PM UTC+03:30  
**Status:** 3/12 items fixed, 9 remaining
