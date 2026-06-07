# ⚡ ولت‌مپ | VoltMap

اپلیکیشن پیدا کردن ایستگاه‌های شارژ خودرو برقی در ایران.

## 🚀 راه‌اندازی

### پیش‌نیازها
- Node.js نسخه ۱۸ یا بالاتر → دانلود از [nodejs.org](https://nodejs.org)

### مراحل

```bash
# ۱. وارد پوشه پروژه شو
cd voltmap

# ۲. نصب پکیج‌ها
npm install

# ۳. اجرا
npm run dev
```

بعد مرورگر رو باز کن و برو به: **http://localhost:5173**

---

## 📁 ساختار پروژه

```
voltmap/
├── src/
│   ├── pages/
│   │   ├── Home.jsx          ← صفحه اصلی (نقشه + لیست)
│   │   ├── StationDetail.jsx ← جزئیات ایستگاه
│   │   ├── Admin.jsx         ← پنل ادمین
│   │   ├── Routes.jsx        ← مسیر هوشمند (به زودی)
│   │   └── Profile.jsx       ← پروفایل (به زودی)
│   ├── components/
│   │   ├── Header.jsx        ← هدر با لوگو
│   │   ├── BottomNav.jsx     ← نوار پایین
│   │   ├── MapView.jsx       ← نقشه Leaflet
│   │   └── StationCard.jsx   ← کارت ایستگاه
│   └── data/
│       └── stations.js       ← داده‌ها + localStorage
└── public/
    └── logo.png              ← لوگوی خودت رو اینجا بذار
```

## 🖼️ جایگزینی لوگو

فایل لوگوت رو با نام `logo.png` در پوشه `public/` قرار بده،
بعد در `src/components/Header.jsx` کامنت رو بردار و `<img>` رو فعال کن.

## 🗺️ نقشه

از OpenStreetMap (رایگان) استفاده می‌کنه. برای Google Maps باید API key بگیری.

---

## قدم‌های بعدی

- [ ] اتصال به بک‌اند (Firebase یا Node.js)
- [ ] احراز هویت کاربر
- [ ] مسیریابی هوشمند
- [ ] پرداخت آنلاین
- [ ] نوتیفیکیشن وضعیت ایستگاه
