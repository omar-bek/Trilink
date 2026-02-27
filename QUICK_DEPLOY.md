# 🚀 Quick Deployment Guide

## خطوات النشر السريع

### 1. إعداد البيئة

```bash
# نسخ ملف البيئة
cp .env.production.example .env.production

# تعديل المتغيرات (مهم جداً!)
nano .env.production
```

### 2. بناء وتشغيل

```bash
# بناء الصور
docker-compose build

# تشغيل الخدمات
docker-compose up -d

# عرض السجلات
docker-compose logs -f
```

### 3. التحقق

```bash
# Backend
curl http://localhost:3000/health

# Frontend  
curl http://localhost/health
```

## 🔑 متغيرات مهمة يجب تغييرها

1. **JWT_SECRET** و **JWT_REFRESH_SECRET** - استخدم `openssl rand -base64 32`
2. **MONGODB_URI** - رابط قاعدة البيانات الفعلية
3. **CORS_ORIGIN** - نطاقك الفعلي (مثل: https://yourdomain.com)
4. **REDIS_PASSWORD** - كلمة مرور قوية
5. **Payment Gateway Keys** - مفاتيح الإنتاج

## 📚 للمزيد من التفاصيل

راجع ملف `DEPLOYMENT.md` للدليل الكامل.
