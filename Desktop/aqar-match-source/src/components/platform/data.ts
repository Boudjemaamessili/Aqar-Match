"use client";

// قائمة الولايات الجزائرية الـ 58
export const WILAYAS = [
  "أدرار",
  "الشلف",
  "الأغواط",
  "أم البواقي",
  "باتنة",
  "بجاية",
  "بسكرة",
  "بشار",
  "البليدة",
  "البويرة",
  "تمنراست",
  "تبسة",
  "تلمسان",
  "تيارت",
  "تيزي وزو",
  "الجزائر",
  "الجلفة",
  "جيجل",
  "سطيف",
  "سعيدة",
  "سكيكدة",
  "سيدي بلعباس",
  "عنابة",
  "قالمة",
  "قسنطينة",
  "المدية",
  "مستغانم",
  "المسيلة",
  "معسكر",
  "ورقلة",
  "وهران",
  "البيض",
  "إليزي",
  "برج بوعريريج",
  "بومرداس",
  "الطارف",
  "تندوف",
  "تيسمسيلت",
  "الوادي",
  "خنشلة",
  "سوق أهراس",
  "تيبازة",
  "ميلة",
  "عين الدفلى",
  "النعامة",
  "عين تموشنت",
  "غرداية",
  "غليزان",
  "تيميمون",
  "برج باجي مختار",
  "أولاد جلال",
  "بني عباس",
  "عين صالح",
  "عين قزام",
  "تقرت",
  "جانت",
  "المغير",
  "المنيعة",
];

// بلديات تجريبية لكل ولاية (في الإنتاج تكون من API)
export const COMMunes_BY_WILAYA: Record<string, string[]> = {
  أدرار: ["أدرار", "تامست", "شرويين", "رقان"],
  الشلف: ["الشلف", "تنس", "بوقادير", "أولاد فارس"],
  الجزائر: ["الجزائر الوسطى", "باب الوادي", "حسين داي", "بئر مراد رايس"],
  وهران: ["وهران", "بئر الجير", "السانية", "أرزيو"],
  قسنطينة: ["قسنطينة", "الخروب", "حامة بوزيان", "ديدوش مراد"],
  // ... باقي الولايات (تُكمل ديناميكيًا من API)
};

export function getCommunesForWilaya(wilaya: string): string[] {
  return COMMunes_BY_WILAYA[wilaya] ?? [`${wilaya} - بلدية 1`, `${wilaya} - بلدية 2`];
}

// أنواع العقارات
export const PROPERTY_TYPES = [
  { key: "apartment", icon: "🏢" },
  { key: "villa", icon: "🏡" },
  { key: "house", icon: "🏠" },
  { key: "shop", icon: "🏪" },
  { key: "buildable_land", icon: "📐" },
  { key: "farmland", icon: "🌾" },
] as const;

export type PropertyTypeKey = (typeof PROPERTY_TYPES)[number]["key"];

// الوضعية القانونية
export const LEGAL_STATUSES = [
  "legal_book",
  "legal_authenticated",
  "legal_registered",
  "legal_admin",
  "legal_private",
  "legal_none",
] as const;

// خيارات العدادات
export const ROOM_OPTIONS = ["1", "2", "3", "4", "5", "+6"];
export const BATHROOM_OPTIONS = ["1", "2", "3", "+4"];
export const FACADE_OPTIONS = ["1", "2", "3", "+4"];

// جدول الرسوم (شرائح البيع)
export const SALE_FEE_TIERS: Array<{
  min: number;
  max: number | null;
  fee: number;
}> = [
  { min: 0, max: 5_000_000, fee: 10_000 },
  { min: 5_000_000, max: 10_000_000, fee: 20_000 },
  { min: 10_000_000, max: 20_000_000, fee: 30_000 },
  { min: 20_000_000, max: 30_000_000, fee: 40_000 },
  { min: 30_000_000, max: 40_000_000, fee: 50_000 },
  { min: 40_000_000, max: 50_000_000, fee: 60_000 },
  { min: 50_000_000, max: 60_000_000, fee: 70_000 },
  { min: 60_000_000, max: 70_000_000, fee: 80_000 },
  { min: 70_000_000, max: 80_000_000, fee: 90_000 },
  { min: 80_000_000, max: 90_000_000, fee: 100_000 },
];

// حساب رسم البائع في حالة البيع
export function calcSaleFee(secretPrice: number): number {
  if (secretPrice <= 0) return 0;
  if (secretPrice < 90_000_000) {
    const tier = SALE_FEE_TIERS.find(
      (t) => secretPrice >= t.min && (t.max === null || secretPrice < t.max)
    );
    return tier?.fee ?? 100_000;
  }
  // فوق 90M: 100,000 + 5,000 لكل 10M أو جزء منها يفوق 90M
  const excess = secretPrice - 90_000_000;
  const additionalTiers = Math.ceil(excess / 10_000_000);
  return 100_000 + additionalTiers * 5_000;
}

// حساب رسم البائع في حالة الإيجار = نصف شهر
export function calcRentFee(monthlyRent: number): number {
  return Math.round(monthlyRent * 0.5);
}

// تنسيق الأرقام بالفاصل
export function formatDZD(amount: number): string {
  return new Intl.NumberFormat("fr-DZ").format(amount) + " دج";
}
