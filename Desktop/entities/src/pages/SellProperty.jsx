import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PropertyTypeSelector from "@/components/sell/PropertyTypeSelector";
import DynamicPropertyFields from "@/components/sell/DynamicPropertyFields";
import LocationSelector from "@/components/sell/LocationSelector";
import PricingInputs from "@/components/sell/PricingInputs";
import { TRANSACTION_TYPES, LEGAL_STATUSES, getListingFee, formatPrice } from "@/lib/algeriaData";

export default function SellProperty() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    transaction_type: "",
    property_type: "",
    wilaya: "",
    commune: "",
    title: "",
    description: "",
    target_price: "",
    secret_min_price: "",
    legal_status: "",
    seller_name: "",
    seller_phone: "",
    seller_type: "individual",
    details: {}
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const fee = form.property_type ? getListingFee(form.property_type) : 0;

  const canProceed = () => {
    if (step === 1) return form.transaction_type && form.property_type;
    if (step === 2) return form.wilaya && form.commune;
    if (step === 3) return form.target_price && form.secret_min_price && Number(form.secret_min_price) <= Number(form.target_price);
    if (step === 4) return form.seller_name && form.seller_phone;
    return false;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await base44.entities.Property.create({
        ...form,
        target_price: Number(form.target_price),
        secret_min_price: Number(form.secret_min_price),
        area: form.details.area ? Number(form.details.area) : undefined,
        listing_fee: fee,
        status: "active",
        match_count: 0
      });
      toast({ title: "تم نشر عرضك بنجاح! ✅", description: "ستتلقى إشعاراً عند وجود مشتري مطابق." });
      navigate("/sell-success");
    } catch (e) {
      toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: "نوع العقار" },
    { num: 2, label: "الموقع" },
    { num: 3, label: "التسعير" },
    { num: 4, label: "معلوماتك" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-6 max-w-3xl">
        <div className="mb-8 space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 font-body">
            <ArrowRight className="w-4 h-4" /> العودة للرئيسية
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">نشر عقار جديد</h1>
          <p className="text-muted-foreground font-body">أدخل تفاصيل عقارك وسنجد لك المشتري المناسب</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 mb-10">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-heading font-medium transition-colors ${
                step === s.num ? "bg-secondary text-secondary-foreground" : step > s.num ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <CheckCircle className="w-4 h-4" /> : <span>{s.num}</span>}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className="flex-1 h-px bg-border" />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
          {/* Step 1: Property Type */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">نوع المعاملة *</Label>
                <div className="flex gap-3">
                  {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update("transaction_type", key)}
                      className={`flex-1 py-3 rounded-xl border-2 font-heading font-medium transition-all ${
                        form.transaction_type === key
                          ? "border-secondary bg-secondary/10"
                          : "border-border hover:border-secondary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">نوع العقار *</Label>
                <PropertyTypeSelector value={form.property_type} onChange={(v) => update("property_type", v)} />
              </div>
            </div>
          )}

          {/* Step 2: Location & Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">الموقع</Label>
                <LocationSelector
                  wilaya={form.wilaya}
                  commune={form.commune}
                  onWilayaChange={(v) => update("wilaya", v)}
                  onCommuneChange={(v) => update("commune", v)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">تفاصيل العقار</Label>
                <DynamicPropertyFields
                  propertyType={form.property_type}
                  details={form.details}
                  onChange={(v) => update("details", v)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-heading text-sm">الوضعية القانونية</Label>
                <Select value={form.legal_status} onValueChange={(v) => update("legal_status", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر الوضعية" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEGAL_STATUSES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-heading text-sm">عنوان العرض</Label>
                <Input
                  placeholder="مثال: شقة F3 في وسط المدينة"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-heading text-sm">وصف إضافي</Label>
                <Textarea
                  placeholder="أضف وصفاً تفصيلياً لعقارك..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 3: Pricing */}
          {step === 3 && (
            <div className="space-y-6">
              <PricingInputs
                targetPrice={form.target_price}
                secretMinPrice={form.secret_min_price}
                onTargetChange={(v) => update("target_price", v)}
                onSecretChange={(v) => update("secret_min_price", v)}
                transactionType={form.transaction_type}
              />

              {fee > 0 && (
                <div className="p-4 bg-secondary/10 rounded-xl border border-secondary/20 space-y-1">
                  <p className="text-sm font-heading font-semibold text-foreground">رسوم النشر</p>
                  <p className="text-2xl font-display font-bold text-secondary">{formatPrice(fee)}</p>
                  <p className="text-xs text-muted-foreground font-body">رسم ثابت لمرة واحدة — بدون أي عمولة على البيع</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Seller Info */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">نوع الحساب</Label>
                <div className="flex gap-3">
                  {[["individual", "فرد"], ["agency", "وكالة عقارية"]].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update("seller_type", key)}
                      className={`flex-1 py-3 rounded-xl border-2 font-heading font-medium transition-all ${
                        form.seller_type === key
                          ? "border-secondary bg-secondary/10"
                          : "border-border hover:border-secondary/40"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-heading text-sm">الاسم الكامل *</Label>
                <Input
                  placeholder="الاسم واللقب"
                  value={form.seller_name}
                  onChange={(e) => update("seller_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-heading text-sm">رقم الهاتف (واتساب) *</Label>
                <Input
                  type="tel"
                  placeholder="مثال: 0555123456"
                  value={form.seller_phone}
                  onChange={(e) => update("seller_phone", e.target.value)}
                  className="text-left"
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground font-body">
                  سيتم التواصل معك عبر واتساب عند وجود مشتري مطابق
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t border-border">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="font-heading">
                <ArrowRight className="w-4 h-4 ml-1" /> السابق
              </Button>
            ) : <div />}

            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading"
              >
                التالي
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
                className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                نشر العرض — {formatPrice(fee)}
              </Button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}