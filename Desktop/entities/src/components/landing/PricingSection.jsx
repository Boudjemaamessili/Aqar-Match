import React from "react";
import { Check, X } from "lucide-react";
import { LISTING_FEES, PROPERTY_TYPES, formatPrice } from "@/lib/algeriaData";

export default function PricingSection() {
  return (
    <section className="py-24 bg-muted/30" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            رسوم شفافة. <span className="text-secondary">صفر عمولة.</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            رسم نشر ثابت فقط — لا نأخذ أي نسبة من صفقتك
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-3 bg-primary text-primary-foreground p-4 font-heading font-semibold text-center">
              <span>نوع العقار</span>
              <span>رسم النشر</span>
              <span>عمولة على البيع</span>
            </div>
            {Object.entries(LISTING_FEES).map(([key, fee], i) => (
              <div key={key} className={`grid grid-cols-3 p-4 text-center items-center ${i % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}>
                <span className="font-body font-medium text-foreground">{PROPERTY_TYPES[key]}</span>
                <span className="font-heading font-bold text-secondary">{formatPrice(fee)}</span>
                <span className="inline-flex items-center justify-center gap-1 text-green-600">
                  <X className="w-4 h-4" />
                  <span className="text-sm font-body">0%</span>
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {[
              "دفع آمن عبر CIB / Edahabia",
              "فاتورة إلكترونية فورية",
              "ضمان استرداد خلال 48 ساعة"
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-sm text-muted-foreground font-body">
                <Check className="w-4 h-4 text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}