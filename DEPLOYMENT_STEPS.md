# GoalCoin Fitness MVP - Deployment Steps

## 🚀 Quick Deployment Guide

Follow these steps to deploy James's new fitness features to production.

---

## Step 1: Apply Database Migration

Run the SQL migration script on your Render.com PostgreSQL database:

```bash
cd backend/scripts
psql "postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin" -f add_fitness_features.sql
```

**Expected Output:**
```
ALTER TABLE
ALTER TABLE
...
CREATE TABLE
CREATE INDEX
...
                             status
----------------------------------------------------------------
 Fitness MVP features migration completed successfully!
(1 row)
```

---

## Step 2: Regenerate Prisma Client Locally

This will update TypeScript types and fix all lint errors:

```bash
cd backend
npx prisma generate
```

---

## Step 3: Seed Fitness Content (Optional but Recommended)

Add initial warmup sessions and diet plans:

```bash
cd backend
npx ts-node scripts/seed_fitness_content.ts
```

**Expected Output:**
```
🌱 Seeding fitness content...
✅ Created warmup sessions
✅ Created diet plans
   - 3 Budget tier plans
   - 3 Balanced tier plans
   - 3 Protein Boost tier plans
🎉 Fitness content seeding complete!
```

---

## Step 4: Test Locally (Optional)

Before deploying to production, test the new endpoints:

```bash
cd backend
npm run dev
```

Test endpoints:
- `GET http://localhost:3001/api/fitness/warmup-sessions`
- `GET http://localhost:3001/api/fitness/diet-plans`
- `GET http://localhost:3001/api/admin/dashboard-stats` (requires auth)

---

## Step 5: Deploy to Render.com

### Option A: Automatic Deployment (Recommended)
Push your changes to GitHub:

```bash
git add .
git commit -m "feat: Add fitness MVP features - warmups, diet plans, XP system, DAO governance"
git push origin main
```

Render.com will automatically detect the changes and redeploy.

### Option B: Manual Deployment
Trigger a manual deployment from the Render.com dashboard.

---

## Step 6: Verify Production Deployment

After deployment completes, verify the new endpoints:

1. **Check Health**:
   ```bash
   curl https://goalcoin.onrender.com/health
   ```

2. **Check Warmup Sessions**:
   ```bash
   curl https://goalcoin.onrender.com/api/fitness/warmup-sessions
   ```

3. **Check Diet Plans**:
   ```bash
   curl https://goalcoin.onrender.com/api/fitness/diet-plans
   ```

4. **Check Dashboard Stats** (requires admin auth):
   ```bash
   curl -u admin:your_password https://goalcoin.onrender.com/api/admin/dashboard-stats
   ```

---

## Step 7: Update Frontend (Next Phase)

The backend is now ready. Update the frontend to:

1. **Display user XP and streaks** on dashboard
2. **Add warmup session viewer** with video players
3. **Add diet plan browser** with filtering
4. **Add activity logging buttons** (warmup/workout/meal)
5. **Add referral system** UI
6. **Add DAO governance** page
7. **Update admin dashboard** with new metrics

---

## Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution**: The script uses `IF NOT EXISTS` clauses, so this shouldn't happen. If it does, check if you've already run the migration.

### Issue: Prisma Client errors in TypeScript
**Solution**: Run `npx prisma generate` to regenerate the client with new models.

### Issue: Seed script fails
**Solution**: Ensure the migration completed successfully first. The seed script requires the new tables to exist.

### Issue: 500 errors on new endpoints
**Solution**: 
1. Check Render.com logs for specific errors
2. Verify Prisma Client was regenerated during deployment
3. Ensure `DATABASE_URL` environment variable is correct

---

## Rollback Plan

If you need to rollback:

1. **Revert code changes**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Drop new tables** (if necessary):
   ```sql
   DROP TABLE IF EXISTS warmup_logs CASCADE;
   DROP TABLE IF EXISTS warmup_sessions CASCADE;
   DROP TABLE IF EXISTS workout_logs CASCADE;
   DROP TABLE IF EXISTS meal_logs CASCADE;
   DROP TABLE IF EXISTS diet_plans CASCADE;
   DROP TABLE IF EXISTS referrals CASCADE;
   DROP TABLE IF EXISTS ad_views CASCADE;
   DROP TABLE IF EXISTS dao_votes CASCADE;
   DROP TABLE IF EXISTS dao_proposals CASCADE;
   DROP TABLE IF EXISTS burn_events CASCADE;
   DROP TYPE IF EXISTS "DietTier" CASCADE;
   DROP TYPE IF EXISTS "ProposalStatus" CASCADE;
   ```

---

## Post-Deployment Checklist

- [ ] Database migration completed successfully
- [ ] Prisma Client regenerated
- [ ] Fitness content seeded
- [ ] Backend deployed to Render.com
- [ ] Health check passes
- [ ] New API endpoints responding
- [ ] Admin dashboard stats endpoint working
- [ ] No errors in Render.com logs

---

## Next Steps

1. **Frontend Development**: Implement UI for new features
2. **Content Creation**: Add more warmup videos and diet plans
3. **Testing**: Comprehensive testing of XP/streak logic
4. **Monitoring**: Track user engagement with new features
5. **Phase 2 Planning**: Premium tiers, sponsorships, automated buybacks

---

## Support

For issues or questions:
- Check `IMPLEMENTATION_GUIDE.md` for detailed documentation
- Review Prisma schema: `backend/prisma/schema.prisma`
- Check migration script: `backend/scripts/add_fitness_features.sql`
- Review controllers: `backend/src/controllers/`

---

**🎉 You're all set! The GoalCoin Fitness MVP is ready to launch!**
