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

## GitHub Pages

The built static site is committed in `docs/` for GitHub Pages. In repository settings, use:

```text
Source: Deploy from a branch
Branch: main
Folder: /docs
```

Demo login:

```text
username: central
password: 123456
```

## الشاشات الرئيسية

- Login
- الرئيسية
- دليل التجربة
- العملاء
- ملف العميل
- إنشاء عميل
- الطلبات الواردة
- تسجيل اتصال / طلب جديد
- تفاصيل الطلب
- الطلبات المحولة
- المتابعة
- الشكاوى
- الصيانة
- الإشعارات
- التقارير
- الإعدادات
- حالات التجربة

## أدوات مراجعة الإدارة

- زر ملاحظات عائم في كل شاشة.
- تصدير ملاحظات الإدارة من صفحة الإعدادات.
- دليل تجربة مختصر لاجتماعات الموافقة.
- فلاتر موحدة حسب اسم العميل، الهاتف، رقم الطلب، التاريخ، الحالة، نوع الطلب، والموظف المسؤول.
- نسخة جاهزة للنشر على GitHub Pages داخل `docs/`.

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
