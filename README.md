# VoltMap Backend

بک‌اند پروژه‌ی VoltMap — با **Node.js + Express + MySQL**، معماری **Hexagonal (Ports & Adapters)** و رعایت اصول **SOLID**.

این پروژه برای اجرا با MySQL/MariaDB (مثلاً XAMPP) آماده شده: migration و seed را روی دیتابیس محلی اجرا کنید، سپس سرور را بالا بیاورید.

---

## ۱. معماری پروژه — چرا این ساختار؟

```
src/
├── domain/                 ← هسته‌ی پروژه؛ Entity ها و خطاهای دامنه. هیچ وابستگی‌ای به Express/pg ندارد.
│   ├── entities/            (User, Station, Vehicle, NewsArticle, StationReport)
│   └── errors/               (AppError و زیرکلاس‌هاش)
│
├── application/            ← منطق کسب‌وکار (Use Cases / Services)
│   ├── ports/                ← Interface ها (قرارداد). این‌جا "چی باید انجام بشه" تعریف می‌شه، نه "چطور".
│   │   ├── repositories/     (UserRepository, StationRepository, ...)
│   │   ├── services/         (PasswordHasher, TokenService)
│   │   └── UnitOfWork.js     (برای تراکنش/ACID)
│   └── services/             ← پیاده‌سازی منطق دامنه، فقط با Port ها کار می‌کنه (AuthService, StationService, ...)
│
├── adapters/                ← جزئیات فنی/بیرونی
│   ├── http/                 ← Adapter ورودی (Driving): Express routes/controllers/middlewares
│   └── persistence/
│       ├── mysql/             ← Adapter خروجی (Driven): پیاده‌سازی واقعی Port ها با MySQL
│       └── security/          ← پیاده‌سازی bcrypt و jwt
│
└── infrastructure/         ← Wiring، DB connection pool، container (DI)، graceful shutdown
```

**نکته‌ی مهم DIP (Dependency Inversion):**
لایه‌ی `application` هیچ‌جا مستقیماً `mysql2` یا `bcrypt` را import نمی‌کند؛ فقط به Interface های داخل `application/ports` وابسته است.
تنها جایی که پیاده‌سازی واقعی MySQL به Service ها وصل می‌شود، فایل `src/infrastructure/container.js` است (Composition Root).

➜ **یعنی اگر یک روز خواستی از MySQL به دیتابیس دیگری (PostgreSQL, Mongo, یا حتی In-Memory برای تست) بروی**، فقط کافیست:

1. یک کلاس جدید بسازی که همان متدهای `UserRepository` (مثلاً) را پیاده‌سازی کند.
2. در `container.js` آن را جایگزین `MyUserRepository` کنی.
   هیچ‌کدام از Service ها یا Controller ها نیاز به تغییر ندارند.

### چطور اصول SOLID رعایت شده؟

- **SRP**: هر Repository فقط مسئول یک aggregate است (User، Station، ...)؛ هر Service فقط مسئول یک bounded context (Auth، Station، Profile، ...). _(توجه: به‌جای یک کلاس جداگانه برای هر عملیات تکی، از یک Service منسجم به‌ازای هر دامنه استفاده شده تا پروژه برای کسی که تازه بک‌اند یاد می‌گیرد قابل‌فهم بماند — این یک تصمیم عملی و رایج در پروژه‌های واقعی است، نه نقض SRP.)_
- **OCP**: افزودن یک DB جدید یا یک قانون کسب‌وکار جدید بدون تغییر کدهای موجود ممکن است (پیاده‌سازی جدید Port).
- **LSP**: هر پیاده‌سازی MySQL کاملاً قرارداد Port مربوطه را رعایت می‌کند.
- **ISP**: هر Port کوچک و مخصوص یک aggregate است (نه یک Interface غول‌پیکر).
- **DIP**: Service ها به Interface وابسته‌اند، نه به پیاده‌سازی. تزریق وابستگی از طریق constructor و `container.js`.

---

## ۲. رعایت نیازمندی‌های فنی که خواستی

