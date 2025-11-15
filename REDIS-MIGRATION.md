# Redis Migration Guide

## مشکل فعلی
پلن رایگان Upstash Redis به محدودیت رسیده است و نیاز به migration یا حذف Redis داریم.

## Redis در GoalCoin برای چه استفاده می‌شود؟

### 1. Cache (موقت)
- Leaderboard data
- User profiles
- TTL: 3 دقیقه
- **قابل حذف**: بله ✅

### 2. BullMQ Queue (Background Jobs)
- Email sending
- XP events
- Webhooks processing
- Notifications
- **وضعیت فعلی**: غیرفعال شده در `index.ts` ✅

## راه‌حل‌های پیشنهادی

### گزینه 1: حذف کامل Redis (توصیه می‌شود) ✅

**مزایا:**
- هزینه صفر
- بدون نیاز به migration
- کد قبلاً برای کار بدون Redis آماده شده

**معایب:**
- بدون cache (query های leaderboard کمی کندتر می‌شوند)
- Background jobs به صورت synchronous اجرا می‌شوند

**مراحل اجرا:**
1. در Render Dashboard، متغیر `REDIS_URL` را حذف کنید
2. سرویس را restart کنید
3. تمام! ✅

### گزینه 2: پاک کردن Redis فعلی

اگر می‌خواهید همان Redis را نگه دارید اما فضا آزاد کنید:

```bash
# نصب ioredis
npm install ioredis

# اجرای اسکریپت برای بررسی
node scripts/clear-redis.js

# برای پاک کردن واقعی، در فایل clear-redis.js خط زیر را uncomment کنید:
# await redis.flushall();
```

**توجه:** این فقط فضا آزاد می‌کند، محدودیت request/month را حل نمی‌کند.

### گزینه 3: Migration به Redis جدید

اگر حتماً به Redis نیاز دارید:

**رایگان:**
- Upstash Redis (پلن جدید رایگان)
- Redis Labs (پلن رایگان)
- Render Redis (محدود)

**مراحل:**
1. ساخت Redis instance جدید
2. در Render، `REDIS_URL` را به URL جدید تغییر دهید
3. Restart سرویس

**توجه:** نیازی به migration داده نیست چون:
- Cache ها موقت هستند (TTL 3 دقیقه)
- Queue ها خالی هستند (غیرفعال شده‌اند)

## توصیه نهایی

**گزینه 1 را انتخاب کنید** (حذف Redis):
- هزینه: $0
- پیچیدگی: کم
- زمان: 2 دقیقه
- تاثیر: minimal (فقط cache از دست می‌رود)

## بررسی وضعیت فعلی Redis

```bash
# اجرای اسکریپت بررسی
node scripts/clear-redis.js
```

این اسکریپت نشان می‌دهد:
- تعداد کلیدها در Redis
- حجم استفاده شده
- نمونه کلیدها

## سوالات متداول

### Q: آیا داده‌های مهمی در Redis داریم؟
A: خیر. فقط cache موقت (3 دقیقه) و queue های غیرفعال.

### Q: آیا حذف Redis مشکلی ایجاد می‌کند؟
A: خیر. کد قبلاً برای کار بدون Redis طراحی شده.

### Q: آیا باید داده‌ها را migrate کنیم؟
A: خیر. همه داده‌ها موقت هستند یا در PostgreSQL ذخیره می‌شوند.

### Q: Performance چطور؟
A: Leaderboard queries بدون cache 50-100ms طول می‌کشند (قابل قبول).
