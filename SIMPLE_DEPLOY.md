# 🚀 دليل النشر البسيط (بدون Docker)

دليل سريع وبسيط لنشر TriLink بدون استخدام Docker.

## 📋 المتطلبات

- Node.js 20+
- MongoDB (محلي أو MongoDB Atlas)
- Redis (اختياري)
- Nginx (للإنتاج)
- PM2 (لإدارة العمليات)

## 🔧 التثبيت على السيرفر

### 1. تثبيت Node.js و Nginx

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs nginx
```

### 2. تثبيت PM2

```bash
sudo npm install -g pm2
```

### 3. تثبيت MongoDB

```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# أو استخدم MongoDB Atlas (أسهل)
```

## 📦 إعداد المشروع

### 1. رفع الملفات

```bash
# على السيرفر
cd /var/www
git clone https://github.com/your-repo/trilink.git
cd trilink
```

### 2. إعداد Backend

```bash
cd backend

# تثبيت التبعيات
npm ci --only=production

# إنشاء ملف .env
nano .env
```

**محتوى ملف `.env` للـ Backend:**

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://localhost:27017/trilink
# أو MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/trilink

CORS_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

BCRYPT_ROUNDS=12
LOG_LEVEL=info

# Email
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=TriLink Platform

# Payment (اختياري)
STRIPE_SECRET_KEY=your-stripe-key
PAYPAL_CLIENT_ID=your-paypal-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
PAYPAL_ENVIRONMENT=production

# AWS S3 (اختياري)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

```bash
# بناء المشروع
npm run build

# اختبار البناء
npm start
```

### 3. إعداد Frontend

```bash
cd ../frontend

# تثبيت التبعيات
npm ci

# إنشاء ملف .env.production
nano .env.production
```

**محتوى ملف `.env.production` للـ Frontend:**

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_NAME=TriLink
VITE_APP_VERSION=1.0.0
```

```bash
# بناء المشروع
npm run build:prod

# اختبار البناء
npm run preview:prod
```

## 🚀 تشغيل التطبيق

### 1. تشغيل Backend مع PM2

```bash
cd /var/www/trilink/backend

# تشغيل مع PM2
pm2 start dist/server.js --name trilink-backend

# أو استخدم ملف الإعداد
pm2 start ecosystem.config.js

# حفظ الإعدادات
pm2 save

# تفعيل التشغيل التلقائي عند إعادة التشغيل
pm2 startup
```

### 2. تشغيل Frontend مع Nginx

```bash
# نسخ ملفات البناء
sudo cp -r /var/www/trilink/frontend/dist/* /var/www/html/

# أو إنشاء مجلد منفصل
sudo mkdir -p /var/www/trilink-frontend
sudo cp -r /var/www/trilink/frontend/dist/* /var/www/trilink-frontend/
```

## ⚙️ إعداد Nginx

```bash
sudo nano /etc/nginx/sites-available/trilink
```

**محتوى ملف Nginx:**

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/trilink-frontend;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Main app
    location / {
        try_files $uri $uri/ /index.html;
    }
}

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/trilink /etc/nginx/sites-enabled/

# اختبار الإعدادات
sudo nginx -t

# إعادة تشغيل Nginx
sudo systemctl restart nginx
```

## 🔒 إعداد SSL (Let's Encrypt)

```bash
# تثبيت Certbot
sudo apt-get install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# التجديد التلقائي
sudo certbot renew --dry-run
```

## 📊 إدارة العمليات

### PM2 Commands

```bash
# عرض جميع العمليات
pm2 list

# عرض السجلات
pm2 logs trilink-backend

# إعادة التشغيل
pm2 restart trilink-backend

# إيقاف
pm2 stop trilink-backend

# حذف
pm2 delete trilink-backend

# مراقبة الأداء
pm2 monit
```

## 🔄 التحديثات

### تحديث التطبيق

```bash
cd /var/www/trilink

# سحب آخر التغييرات
git pull origin main

# تحديث Backend
cd backend
npm ci --only=production
npm run build
pm2 restart trilink-backend

# تحديث Frontend
cd ../frontend
npm ci
npm run build:prod
sudo cp -r dist/* /var/www/trilink-frontend/
sudo systemctl reload nginx
```

## 🛠️ استكشاف الأخطاء

### فحص السجلات

```bash
# Backend logs
pm2 logs trilink-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# System logs
sudo journalctl -u nginx -f
```

### فحص الحالة

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost/

# PM2
pm2 status
```

## 📝 Checklist

- [ ] Node.js 20+ مثبت
- [ ] MongoDB يعمل
- [ ] ملفات `.env` معبأة
- [ ] Backend مبني ويعمل
- [ ] Frontend مبني
- [ ] PM2 يشغل Backend
- [ ] Nginx مضبوط
- [ ] SSL مثبت
- [ ] Firewall مضبوط
- [ ] النسخ الاحتياطي مضبوط

## 🔥 نصائح مهمة

1. **الأمان:**
   - استخدم كلمات مرور قوية
   - فعّل Firewall: `sudo ufw enable`
   - حدّث النظام: `sudo apt update && sudo apt upgrade`

2. **الأداء:**
   - استخدم MongoDB Atlas للـ production
   - فعّل Redis للـ caching
   - راقب الأداء بـ PM2

3. **النسخ الاحتياطي:**
   - نسخ احتياطي يومي لقاعدة البيانات
   - نسخ احتياطي للملفات

## 📞 المساعدة

إذا واجهت مشاكل، تحقق من:
- السجلات: `pm2 logs` و `sudo tail -f /var/log/nginx/error.log`
- الحالة: `pm2 status` و `sudo systemctl status nginx`
- الاتصال: `curl http://localhost:3000/health`
