# المكوّنات المشتركة — عقار Match

> مرجع للمكوّنات التي تتكرر عبر صفحات المنصة (رأس، تذييل، أزرار، قوائم، بطاقات).

---

## 1. الرأس (Header)

> ثابت وغير متحرك (sticky/fixed) في كل الصفحات.

```tsx
<header className="sticky top-0 z-50 bg-navy text-white">
  <div className="container mx-auto flex items-center justify-between py-4">
    {/* الشعار */}
    <div className="flex items-center gap-2 text-2xl font-bold">
      <span className="text-white">عقار</span>
      <span className="text-gold">Match</span>
    </div>

    {/* روابط التنقل - 5 مستطيلات */}
    <nav className="hidden md:flex items-center gap-1">
      <NavLink href="/">الرئيسية</NavLink>
      <NavLink href="/publish">أنشر عقارا</NavLink>
      <NavLink href="/search">أبحث عن عقار</NavLink>
      <NavLink href="/account">حسابي</NavLink>
      <NavLink href="/dashboard">لوحة البيانات</NavLink>
    </nav>

    {/* مبدّل اللغة + قائمة الجوال */}
    <div className="flex items-center gap-3">
      <LanguageToggle />
      <MobileMenuButton />
    </div>
  </div>
</header>
```

### خصائص الـ NavLink
- خلفية شفافة افتراضيًا، خلفية ذهبية شبه شفافة عند الـ hover.
- نشط (active): خلفية ذهبية صلبة مع نص أزرق بحري.

### قائمة الجوال (Mobile Menu)
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="md:hidden text-white">
      <MenuIcon />
    </Button>
  </SheetTrigger>
  <SheetContent side="right" className="bg-navy text-white">
    <nav className="flex flex-col gap-4 mt-8">
      <NavLink href="/" mobile>الرئيسية</NavLink>
      <NavLink href="/publish" mobile>أنشر عقارا</NavLink>
      <NavLink href="/search" mobile>أبحث عن عقار</NavLink>
      <NavLink href="/account" mobile>حسابي</NavLink>
      <NavLink href="/dashboard" mobile>لوحة البيانات</NavLink>
    </nav>
  </SheetContent>
</Sheet>
```

---

## 2. التذييل (Footer)

```tsx
<footer className="bg-navy text-white py-6 mt-auto">
  <div className="container mx-auto text-center">
    <p className="text-sm">عقار Match 2026 – المنصة الذكية للعقارات في الجزائر</p>
    {/* روابط إضافية اختيارية: الشروط، سياسة الخصوصية، اتصل بنا */}
  </div>
</footer>
```

---

## 3. الأزرار (Buttons)

### الزر الذهبي الأساسي
```tsx
<Button variant="gold" size="lg" disabled={!isValid}>
  التالي
</Button>
```

```tsx
// variant="gold"
"bg-gold text-navy font-bold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
```

### الزر الرمادي الثانوي
```tsx
<Button variant="gray">تعديل البحث</Button>
// "bg-gray-200 text-gray-800 hover:bg-gray-300"
```

### الزر النصي (Text)
```tsx
<Button variant="text">إلغاء</Button>
// "text-navy underline hover:text-gold"
```

### قاعدة الـ disabled الإلزامية
> زر "التالي"/"بدء المطابقة"/"نشر عقارك" لا يُفعّل إذا لم تُملأ الخانات الإلزامية. يجب أن يكون الزر باهتًا (غير قابل للنقر) حتى يتم الاختيار.

```tsx
const isFormValid = useMemo(() => {
  return requiredFields.every(field => field.value !== '');
}, [requiredFields]);

<Button variant="gold" disabled={!isFormValid} onClick={handleNext}>
  التالي
</Button>
```

---

## 4. القوائم المنسدلة (Dropdowns)

### القائمة المنسدلة العادية
```tsx
<Select>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="إختر الولاية" />
  </SelectTrigger>
  <SelectContent>
    {wilayas.map(w => <SelectItem key={w.code} value={w.code}>{w.nameAr}</SelectItem>)}
  </SelectContent>
