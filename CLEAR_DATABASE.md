# 🗑️ پاک کردن تمام داده‌های دیتابیس

## ⚠️ هشدار مهم:
این عملیات **تمام داده‌های کاربران، submissions، payments و غیره را پاک می‌کند**!  
فقط برای testing و development استفاده کن.

---

## 🚀 روش اجرا:

### روش 1: با psql (توصیه می‌شود)

```bash
psql "postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin" -f backend/scripts/clear-all-data.sql
```

### روش 2: Copy/Paste در pgAdmin

1. باز کردن pgAdmin
2. اتصال به database
3. باز کردن Query Tool
4. Copy کردن محتوای `backend/scripts/clear-all-data.sql`
5. Paste و اجرا

---

## 📋 چه اتفاقی می‌افتد؟

### ❌ پاک می‌شود:
- تمام کاربران (users)
- تمام challenges
- تمام submissions
- تمام payments
- تمام reviews
- تمام commissions
- تمام XP events
- تمام country stats
- تمام content interactions
- تمام referrals
- تمام fitness logs
- تمام DAO proposals
- تمام burn events

### ✅ حفظ می‌شود:
- ساختار جداول (schema)
- Indexes
- Foreign keys
- Functions و triggers

### 🌱 Seed می‌شود (دوباره اضافه می‌شود):
- 17 action types (XP rules)
- 5 fan tiers (ROOKIE → LEGEND)
- 5 content action configs
- 5 sample content items
- 1 season (SEASON_1)

---

## 🧪 بعد از پاک کردن:

### تست کن که کار کرده:

```sql
-- چک کردن تعداد rows
SELECT 'users' as table_name, COUNT(*) as rows FROM users
UNION ALL
SELECT 'action_types', COUNT(*) FROM action_types
UNION ALL
SELECT 'fan_tier_config', COUNT(*) FROM fan_tier_config;
```

باید برگرداند:
- users: 0
- action_types: 17
- fan_tier_config: 5

---

## 🔄 بازگرداندن داده‌های تست:

اگر می‌خواهی چند کاربر تست ایجاد کنی:

```sql
-- ایجاد یک کاربر تست
INSERT INTO users (id, email, handle, tier, xp_points, country_code)
VALUES 
  ('test-user-1', 'test@example.com', 'TestUser', 'FREE', 0, 'US');
```

---

## ⚡ دستور سریع (یک خطی):

```bash
# پاک کردن همه چیز
psql "postgresql://goalcoin_user:e29X94Ny6msJRJT4GbMTZzNaPj7PbOxB@dpg-d44aclq4d50c73883vj0-a.oregon-postgres.render.com/goalcoin" -c "SET session_replication_role = 'replica'; TRUNCATE TABLE users, challenges, submissions, payments, reviews, commissions, xp_events, country_stats, content_interactions CASCADE; SET session_replication_role = 'origin';"
```

---

## 📊 Verification:

بعد از اجرا، این query را بزن:

```sql
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

---

## 🐛 اگر خطا گرفتی:

### خطا: "cannot truncate a table referenced in a foreign key constraint"

راه حل: استفاده از `CASCADE`:
```sql
TRUNCATE TABLE users CASCADE;
```

### خطا: "permission denied"

راه حل: مطمئن شو که با user صحیح وصل شدی (goalcoin_user)

---

## ✅ موفقیت:

بعد از اجرای موفق، باید ببینی:
```
✅ All data cleared successfully! Essential seed data restored.
```

---

**تاریخ ایجاد:** November 9, 2025  
**استفاده:** فقط برای Testing/Development