| نیاز                          | کجا پیاده شده                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hexagonal Architecture        | `domain/` `application/` `adapters/` `infrastructure/`                                                                                                                                              |
| SOLID                         | توضیح بالا                                                                                                                                                                                          |
| مستقل از DB (Interface-based) | `application/ports/repositories/*.js` + `infrastructure/container.js`                                                                                                                               |
| Connection Pool               | `src/infrastructure/database/pool.js` (`mysql2` createPool با `connectionLimit`)                                                                                                                    |
| Timeout هر Connection         | همان فایل: `connectTimeout`, `idleTimeout`                                                                                                                                                          |
| ACID                          | `application/ports/UnitOfWork.js` + `MysqlUnitOfWork.js` (BEGIN/COMMIT/ROLLBACK) در تمام عملیات چندمرحله‌ای (ثبت‌نام، رفرش توکن، افزودن خودرو، ثبت گزارش شلوغی) + بازمحاسبه‌ی rating بعد از ثبت نظر |
| Graceful Shutdown             | `src/infrastructure/server.js` (SIGINT/SIGTERM → بستن HTTP سرور → بستن pool → خروج)                                                                                                                 |
| Rate Limit                    | `adapters/http/middlewares/rateLimiters.js` (global + سخت‌گیرانه‌تر روی auth)                                                                                                                       |
| امنیت (SQLi, OWASP, CSRF)     | بخش ۷ پایین‌تر توضیح کامل داده شده                                                                                                                                                                  |

---

## ۳. نصب و راه‌اندازی — گام‌به‌گام

### گام ۱: پیش‌نیازها

- Node.js نسخه ۱۸ به بالا
- MySQL یا MariaDB (مثلاً از طریق XAMPP)

در phpMyAdmin (یا MySQL CLI) یک دیتابیس خالی بساز:

```sql
CREATE DATABASE voltmap CHARACTER SET utf8mb4 COLLATE utf8mb4_persian_ci;
```

پیش‌فرض‌های رایج XAMPP: کاربر `root`، رمز خالی، پورت `3306`.

### گام ۲: نصب پکیج‌ها

```bash
cd voltmap-backend
npm install
```

### گام ۳: تنظیم متغیرهای محیطی

```bash
cp .env.example .env
```

فایل `.env` را باز کن و مقادیر `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` را مطابق XAMPP/MySQL خودت تنظیم کن (پیش‌فرض `.env.example` برای XAMPP است).

⚠️ حتماً `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` را به مقادیر تصادفی و طولانی (حداقل ۳۲ کاراکتر) تغییر بده. برای ساخت سریع:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### گام ۴: اجرای Migration (ساخت جدول‌ها)

```bash
npm run db:migrate
```

این دستور تمام جدول‌ها، ایندکس‌ها و trigger های لازم را در دیتابیس می‌سازد (فایل SQL در `src/infrastructure/database/migrations/001_init.sql`).

### گام ۵: اجرای Seed (داده‌ی اولیه)

```bash
npm run db:seed
npm run db:seed-stations
```

`db:seed` ادمین و اخبار را می‌سازد؛ `db:seed-stations` ۱۴۶ ایستگاه واقعی را از `scripts/data/stations.xlsx` وارد می‌کند.
بعد از اجرا در ترمینال می‌بینی:

```
👤 ادمین: شماره ... — ورود با OTP
🌱 146 ایستگاه از Excel با موفقیت seed شد
```

می‌توانی کل pipeline را با یک دستور اجرا کنی:

```bash
npm run db:reset
```

### گام ۶: اجرای سرور

```bash
npm run dev     # حالت توسعه (با --watch، ری‌استارت خودکار)
# یا
npm start       # حالت عادی
```

اگر همه‌چیز درست باشد:

```
✅ اتصال به MySQL برقرار شد
🚀 VoltMap backend روی پورت 4000 در حالت development اجراست
```

### گام ۷: تست سریع با curl

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/stations
```

---

## ۴. مرجع کامل API

Base URL: `http://localhost:4000/api`

### Auth (`/auth`) — ورود با شماره موبایل + OTP

| متد  | مسیر                 | توضیح                                                                 | نیاز به توکن              |
| ---- | -------------------- | --------------------------------------------------------------------- | ------------------------- |
| GET  | `/auth/csrf-token`   | گرفتن توکن CSRF (قبل از refresh/logout)                               | خیر                       |
| POST | `/auth/otp/request`  | درخواست OTP — `{phone, purpose: "login"\|"register"}`                 | خیر                       |
| POST | `/auth/otp/verify`   | تأیید OTP — `{phone, code, purpose, name?}` → `{token, user}` + cookie | خیر                       |
| POST | `/auth/refresh`      | تمدید access token (از cookie)                                        | خیر (نیاز به CSRF header) |
| POST | `/auth/logout`       | خروج                                                                  | خیر (نیاز به CSRF header) |
| GET  | `/auth/me`           | اطلاعات کاربر لاگین‌کرده                                              | بله                       |

