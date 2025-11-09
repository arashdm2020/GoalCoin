# 🔐 Admin Authentication Fix Guide

## مشکل:
صفحه admin بعد از login فوراً logout می‌شود (401 Unauthorized)

## ✅ راه حل:

### گام 1: تولید Password Hash

```bash
cd backend
node scripts/generate-admin-hash.js YOUR_DESIRED_PASSWORD
```

مثال:
```bash
node scripts/generate-admin-hash.js admin123
```

خروجی:
```
ADMIN_PASSWORD_HASH=$2b$10$itgfdVx.oUwqI/77yj6JoOLW7w6wpmrta1L1j8K9AMVXyT/QCajba
ADMIN_USERNAME=admin
```

### گام 2: اضافه کردن به Render.com

1. برو به **Render.com Dashboard**
2. انتخاب **Backend Service** (goalcoin)
3. کلیک روی **Environment** tab
4. اضافه کردن این متغیرها:

```
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$itgfdVx.oUwqI/77yj6JoOLW7w6wpmrta1L1j8K9AMVXyT/QCajba
```

5. کلیک **Save Changes**
6. منتظر بمان تا service restart شود (1-2 دقیقه)

### گام 3: تست Authentication

بعد از restart، این endpoint را تست کن:

```bash
curl https://goalcoin.onrender.com/api/admin-test/config
```

باید برگرداند:
```json
{
  "configured": true,
  "ADMIN_USERNAME": "Set ✅",
  "ADMIN_PASSWORD_HASH": "Set ✅"
}
```

### گام 4: تست Login

```bash
curl -X POST https://goalcoin.onrender.com/api/admin-test/verify \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

باید برگرداند:
```json
{
  "success": true,
  "authHeader": "Basic YWRtaW46YWRtaW4xMjM=",
  "message": "Authentication successful"
}
```

---

## 🔧 اگر هنوز کار نکرد:

### چک کردن Frontend localStorage:

1. باز کردن Developer Tools (F12)
2. رفتن به **Application** → **Local Storage**
3. پیدا کردن `admin_auth_header`
4. مطمئن شو که با `Basic ` شروع می‌شود

### پاک کردن Cache:

```javascript
// در Console مرورگر:
localStorage.clear();
location.reload();
```

---

## 📝 نکات مهم:

1. **Password Hash** باید با `$2b$10$` شروع شود
2. **Username** پیش‌فرض `admin` است
3. بعد از تغییر environment variables، حتماً **restart** کن
4. اگر password را فراموش کردی، دوباره hash جدید بساز

---

## 🐛 Debug:

اگر هنوز مشکل داری، لاگ‌های Render.com را چک کن:

```
🔐 BasicAuth Middleware
Authorization Header: Basic ...
Username: admin | Expected: admin
Password validation result: true/false
```

اگر `Password validation result: false` دیدی، یعنی password اشتباه است.

---

## ✅ بعد از Fix:

صفحه admin باید:
- Login موفق شود ✅
- Users list نمایش داده شود ✅
- بدون logout خودکار باقی بماند ✅

---

**آخرین بروزرسانی:** November 9, 2025
