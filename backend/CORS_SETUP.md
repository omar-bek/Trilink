# CORS Configuration Guide

## المشكلة
عندما الـ frontend على `https://trilink.me` يحاول الاتصال بالـ backend، يحدث خطأ CORS لأن:
- الـ backend CORS مضبوط على `http://localhost:3001`
- الـ frontend يحاول الاتصال من `https://trilink.me`

## الحل

### 1. في Backend - ملف `.env.production`:
```bash
CORS_ORIGIN=https://trilink.me,https://www.trilink.me
FRONTEND_URL=https://trilink.me
```

### 2. في Frontend - ملف `.env.production`:
```bash
VITE_API_BASE_URL=https://trilink.me/api
```

### 3. إعادة بناء:
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### 4. في السيرفر:
```bash
# تأكد من أن .env.production موجود ويحتوي على:
CORS_ORIGIN=https://trilink.me

# شغل السيرفر
NODE_ENV=production npm start
```

## ملاحظات
- CORS يدعم عدة origins مفصولة بفواصل
- تأكد من استخدام HTTPS في production
- الـ backend يجب أن يعمل على نفس الـ domain أو subdomain