**نکته:** مسیرهای قدیمی `/auth/login` و `/auth/register` (ایمیل/رمز) حذف شده‌اند.

### Stations (`/stations`)

| متد    | مسیر                                    | توضیح                                    | نیاز    |
| ------ | --------------------------------------- | ---------------------------------------- | ------- |
| GET    | `/stations?search=&type=&status=&city=` | لیست ایستگاه‌ها با فیلتر                 | خیر     |
| GET    | `/stations/:id`                         | جزئیات یک ایستگاه + نظرات                | خیر     |
| POST   | `/stations`                             | ساخت ایستگاه جدید                        | ادمین   |
| PATCH  | `/stations/:id`                         | ویرایش ایستگاه                           | ادمین   |
| DELETE | `/stations/:id`                         | حذف ایستگاه                              | ادمین   |
| POST   | `/stations/:id/reviews`                 | ثبت نظر (rating خودکار بازمحاسبه می‌شود) | اختیاری |
| PATCH  | `/stations/:id/status`                  | تغییر وضعیت دستی                         | ادمین   |
| POST   | `/stations/:id/crowd-report`            | گزارش شلوغی/خلوتی توسط کاربر             | اختیاری |
| GET    | `/stations/:id/crowd-reports`           | آمار گزارش‌های شلوغی یک ایستگاه          | ادمین   |
| GET    | `/stations/crowd-reports/summary`       | آمار همه‌ی ایستگاه‌ها                    | ادمین   |

### Profile (`/profile`) — همه نیاز به توکن دارند

| متد    | مسیر                     | توضیح                             |
| ------ | ------------------------ | --------------------------------- |
| GET    | `/profile`               | اطلاعات پروفایل                   |
| PATCH  | `/profile`               | ویرایش (`name`, `email`) — شماره موبایل قابل تغییر نیست |
| GET    | `/profile/favorites`     | لیست ایستگاه‌های موردعلاقه        |
| POST   | `/profile/favorites/:id` | افزودن به موردعلاقه‌ها            |
| DELETE | `/profile/favorites/:id` | حذف از موردعلاقه‌ها               |

### Cars / کاتالوگ خودروهای برقی (`/cars`) — عمومی

| متد | مسیر | توضیح |
| --- | ---- | ----- |
| GET | `/cars` | لیست همه خودروها (هر کدام یک آبجکت). فیلتر اختیاری: `?brand=&bodyType=&connector=&search=` |
| GET | `/cars/brands` | لیست برندها برای سلکت فرانت |
| GET | `/cars/:id` | جزئیات یک خودرو از کاتالوگ |

نمونه آبجکت:

```json
{
  "id": 1,
  "brand": "kmc",
  "model": "Ej7",
  "trim": null,
  "bodyType": "SEDAN",
  "batteryKwh": "50.1",
  "rangeKm": "400",
  "connector": "GB/T",
  "maxDcKw": "60",
  "displayName": "kmc Ej7"
}
```

برای وارد کردن مجدد داده اکسل:

```bash
npm run db:seed-cars
```

### Vehicles (`/vehicles`) — همه نیاز به توکن دارند

CRUD کامل: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`

در `POST /vehicles` می‌توانی به‌جای ورود دستی، فقط `catalogCarId` بفرستی تا name/connector/range از کاتالوگ پر شود.
### News (`/news`)

`GET /` عمومی — `POST`, `PATCH /:id`, `DELETE /:id` فقط ادمین

### Station Reports — پیشنهاد ایستگاه جدید (`/station-reports`)

| متد    | مسیر                           | توضیح                    | نیاز    |
| ------ | ------------------------------ | ------------------------ | ------- |
| POST   | `/station-reports`             | ثبت پیشنهاد ایستگاه جدید | اختیاری |
| GET    | `/station-reports?status=`     | لیست پیشنهادها           | ادمین   |
| PATCH  | `/station-reports/:id/approve` | تأیید                    | ادمین   |
| PATCH  | `/station-reports/:id/reject`  | رد (`{reason}`)          | ادمین   |
| DELETE | `/station-reports/:id`         | حذف                      | ادمین   |

### Admin (`/admin`) — همه فقط ادمین

`GET /dashboard`, `GET /reviews`, `GET /reports/usage?days=7`, `GET /users`, `PATCH /users/:userId/membership`

### Routes/مسیریابی (`/routes`) — نیاز به توکن

`POST /plan` (placeholder — TODO پایین را ببین)، `GET /history`

---

## ۵. تست کامل با curl (سناریوی واقعی)

```bash
# ۱) درخواست OTP برای ثبت‌نام
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","purpose":"register"}'
# اگر SMS_IR_ENABLED=false باشد، کد در لاگ سرور چاپ می‌شود

