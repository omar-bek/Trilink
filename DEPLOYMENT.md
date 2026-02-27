# TriLink Deployment Guide

دليل شامل لنشر تطبيق TriLink في بيئة الإنتاج.

> 💡 **للنشر البسيط بدون Docker:** راجع ملف `SIMPLE_DEPLOY.md` للدليل السريع والبسيط.

## 📋 المتطلبات الأساسية

- Docker & Docker Compose
- Node.js 20+ (للبناء المحلي)
- MongoDB 7.0+
- Redis 7+
- SSL Certificate (للإنتاج)

## 🚀 النشر السريع باستخدام Docker Compose

### 1. إعداد متغيرات البيئة

```bash
# نسخ ملف المثال
cp .env.production.example .env.production

# تعديل القيم المطلوبة
nano .env.production
```

**مهم جداً:** تأكد من:
- تغيير جميع كلمات المرور والـ secrets
- استخدام MongoDB URI للإنتاج
- تعيين CORS_ORIGIN إلى نطاقك الفعلي
- تفعيل SSL/HTTPS

### 2. بناء وتشغيل الحاويات

```bash
# بناء جميع الصور
docker-compose build

# تشغيل الحاويات
docker-compose up -d

# عرض السجلات
docker-compose logs -f

# التحقق من حالة الخدمات
docker-compose ps
```

### 3. التحقق من الصحة

```bash
# Backend Health Check
curl http://localhost:3000/health

# Frontend Health Check
curl http://localhost/health
```

## 🏗️ النشر بدون Docker

### Backend

```bash
cd backend

# تثبيت التبعيات
npm ci --only=production

# بناء المشروع
npm run build:prod

# تشغيل الخادم
npm start:prod
```

### Frontend

```bash
cd frontend

# تثبيت التبعيات
npm ci

# بناء المشروع
npm run build:prod

# معاينة البناء
npm run preview:prod
```

## 🔒 الأمان

### 1. إعدادات JWT

```bash
# إنشاء JWT secrets قوية
openssl rand -base64 32  # للـ JWT_SECRET
openssl rand -base64 32  # للـ JWT_REFRESH_SECRET
```

### 2. إعدادات قاعدة البيانات

- استخدم MongoDB Atlas أو MongoDB مع SSL
- قم بتفعيل Authentication
- استخدم Network Security Groups

### 3. إعدادات Nginx (للإنتاج)

```nginx
# SSL Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # ... باقي الإعدادات
}
```

### 4. Rate Limiting

تأكد من ضبط:
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

## 📊 المراقبة والـ Logging

### 1. Logs

```bash
# عرض سجلات Backend
docker-compose logs -f backend

# عرض سجلات Frontend
docker-compose logs -f frontend

# عرض جميع السجلات
docker-compose logs -f
```

### 2. Health Checks

جميع الخدمات تحتوي على health checks:
- Backend: `http://localhost:3000/health`
- Frontend: `http://localhost/health`
- MongoDB: تلقائي
- Redis: تلقائي

## 🔄 التحديثات

### تحديث التطبيق

```bash
# سحب آخر التغييرات
git pull origin main

# إعادة بناء الصور
docker-compose build

# إعادة تشغيل الخدمات
docker-compose up -d

# أو إعادة تشغيل خدمة محددة
docker-compose restart backend
docker-compose restart frontend
```

### تحديث قاعدة البيانات

```bash
# تشغيل migrations
docker-compose exec backend npm run migrate:indexes
```

## 📦 النسخ الاحتياطي

### MongoDB Backup

```bash
# إنشاء نسخة احتياطية
docker-compose exec mongodb mongodump --out /backup

# استعادة نسخة احتياطية
docker-compose exec mongodb mongorestore /backup
```

### Redis Backup

النسخ الاحتياطي لـ Redis تلقائي عبر `appendonly yes`

## 🌐 النشر على Cloud Providers

### AWS

1. استخدم ECS أو EKS
2. استخدم RDS for MongoDB أو DocumentDB
3. استخدم ElastiCache للـ Redis
4. استخدم CloudFront للـ CDN
5. استخدم ALB مع SSL

### Azure

1. استخدم Azure Container Instances
2. استخدم Cosmos DB
3. استخدم Azure Cache for Redis
4. استخدم Azure Front Door

### Google Cloud

1. استخدم Cloud Run
2. استخدم MongoDB Atlas
3. استخدم Memorystore للـ Redis
4. استخدم Cloud CDN

## 🐛 استكشاف الأخطاء

### المشاكل الشائعة

1. **خطأ في الاتصال بقاعدة البيانات**
   - تحقق من `MONGODB_URI`
   - تأكد من أن MongoDB يعمل

2. **خطأ CORS**
   - تحقق من `CORS_ORIGIN`
   - تأكد من تطابق النطاق

3. **خطأ في JWT**
   - تحقق من `JWT_SECRET` و `JWT_REFRESH_SECRET`
   - تأكد من طولها (32+ حرف)

4. **مشاكل في البناء**
   - امسح `node_modules` و `dist`
   - أعد التثبيت: `npm ci`

## 📝 Checklist قبل النشر

- [ ] جميع متغيرات البيئة معبأة
- [ ] JWT secrets قوية ومولدة
- [ ] قاعدة البيانات محمية
- [ ] SSL/HTTPS مفعل
- [ ] CORS مضبوط بشكل صحيح
- [ ] Rate limiting مفعل
- [ ] Logging مفعل
- [ ] Health checks تعمل
- [ ] النسخ الاحتياطي مضبوط
- [ ] المراقبة مفعلة
- [ ] الاختبارات تمر
- [ ] Documentation محدث

## 🔗 روابط مفيدة

- [Docker Documentation](https://docs.docker.com/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📞 الدعم

للحصول على المساعدة، افتح issue في المستودع.
