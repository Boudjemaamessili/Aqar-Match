 # عقار Match — الكود المصدري الكامل

أرشيف الكود المصدري لمنصة "عقار Match" — أول منصة عقارية للمطابقة الذكية في الجزائر.

## محتويات الأرشيف

```
aqar-match-source/
├── src/                                  # كود تطبيق Next.js 16
│   ├── app/
│   │   ├── layout.tsx                    # RTL + خط Cairo + LanguageProvider
│   │   ├── page.tsx                      # التوجيه بين الصفحات + AuthProvider
│   │   └── globals.css                   # الألوان (Navy + Gold) + Tailwind
│   ├── components/
│   │   ├── ui/                           # مكوّنات shadcn/ui
│   │   └── platform/                     # مكوّنات منصة عقار Match
│   │       ├── LanguageContext.tsx       # قاموس AR/FR + RTL/LTR (~250 مفتاح)
│   │       ├── AuthContext.tsx           # مصادقة (mock + خطة Supabase) + 2FA
│   │       ├── LoginPage.tsx             # صفحة الدخول بـ 4 مراحل
│   │       ├── OTPInput.tsx              # OTP 6 خانات + CountdownTimer
│   │       ├── Header.tsx                # رأس sticky + 5 روابط + قائمة جوال
│   │       ├── Footer.tsx                # تذييل 2026
│   │       ├── HomePage.tsx              # الصفحة الرئيسية (Hero + نقاط ألم + خطوات)
│   │       ├── PublishFlow.tsx           # مسار النشر (5 مراحل)
│   │       ├── SearchFlow.tsx            # مسار البحث (5 مراحل + المطابقة)
│   │       ├── AccountDashboard.tsx      # الحساب ولوحة البيانات (قبل/بعد الدخول)
│   │       ├── Stepper.tsx               # شريط المراحل
│   │       ├── Alert.tsx                 # تنبيهات (secure/warning/tip/info)
│   │       ├── PlatformButton.tsx        # زر موحد (gold/gray/text/navy)
│   │       └── data.ts                   # 58 ولاية + جدول الرسوم
│   └── lib/                              # أدوات مساعدة
│
├── prisma/                               # مخطط قاعدة البيانات
├── public/                               # ملفات ثابتة
│
├── aqar-match-platform/                  # skill المواصفات الكاملة
│   ├── SKILL.md                          # الموجز + القواعد الذهبية
│   ├── references/                       # 8 ملفات مرجعية تفصيلية
│   │   ├── home-page.md
│   │   ├── publish-flow.md
│   │   ├── search-flow.md
│   │   ├── fee-system.md
│   │   ├── terms-of-service.md
│   │   ├── ux-principles.md
│   │   ├── design-system.md
│   │   └── shared-components.md
│   └── evals/evals.json                  # حالات اختبار
│
├── screenshots/                          # لقطات شاشة من الواجهة
│   ├── home-page-screenshot.png
│   ├── no-match-result.png
│   ├── dashboard-page.png
│   ├── login-page-entry.png
│   ├── login-page-2fa.png
│   ├── dashboard-owner.png
│   └── seeker-redirect.png
│
├── package.json                          # تبعيات المشروع
├── next.config.ts                        # إعدادات Next.js
├── tsconfig.json                         # إعدادات TypeScript
├── tailwind.config.ts                    # إعدادات Tailwind
├── eslint.config.mjs                     # إعدادات ESLint
└── README.md                             # هذا الملف
```

## التقنيات المستخدمة

- **Framework**: Next.js 16 (App Router) + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui (New York style)
- **Font**: Cairo (للعربية) + Geist Mono (للأرقام)
- **Icons**: Lucide React
- **Auth**: طبقة mock جاهزة للاستبدال بـ Supabase Auth + Google OAuth
- **Package Manager**: Bun (موصى به) أو npm/yarn

## التشغيل محليًا

```bash
# 1. تثبيت التبعيات
bun install     # أو: npm install

# 2. تشغيل سيرفر التطوير
bun run dev     # أو: npm run dev

# 3. افتح المتصفح على
http://localhost:3000
```

## الصفحات المتاحة

