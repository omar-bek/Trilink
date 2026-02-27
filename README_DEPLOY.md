# 🚀 النشر البسيط - خطوات سريعة

## الطريقة الأبسط للنشر (بدون Docker)

### الخطوة 1: إعداد Backend

```bash
cd backend

# 1. إنشاء ملف .env
nano .env
# (انسخ المتغيرات من env.example.txt وعدلها)

# 2. تثبيت وبناء
npm ci --only=production
npm run build

# 3. تشغيل مع PM2
pm2 start dist/server.js --name trilink-backend
pm2 save
```

### الخطوة 2: إعداد Frontend

```bash
cd frontend

# 1. إنشاء ملف .env.production
nano .env.production
# VITE_API_BASE_URL=https://yourdomain.com/api

# 2. بناء
npm ci
npm run build:prod

# 3. نسخ الملفات لـ Nginx
sudo cp -r dist/* /var/www/html/
```

### الخطوة 3: إعداد Nginx

```bash
# نسخ ملف الإعدادات
sudo cp nginx-simple.conf /etc/nginx/sites-available/trilink

# تعديل النطاق في الملف
sudo nano /etc/nginx/sites-available/trilink

# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/trilink /etc/nginx/sites-enabled/

# اختبار وإعادة التشغيل
sudo nginx -t
sudo systemctl restart nginx
```

### الخطوة 4: SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## ✅ جاهز!

الآن التطبيق يعمل على:
- Frontend: https://yourdomain.com
- Backend: https://api.yourdomain.com

## 📝 ملاحظات مهمة

1. **ملف .env للـ Backend** يجب أن يحتوي على:
   - `JWT_SECRET` و `JWT_REFRESH_SECRET` (32+ حرف)
   - `MONGODB_URI` (رابط قاعدة البيانات)
   - `CORS_ORIGIN` (نطاقك)

2. **PM2** لإدارة Backend:
   ```bash
   pm2 logs trilink-backend    # عرض السجلات
   pm2 restart trilink-backend # إعادة التشغيل
   pm2 status                   # الحالة
   ```

3. **التحديثات**:
   ```bash
   git pull
   cd backend && npm ci && npm run build && pm2 restart trilink-backend
   cd frontend && npm ci && npm run build:prod && sudo cp -r dist/* /var/www/html/
   ```

## 📚 للمزيد

- `SIMPLE_DEPLOY.md` - دليل مفصل
- `DEPLOYMENT.md` - دليل كامل مع Docker