# ۲) تأیید OTP و ساخت حساب
curl -c cookies.txt -X POST http://localhost:4000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","code":"12345","purpose":"register","name":"علی رضایی"}'
# پاسخ: { token, user } — token را نگه دار؛ refresh در cookies.txt ذخیره می‌شود

# لیست ایستگاه‌ها
curl http://localhost:4000/api/stations

# افزودن نظر (با توکن)
curl -X POST http://localhost:4000/api/stations/1/reviews \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"userName":"علی","text":"عالی بود","rating":5}'

# ورود ادمین (شماره ADMIN_PHONE در .env)
curl -X POST http://localhost:4000/api/auth/otp/request \
  -H "Content-Type: application/json" \
  -d '{"phone":"09120000000","purpose":"login"}'

curl -c admin.txt -X POST http://localhost:4000/api/auth/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"09120000000","code":"<OTP_FROM_LOG>","purpose":"login"}'

# داشبورد ادمین
curl http://localhost:4000/api/admin/dashboard -H "Authorization: Bearer <ADMIN_TOKEN>"
```

می‌توانی همین درخواست‌ها را در Postman یا Insomnia هم بزنی.

---

## ۵‑ب. راه‌اندازی پنل sms.ir (OTP)

1. در [پنل sms.ir](https://sms.ir) وارد شوید.
2. از منوی **برنامه‌نویسان** یک **کلید API** بسازید و در `.env` بگذارید:
   ```
   SMS_IR_API_KEY=xxxxxxxxxxxxxxxx
   ```
3. در بخش **ارسال سریع** یک قالب پیامک بسازید، مثلاً:
   ```
   کد ورود ولت‌مپ: #CODE#
   ```
   پس از تأیید قالب، **شناسه عددی** آن را کپی کنید:
   ```
   SMS_IR_TEMPLATE_ID=123456
   SMS_IR_TEMPLATE_PARAM=CODE
   ```
   (`CODE` همان نام پارامتر داخل `#...#` بدون علامت `#` است.)
4. ارسال واقعی را روشن کنید:
   ```
   SMS_IR_ENABLED=true
   ```
5. اگر `SMS_IR_ENABLED=false` باشد، کد OTP فقط در **لاگ ترمینال بک‌اند** چاپ می‌شود (مناسب توسعه محلی).

API استفاده‌شده: `POST https://api.sms.ir/v1/send/verify` با هدر `x-api-key`.

---

## ۶. اتصال به فرانت‌اند (پروژه React)

فرانت شما از قبل یک لایه‌ی انتزاعی خوب دارد (`src/api/*.js` با flag `USE_MOCK`). مراحل اتصال:

1. در `.env` فرانت:

   ```
   VITE_USE_MOCK=false
   VITE_API_BASE_URL=http://localhost:4000/api
   ```

2. در `src/api/client.js` فرانت، مطمئن شو `fetch` با `credentials: 'include'` صدا زده می‌شود (برای کوکی refresh).

3. توکن دسترسی (`token`) که از `/auth/otp/verify` برمی‌گردد را در `AuthContext` در حافظه نگه دار و در هدر `Authorization: Bearer <token>` بفرست.

4. برای CSRF (فقط `refresh`/`logout`):
   - یک بار `GET /auth/csrf-token`
   - مقدار را در هدر `X-CSRF-Token` بفرست.

5. با انقضای access token (۴۰۱)، خودکار `POST /auth/refresh` را صدا بزن.
---

## ۷. توضیح تدابیر امنیتی (OWASP)

