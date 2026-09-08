# AlNaseem Central Prototype

Prototype تفاعلي عربي RTL لوظيفة السنترال والاستقبال في شركة النسيم إخوان. الهدف منه مراجعة مسار استقبال الاتصال، البحث عن العميل، إنشاء الطلب، تحويله، ومتابعته قبل التطوير النهائي.

## Scope

- Frontend فقط بدون Backend.
- بيانات وهمية مترابطة ومحفوظة في LocalStorage.
- مخصص لدور موظفة السنترال / الاستقبال.
- لا يحتوي على شاشات تنفيذية لباقي الموظفين.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React Icons
- LocalStorage

## How To Run

```bash
pnpm install
pnpm dev
```

Demo login:

```text
username: central
password: 123456
```

## Main Screens

- Login
- Dashboard
- Customers
- Customer Profile
- New Customer
- Incoming Requests
- New Request / Contact
- Request Details
- Transferred Requests
- Follow Ups
- Complaints
- Maintenance
- Notifications
- Reports
- Settings
- Demo Mode

## Demo Scenarios

- عميل جديد
- عميل موجود وله طلبات سابقة
- هاتف مكرر
- طلب مسودة
- طلب بانتظار الاستلام
- طلب مستلم
- طلب متأخر
- طلب بحاجة معلومات
- اتصال لاحق
- موعد زيارة يحتاج تأكيد
- شكوى
- صيانة
- طلب عاجل
- طلب مغلق أو ملغي
- Timeline بعدة موظفين
- Reset Demo Data

## Folder Structure

```text
src/
  App.tsx
  App.css
  index.css
  main.tsx
public/
  alnaseem-logo.png
.openai/
  hosting.json
```

## Prototype Limitations

- لا توجد صلاحيات حقيقية أو قاعدة بيانات إنتاجية.
- WhatsApp/SMS/Email مجرد نطاق مستبعد حاليًا.
- المرفقات ممثلة كحقل/سياق فقط وليست رفع ملفات فعليًا.
- WebMCP يسجل أدوات بسيطة عندما يكون المتصفح داعمًا له، ولم تتوفر بيئة تحقق WebMCP مستقلة داخل هذا التشغيل.
