# Render Migration Commands

## Method 1: Prisma DB Push (Recommended)
```bash
cd backend
npx prisma db push
```

## Method 2: Direct SQL
```bash
psql $DATABASE_URL -c "ALTER TABLE workout_logs ADD COLUMN IF NOT EXISTS notes TEXT;"
```

## Method 3: Prisma Migrate Deploy
```bash
cd backend
npx prisma migrate deploy
```

## Method 4: Check Current Schema
```bash
psql $DATABASE_URL -c "\d workout_logs"
```

## Method 5: Prisma Generate (after migration)
```bash
cd backend
npx prisma generate
```

## Test After Migration:
```bash
# Verify column was added
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'workout_logs';"
```

## Restart Service:
After migration, restart the service:
- Dashboard > Manual Deploy > Deploy Latest Commit
