#!/bin/bash

# TriLink Deployment Script
# سكريبت بسيط للنشر

set -e  # إيقاف عند أي خطأ

echo "🚀 بدء عملية النشر..."

# الألوان للرسائل
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# التحقق من وجود Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js غير مثبت${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js موجود${NC}"

# Backend Deployment
echo -e "${YELLOW}📦 بناء Backend...${NC}"
cd backend

# التحقق من وجود ملف .env
if [ ! -f .env ]; then
    echo -e "${RED}❌ ملف .env غير موجود في مجلد backend${NC}"
    echo "يرجى إنشاء ملف .env أولاً"
    exit 1
fi

# تثبيت التبعيات
echo "تثبيت التبعيات..."
npm ci --only=production

# بناء المشروع
echo "بناء المشروع..."
npm run build

# التحقق من نجاح البناء
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ فشل البناء${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend مبني بنجاح${NC}"

# Frontend Deployment
echo -e "${YELLOW}📦 بناء Frontend...${NC}"
cd ../frontend

# التحقق من وجود ملف .env.production
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  ملف .env.production غير موجود، سيتم استخدام القيم الافتراضية${NC}"
fi

# تثبيت التبعيات
echo "تثبيت التبعيات..."
npm ci

# بناء المشروع
echo "بناء المشروع..."
npm run build:prod

# التحقق من نجاح البناء
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ فشل البناء${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend مبني بنجاح${NC}"

# PM2 Deployment (إذا كان PM2 مثبت)
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 إعادة تشغيل Backend مع PM2...${NC}"
    cd ../backend
    
    # إيقاف العملية القديمة إن وجدت
    pm2 delete trilink-backend 2>/dev/null || true
    
    # تشغيل العملية الجديدة
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
    else
        pm2 start dist/server.js --name trilink-backend
    fi
    
    # حفظ الإعدادات
    pm2 save
    
    echo -e "${GREEN}✅ Backend يعمل مع PM2${NC}"
else
    echo -e "${YELLOW}⚠️  PM2 غير مثبت، يمكنك تشغيل Backend يدوياً:${NC}"
    echo "cd backend && npm start"
fi

# Nginx (إذا كان Nginx مثبت)
if command -v nginx &> /dev/null; then
    echo -e "${YELLOW}📋 تذكير: تأكد من نسخ ملفات Frontend إلى مجلد Nginx${NC}"
    echo "sudo cp -r frontend/dist/* /var/www/trilink-frontend/"
    echo "sudo systemctl reload nginx"
fi

echo -e "${GREEN}🎉 اكتمل النشر بنجاح!${NC}"
echo ""
echo "الخطوات التالية:"
echo "1. تحقق من أن Backend يعمل: pm2 logs trilink-backend"
echo "2. نسخ ملفات Frontend إلى Nginx"
echo "3. إعادة تحميل Nginx: sudo systemctl reload nginx"
echo "4. التحقق من الصحة: curl http://localhost:3000/health"
