# Telegram Translation Bot — সম্পূর্ণ ডিপ্লয় গাইড (বাংলা)

---

## ধাপ ১: Telegram Bot Token নিন

১. Telegram-এ **@BotFather** খুঁজুন।
২. `/newbot` কমান্ড দিন।
৩. বটের নাম দিন (যেমন: `আমার ট্রান্সলেটর বট`)
৪. Username দিন, শেষে `bot` থাকতে হবে (যেমন: `myTranslatorBot`)
৫. BotFather একটা **Token** দেবে — এটা সংরক্ষণ করুন।
   উদাহরণ: `7123456789:AAF-abc123def456ghi789`

---

## ধাপ ২: Render-এ ডিপ্লয় করুন

### ২.১ — Render অ্যাকাউন্ট খুলুন

১. [render.com](https://render.com) এ যান।
২. **GitHub** দিয়ে Sign Up করুন (বিনামূল্যে)।

---

### ২.২ — GitHub-এ কোড আপলোড করুন

১. [github.com](https://github.com) এ যান → **New Repository** তৈরি করুন।
   - নাম দিন: `telegram-translation-bot`
   - **Private** রাখুন (নিরাপদ)
   - **Create Repository** চাপুন

২. ZIP ফাইলটা extract করুন আপনার কম্পিউটারে।

৩. Terminal/Command Prompt খুলুন সেই ফোল্ডারে:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/আপনার-username/telegram-translation-bot.git
git push -u origin main
```

---

### ২.৩ — PostgreSQL Database তৈরি করুন (Render)

১. Render Dashboard → **New** → **PostgreSQL**
২. নিচের তথ্য দিন:
   - **Name**: `telegram-bot-db`
   - **Region**: Singapore (Asia-এর কাছাকাছি)
   - **Plan**: Free
৩. **Create Database** চাপুন।
৪. তৈরি হওয়ার পর **Internal Database URL** কপি করুন।
   উদাহরণ: `postgresql://user:password@dpg-xxxxx/telegram_bot_db`

---

### ২.৪ — API Server ডিপ্লয় করুন (Web Service)

১. Render Dashboard → **New** → **Web Service**
২. GitHub repo কানেক্ট করুন।
৩. নিচের সেটিংস দিন:

| সেটিং | মান |
|-------|-----|
| **Name** | `telegram-bot-api` |
| **Region** | Singapore |
| **Branch** | `main` |
| **Runtime** | Node |
| **Build Command** | নিচে দেখুন ↓ |
| **Start Command** | `node artifacts/api-server/dist/index.mjs` |
| **Plan** | Free |

**Build Command (হুবহু কপি করুন):**
```
corepack enable pnpm && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build
```

> ⚠️ আগের গাইডে `npm install -g pnpm` ছিল — এটা Render-এ কাজ করে না।
> সঠিক কমান্ড হলো `corepack enable pnpm`।

৪. **Environment Variables** যোগ করুন (Add Environment Variable):

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Step ২.৩ এ পাওয়া Internal Database URL) |
| `SESSION_SECRET` | (যেকোনো লম্বা random string, যেমন: `mySecretKey123456789xyz`) |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

৫. **Create Web Service** চাপুন।
৬. Deploy হতে ৫-১০ মিনিট লাগবে।
৭. Deploy শেষে URL পাবেন: `https://telegram-bot-api.onrender.com`

---

### ২.৫ — Admin Dashboard ডিপ্লয় করুন (Static Site)

১. Render Dashboard → **New** → **Static Site**
২. Same GitHub repo সিলেক্ট করুন।
৩. নিচের সেটিংস দিন:

| সেটিং | মান |
|-------|-----|
| **Name** | `telegram-bot-admin` |
| **Branch** | `main` |
| **Build Command** | নিচে দেখুন ↓ |
| **Publish Directory** | `artifacts/admin-dashboard/dist/public` |

**Build Command (হুবহু কপি করুন):**
```
corepack enable pnpm && pnpm install --no-frozen-lockfile && pnpm --filter @workspace/admin-dashboard run build
```

৪. **Create Static Site** চাপুন।
৫. Deploy শেষে Admin URL পাবেন: `https://telegram-bot-admin.onrender.com`

---

## ধাপ ৩: Admin Panel-এ লগিন করুন

১. ব্রাউজারে যান: `https://telegram-bot-admin.onrender.com`
২. লগিন করুন:
   - **Username**: `admin`
   - **Password**: `admin123`
৩. **প্রথম কাজ**: Admins পেজে যান → Password পরিবর্তন করুন!

---

## ধাপ ৪: Bot Token সেট করুন

১. Admin Panel → **Settings** পেজে যান।
২. **Bot Token** ফিল্ডে Step ১-এ পাওয়া Token পেস্ট করুন।
৩. **Save** করুন।
৪. কয়েক সেকেন্ড পর বট চালু হয়ে যাবে।

---

## ধাপ ৫: Telegram Webhook সেট করুন

বটকে সক্রিয় রাখতে webhook দরকার। ব্রাউজারে এই URL খুলুন:

```
https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=https://telegram-bot-api.onrender.com/api/bot/webhook
```

`<YOUR_TOKEN>` জায়গায় আপনার আসল token বসান। উদাহরণ:
```
https://api.telegram.org/bot7123456789:AAF-abc123/setWebhook?url=https://telegram-bot-api.onrender.com/api/bot/webhook
```

Response আসবে:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

---

## ধাপ ৬: বট টেস্ট করুন

১. Telegram-এ আপনার বট খুঁজুন (username দিয়ে)।
২. `/start` দিন।
৩. বাংলায় কিছু লিখুন → ইংরেজিতে অনুবাদ আসবে।
৪. ইংরেজিতে কিছু লিখুন → বাংলায় অনুবাদ আসবে।

---

## সমস্যা হলে কী করবেন?

### ❌ Build failed — EROFS বা read-only filesystem error
**সমাধান**: Build Command-এ `npm install -g pnpm` নেই তো? থাকলে সরিয়ে `corepack enable pnpm` দিন।

### ❌ বট কাজ করছে না
- Render Dashboard → API Service → **Logs** দেখুন।
- `DATABASE_URL` সঠিকভাবে দেওয়া আছে কিনা চেক করুন।
- Bot Token Settings পেজে সেট করা আছে কিনা দেখুন।

### ❌ Admin Panel খুলছে না
- Static Site deploy হয়েছে কিনা Render Dashboard-এ চেক করুন।
- **Publish Directory** ঠিক আছে কিনা দেখুন: `artifacts/admin-dashboard/dist/public`

### ❌ "Translation failed" দেখাচ্ছে
- সার্ভার ঘুমিয়ে গেলে (Free plan) প্রথম request-এ ৩০ সেকেন্ড লাগে — স্বাভাবিক।

---

## Render Free Plan — সার্ভার ঘুমিয়ে না পড়ার উপায়

Render Free plan-এ সার্ভার ১৫ মিনিট idle থাকলে ঘুমিয়ে পড়ে। সমাধান:

১. [cron-job.org](https://cron-job.org) এ বিনামূল্যে অ্যাকাউন্ট করুন।
২. নতুন Cronjob তৈরি করুন:
   - **URL**: `https://telegram-bot-api.onrender.com/api/healthz`
   - **Schedule**: প্রতি ১৪ মিনিট
৩. Save করুন — সার্ভার আর ঘুমাবে না।

---

## লগিন তথ্য মনে রাখুন

| তথ্য | মান |
|------|-----|
| Admin URL | `https://telegram-bot-admin.onrender.com` |
| API URL | `https://telegram-bot-api.onrender.com` |
| Default Username | `admin` |
| Default Password | `admin123` (অবশ্যই পরিবর্তন করুন!) |

---

*এই গাইড অনুসরণ করলে আপনার বট সম্পূর্ণ বিনামূল্যে Render-এ চলবে।*
