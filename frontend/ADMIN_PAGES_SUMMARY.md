# Admin Pages Summary

## نظرة عامة على صفحات الإدارة

تم إنشاء نظام إدارة شامل يمنح الإدارة تحكم كامل في الموقع.

## الصفحات المتاحة

### 1. Admin Dashboard (`/admin/dashboard`)
**الوصف:** لوحة تحكم شاملة تعرض إحصائيات عن جميع جوانب المنصة

**الميزات:**
- إحصائيات المستخدمين والشركات
- إحصائيات Purchase Requests, RFQs, Bids, Contracts
- إحصائيات Shipments, Payments, Disputes
- روابط سريعة لجميع الصفحات
- نظرة عامة على قيمة المنصة

**الوصول:** Admin فقط

---

### 2. User Management (`/admin/users`)
**الوصف:** إدارة المستخدمين في جميع الشركات

**الميزات:**
- عرض جميع المستخدمين مع الفلترة
- إنشاء مستخدمين جدد
- تعديل معلومات المستخدمين
- حذف المستخدمين
- إدارة الصلاحيات المخصصة
- إحصائيات (Total, Active, Inactive, Pending)
- فلترة حسب Role و Status

**الوصول:** Admin و Company Manager

---

### 3. Company Management (`/admin/companies`)
**الوصف:** إدارة جميع الشركات في المنصة

**الميزات:**
- عرض جميع الشركات
- إنشاء شركات جديدة
- تعديل معلومات الشركات
- الموافقة/رفض الشركات المعلقة
- حذف الشركات
- عرض الفئات المرتبطة بكل شركة
- فلترة حسب Type و Status

**الوصول:** Admin فقط

---

### 4. Company Details (`/admin/companies/:id`)
**الوصف:** عرض تفاصيل شركة معينة

**الميزات:**
- معلومات الشركة الكاملة
- قائمة المستخدمين في الشركة
- المستندات المرفقة
- إجراءات الموافقة/الرفض/الحذف

**الوصول:** Admin فقط

---

### 5. Category Management (`/admin/categories`)
**الوصف:** إدارة فئات المنتجات والخدمات

**الميزات:**
- عرض شجرة الفئات
- إنشاء فئات جديدة (جذرية أو فرعية)
- تعديل الفئات
- حذف الفئات
- تفعيل/تعطيل الفئات
- عرض المسار (Path) لكل فئة

**الوصول:** Admin فقط

---

### 6. Audit Logs (`/admin/audit-logs`)
**الوصف:** عرض سجلات النشاط في النظام

**الميزات:**
- عرض جميع سجلات النشاط
- فلترة حسب:
  - Action (CREATE, UPDATE, DELETE, VIEW)
  - Resource (user, company, purchase_request, etc.)
  - Status (success, failure)
  - User, Company
- تصدير السجلات (CSV, Excel)
- عرض تفاصيل كل سجل:
  - Timestamp, User, Company
  - Action, Resource, Status
  - IP Address, User Agent
  - Changes (before/after)
- إحصائيات (Total, Success, Failures)

**الوصول:** Admin فقط

---

### 7. System Settings (`/admin/settings`)
**الوصف:** إعدادات النظام العامة

**الميزات:**
- **General Settings:**
  - Site Name, Description
  - Maintenance Mode
  - Allow Registration

- **Email Settings:**
  - SMTP Configuration
  - From Email/Name

- **Security Settings:**
  - Session Timeout
  - Max Login Attempts
  - Password Requirements
  - Email Verification
  - Two-Factor Authentication

- **Notification Settings:**
  - Email Notifications
  - SMS Notifications
  - Push Notifications

- **Storage Settings:**
  - Max File Size
  - Allowed File Types
  - Storage Provider (Local/S3/Azure)

**الوصول:** Admin فقط

---

## التنقل

جميع صفحات الإدارة متاحة من قائمة التنقل الرئيسية تحت قسم "Administration".

### هيكل القائمة:
```
Administration
├── Dashboard (Admin only)
├── Users (Admin, Company Manager)
├── Companies (Admin only)
├── Categories (Admin only)
├── Audit Logs (Admin only)
└── System Settings (Admin only)
```

## الأمان

- جميع الصفحات محمية بـ `ProtectedRoute`
- الصفحات الحساسة تتطلب `Role.ADMIN`
- بعض الصفحات متاحة لـ `Company Manager` (مثل User Management لشركته فقط)

## الملفات

### الصفحات:
- `frontend/src/pages/Admin/AdminDashboard.tsx`
- `frontend/src/pages/Admin/UserManagement.tsx`
- `frontend/src/pages/Admin/CompanyManagement.tsx`
- `frontend/src/pages/Admin/CompanyDetails.tsx`
- `frontend/src/pages/Admin/CategoryManagement.tsx`
- `frontend/src/pages/Admin/AuditLogs.tsx`
- `frontend/src/pages/Admin/SystemSettings.tsx`

### التكوين:
- `frontend/src/router/AppRouter.tsx` - Routes
- `frontend/src/config/navigation.tsx` - Navigation menu
- `frontend/src/pages/Admin/index.ts` - Exports

## ملاحظات

- جميع الصفحات تستخدم Material-UI
- الصفحات متجاوبة (Responsive)
- استخدام React Query للـ data fetching
- استخدام React Hook Form للـ forms
- استخدام Yup للـ validation