</Select>
```

### القائمة المنسدلة Cascade (تتطلب اختيار سابق)
```tsx
function CommuneSelect({ selectedWilaya, communes }) {
  if (!selectedWilaya) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="إختر الولاية أولا" />
        </SelectTrigger>
      </Select>
    );
  }
  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="إختر البلدية" />
      </SelectTrigger>
      <SelectContent>
        {communes.map(c => <SelectItem key={c.code} value={c.code}>{c.nameAr}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
```

---

## 5. شريط المراحل (Stepper)

```tsx
<Stepper currentStep={2} totalSteps={5} steps={[
  "نوع العقار",
  "الموقع",
  "التسعير",
  "معلوماتك",
  "الصور"
]} />
```

### البنية البصرية
- أرقام في دوائر (1, 2, 3, 4, 5).
- المرحلة الحالية: دائرة ذهبية، الرقم بالأزرق البحري.
- المراحل المكتملة: دائرة أزرق بحري، الرقم بالذهبي + علامة صح.
- المراحل القادمة: دائرة رمادية، الرقم رمادي.
- أسهم بين الدوائر.

```tsx
<div className="flex items-center justify-between w-full">
  {steps.map((step, idx) => (
    <Fragment key={idx}>
      <div className={cn(
        "flex flex-col items-center gap-2",
        idx + 1 === currentStep && "text-gold font-bold",
        idx + 1 < currentStep && "text-navy",
        idx + 1 > currentStep && "text-gray-400"
      )}>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          idx + 1 === currentStep && "bg-gold text-navy",
          idx + 1 < currentStep && "bg-navy text-gold",
          idx + 1 > currentStep && "bg-gray-200"
        )}>
          {idx + 1 < currentStep ? <CheckIcon /> : idx + 1}
        </div>
        <span className="text-xs hidden md:block">{step}</span>
      </div>
      {idx < steps.length - 1 && (
        <div className="flex-1 h-0.5 bg-gray-200 mx-2">
          {idx + 1 < currentStep && <div className="h-full bg-gold" />}
        </div>
      )}
    </Fragment>
  ))}
</div>
```

---

## 6. بطاقة العقار المطابق

```tsx
<MatchedPropertyCard property={{
  type: "شقة",
  location: "ولاية أدرار، بلدية: أدرار",
  matchScore: 80,
  areaRange: "100–120 م²",
  legalStatus: "عقد توثيقي",
  rooms: 5,
  bathrooms: 1,
}} />
```

### البنية
```tsx
<div className="bg-white/50 backdrop-blur rounded-xl p-6 border border-gold/20">
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="font-bold text-lg text-navy">{property.type}</h3>
      <p className="text-sm text-gray-600">{property.location}</p>
    </div>
    <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
      <span className="text-green-500">🟢</span>
      <span className="text-sm font-bold text-green-700">مطابقة قوية</span>
      <span className="text-sm font-bold text-green-700">{property.matchScore}%</span>
    </div>
  </div>
  <div className="grid grid-cols-2 gap-4 text-sm">
    <div><span className="text-gray-500">المساحة:</span> {property.areaRange}</div>
    <div><span className="text-gray-500">الوضعية:</span> {property.legalStatus}</div>
    <div><span className="text-gray-500">غرف:</span> {property.rooms}</div>
    <div><span className="text-gray-500">حمامات:</span> {property.bathrooms}</div>
  </div>
</div>
```

---

## 7. التنبيهات (Alerts)

### تنبيه أمني (🔒)
```tsx
<Alert variant="secure">
  🔒 هذا الرقم سري ومشفّر بالكامل — لن يظهر لأي مشترٍ أو طرف ثالث.
</Alert>
```

### تنبيه تقييد (خلفية صفراء)
```tsx
<Alert variant="warning">
  الحد الأقصى 3 محاولات بحث لنفس المعايير خلال 24 ساعة. يُطبَّق هذا التقييد لحماية أسعار البائعين السرية من الاستخراج.
</Alert>
```

### تنبيه نصيحة (💰)
```tsx
<Alert variant="tip">
  💰 نصيحة: الميزانيات الواقعية تحصل على تطابقات أسرع.
</Alert>
```

---

## 8. ملخص البحث (Search Summary)

```tsx
<div className="bg-gray-100 rounded-lg p-4 space-y-2">
  <h4 className="font-bold text-navy mb-2">ملخص البحث</h4>
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">المعاملة:</span>
    <span className="font-medium">بيع</span>
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">النوع:</span>
    <span className="font-medium">شقة</span>
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">الموقع:</span>
    <span className="font-medium">الشلف، الشلف</span>
  </div>
  <div className="flex justify-between text-sm">
    <span className="text-gray-600">الميزانية:</span>
    <span className="font-medium">9.000.000 دج</span>
  </div>
</div>
```

---

## 9. قائمة فحص المكوّنات المشتركة

- [ ] الرأس sticky بخلفية أزرق بحري.
- [ ] الشعار: "عقار" أبيض + "Match" ذهبي.
- [ ] 5 روابط تنقل في Desktop.
- [ ] قائمة جوال (Sheet) في الشاشات الصغيرة.
- [ ] مبدّل اللغة AR/FR.
- [ ] التذييل بنص 2026.
- [ ] زر ذهبي مع disabled عند عدم صحة النموذج.
- [ ] زر رمادي ثانوي.
- [ ] زر نصي للإلغاء.
- [ ] القوائم المنسدلة cascade (ولاية → بلدية).
- [ ] شريط مراحل بأرقام وأسهم.
- [ ] بطاقة العقار المطابق بنسبة المطابقة ومؤشر أخضر.
- [ ] تنبيهات بأنواعها (أمني، تقييد، نصيحة).
- [ ] ملخص البحث الرمادي.