| الصفحة | الوصف |
|--------|-------|
| الرئيسية | Hero + نقاط الألم الثلاث + 4 خطوات + إحصائيات + آراء |
| أنشر عقارا | 5 مراحل: نوع/موقع/تسعير/معلومات/صور |
| أبحث عن عقار | 5 مراحل + 4 حالات نتيجة (لا تطابق/تطابق/مدفوع/ملغى) |
| حسابي | قبل الدخول: دعوة لتسجيل الدخول. بعد الدخول: ملف شخصي + إجراءات |
| لوحة البيانات | قبل الدخول: دعوة. بعد الدخول: إحصائيات حسب الدور |
| تسجيل الدخول | 4 مراحل: Entry → Auth → 2FA → Smart Redirect |

## صفحة الدخول (Login Page)

### المراحل الأربع

1. **Entry Point**: شعار + زر Google بارز + بريد/كلمة مرور + تذكّرني
2. **Authentication**: تحقق عبر mock layer (يستبدل بـ Supabase في الإنتاج)
3. **2FA (إلزامية)**: OTP 6 خانات + عداد 5 دقائق + إعادة إرسال + "تذكّر الجهاز"
4. **Smart Redirect**: المالك → لوحة البيانات، الباحث → واجهة البحث

### حسابات تجريبية (mock auth)

| الدور | البريد | كلمة المرور | التوجيه بعد الدخول |
|------|--------|-------------|---------------------|
| مالك عقار | `owner@aqar.match` | `demo1234` | لوحة البيانات |
| باحث عقار | `seeker@aqar.match` | `demo1234` | واجهة البحث |

> الرمز التجريبي للـ 2FA يظهر في Console المتصفح (F12) بعد الإرسال.

### الترحيل إلى Supabase (للإنتاج)

ملف `AuthContext.tsx` يحتوي على خطة ترحيل كاملة موثّقة في رأس الملف:

1. `npm install @supabase/supabase-js`
2. أنشئ client: `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
3. `signInWithEmail` → `supabase.auth.signInWithPassword({...})`
4. `signInWithGoogle` → `supabase.auth.signInWithOAuth({ provider: 'google' })`
5. `sendOTP` → Edge Function 'send-otp' تولّد رمز 6 أرقام
6. `verifyOTP` → Edge Function 'verify-otp' تطابق الرمز
7. جدول `otp_verification`: `{ id, user_id, code_hash, expires_at, used }`
8. `trusted_device` token: JWT مشفّر في localStorage بصلاحية 30 يومًا

## المميزات المنفّذة

### الواجهة الأساسية
- ✅ دعم اللغتين العربية (RTL) والفرنسية (LTR) مع عكس التخطيط
- ✅ خط Cairo العربي + ألوان الهوية (Navy #0A2540 + Gold #D4AF37)
- ✅ قاعدة "زر التالي معطّل حتى تُملأ الإلزامية"
- ✅ قوائم cascade (الولاية → البلدية) لـ 58 ولاية
- ✅ جدول الرسوم بالشرائح يُحسب تلقائيًا
- ✅ تنبيهات أمنية 🔒 بعد الحقول السرية
- ✅ تصميم Mobile-First متجاوب
- ✅ وحدة المساحة: م² لكل العقارات + هكتار للأرض الفلاحية فقط

### المصادقة والأمان
- ✅ صفحة دخول بـ 4 مراحل كاملة
- ✅ زر Google OAuth بارز في الأعلى
- ✅ 2FA إلزامي (OTP 6 خانات)
- ✅ عداد تنازلي 5 دقائق لصلاحية الرمز
- ✅ إعادة إرسال الرمز بعد 60 ثانية
- ✅ ميزة "تذكّر هذا الجهاز" (30 يومًا)
- ✅ توجيه ذكي حسب الدور (owner/seeker)
- ✅ صفحة حساب ديناميكية (قبل/بعد الدخول)

## المواصفات الأصلية

كل تفاصيل التصميم والمنطق موثّقة في مجلد `aqar-match-platform/` (skill كاملة بـ 8 ملفات مرجعية). راجع `SKILL.md` أولًا للحصول على خريطة شاملة.

## ملاحظات

- هذا الإصدار يستخدم **mock auth layer** (بدون Supabase فعلي).
- منطق المطابقة في `SearchFlow.tsx` تجريبي (50% فرصة تطابق).
- لتفعيل المصادقة الحقيقية، اتبع خطة Supabase Auth + 2FA في `AuthContext.tsx`.

## الترخيص

هذا الكود ملك لمنصة عقار Match. استخدمه وفق الترخيص المتفق عليه مع المالك.

---

**عقار Match 2026 – المنصة الذكية للعقارات في الجزائر**