- **SQL Injection**: در تمام کوئری‌ها فقط از پارامترهای positional (`?`) استفاده شده؛ هیچ‌جا ورودی کاربر مستقیم داخل رشته‌ی SQL concat نمی‌شود.
- **OTP storage**: کد OTP به‌صورت SHA-256 در جدول `otp_codes` ذ0؛ TTL، محدودیت تلاش و cooldown ارسال مجدد دارد.
- **JWT**: access token کوتاه‌مدت (۱۵ دقیقه) + refresh token در کوکی `httpOnly` با چرخش (rotation).
- **CSRF**: الگوی Double-Submit Cookie روی مسیرهایی که به کوکی متکی‌اند (`csrf.js`).
- **Headers امنیتی**: `helmet` (CSP، X-Frame-Options، HSTS و ...).
- **CORS**: فقط origin مشخص‌شده در `.env` (`CORS_ORIGIN`) مجاز است.
- **HTTP Parameter Pollution**: `hpp`.
- **Rate limiting**: global + سخت‌گیرانه روی `/auth/*` (جلوگیری از brute-force OTP).
- **Input validation**: هر endpoint یک zod schema دارد؛ فیلدهای غیرمجاز حذف می‌شوند (جلوگیری از mass-assignment).
- **عدم افشای خطای داخلی**: `errorHandler.js` فقط پیام‌های شناخته‌شده را برمی‌گرداند؛ خطاهای غیرمنتظره فقط در لاگ سرور ثبت می‌شوند، نه در پاسخ به کاربر.

---

## ۸. نکات و TODO برای توسعه‌ی بعدی

- `RouteService.planRoute` فعلاً یک placeholder است (دقیقاً مطابق رفتار فعلی فرانت که می‌گفت «به‌زودی فعال می‌شود»). برای مسیریابی واقعی باید به یک سرویس نقشه/مسیریابی (OSRM، نشان، بلد) وصل شود.
- `AdminService.getUsageReport` فعلاً داده‌ی خالی برمی‌گرداند؛ برای گزارش واقعی مصرف نیاز به یک جدول `charging_sessions` دارید که هنوز در فرانت هم منبع داده‌ی واقعی نداشت.
- برای پروداکشن پیشنهاد می‌شود:
  - `logger.js` را با `pino` جایگزین کنید (ماژول تنها با import عوض می‌شود، بقیه‌ی کد دست‌نخورده می‌ماند).
  - از یک reverse proxy (nginx) با HTTPS جلوی سرور استفاده کنید.
  - migration ها را در CI/CD قبل از deploy اجرا کنید.

---

## ۹. ساختار فایل کامل (مرجع سریع)

```
voltmap-backend/
├── index.js                          نقطه‌ی ورود
├── package.json
├── .env.example
├── scripts/seed.js                   دیتای اولیه
├── tests/app.test.js                 تست نمونه
└── src/
    ├── config/index.js
    ├── domain/{entities,errors}/
    ├── application/
    │   ├── ports/{repositories,services}/   ← Interface ها
    │   └── services/                        ← منطق کسب‌وکار
    ├── adapters/
    │   ├── http/{routes,controllers,middlewares,validators}/
    │   └── persistence/{mysql,security}/
    └── infrastructure/
        ├── database/{pool.js,migrate.js,migrations/}
        ├── container.js              ← Composition Root (DI)
        ├── logger.js
        └── server.js                 ← bootstrap + graceful shutdown
```

موفق باشی! هر بخشی که نیاز به توضیح بیشتر داشت یا خواستی تغییرش بدیم (مثلاً افزودن یک endpoint جدید یا اتصال مرحله‌به‌مرحله به یک صفحه‌ی خاص فرانت)، بگو تا با هم پیش بریم.

# Voltmap Backend

## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

- [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
- [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.com/h.ezati/voltmap-backend.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

- [Set up project integrations](https://gitlab.com/h.ezati/voltmap-backend/-/settings/integrations)

## Collaborate with your team

- [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
- [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
- [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
- [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
- [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

- [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
- [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
- [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
- [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
- [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

---

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name

Choose a self-explaining name for your project.

## Description

Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges

On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals

Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation

Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage

Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support

Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap

If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing

State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment

Show your appreciation to those who have contributed to the project.

## License

For open source projects, say how it is licensed.

## Project status

If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.
