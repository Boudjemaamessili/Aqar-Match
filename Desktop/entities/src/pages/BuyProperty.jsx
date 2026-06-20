import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, CheckCircle, Loader2, PartyPopper, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import PropertyTypeSelector from "@/components/sell/PropertyTypeSelector";
import LocationSelector from "@/components/sell/LocationSelector";
import { TRANSACTION_TYPES, PROPERTY_TYPES, formatPrice } from "@/lib/algeriaData";

export default function BuyProperty() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [buyerInfo, setBuyerInfo] = useState({ name: "", phone: "" });
  const [savingMatch, setSavingMatch] = useState(false);
  const [form, setForm] = useState({
    transaction_type: "",
    property_type: "",
    wilaya: "",
    commune: "",
    max_budget: ""
  });

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const canProceed = () => {
    if (step === 1) return form.transaction_type;
    if (step === 2) return form.property_type;
    if (step === 3) return form.wilaya && form.commune;
    if (step === 4) return form.max_budget && Number(form.max_budget) > 0;
    return false;
  };

  const runMatch = async () => {
    setLoading(true);
    try {
      // Log the search query
      await base44.entities.SearchQuery.create({
        ...form,
        max_budget: Number(form.max_budget),
        matches_found: 0
      });

      // Find matching properties (exact criteria)
      const properties = await base44.entities.Property.filter({
        transaction_type: form.transaction_type,
        property_type: form.property_type,
        wilaya: form.wilaya,
        commune: form.commune,
        status: "active"
      });

      const budget = Number(form.max_budget);
      // Secret matching: budget >= secret_min_price
      const matches = properties.filter(p => budget >= p.secret_min_price);

      if (matches.length > 0) {
        // Pick best match (closest target price to budget)
        const best = matches.sort((a, b) =>
          Math.abs(a.target_price - budget) - Math.abs(b.target_price - budget)
        )[0];

        const score = Math.min(100, Math.round((budget / best.target_price) * 100));

        setMatchResult({
          found: true,
          property: best,
          score,
          totalMatches: matches.length
        });
      } else {
        // Check if there are properties in same location but different type or over budget
        const locationProps = await base44.entities.Property.filter({
          transaction_type: form.transaction_type,
          wilaya: form.wilaya,
          commune: form.commune,
          status: "active"
        });
        const sameTypeCount = properties.length;
        const otherTypeCount = locationProps.length - sameTypeCount;
        const overBudgetCount = properties.filter(p => budget < p.secret_min_price).length;

        setMatchResult({ 
          found: false, 
          hint: sameTypeCount > 0 && overBudgetCount > 0 
            ? "budget_low" 
            : otherTypeCount > 0 
              ? "wrong_type" 
              : "none"
        });
      }

      setStep(5);
    } catch (e) {
      toast({ title: "حدث خطأ", description: "يرجى المحاولة مرة أخرى", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmMatch = async () => {
    if (!buyerInfo.name || !buyerInfo.phone) {
      toast({ title: "يرجى إدخال بياناتك", variant: "destructive" });
      return;
    }
    setSavingMatch(true);
    try {
      await base44.entities.Match.create({
        property_id: matchResult.property.id,
        buyer_name: buyerInfo.name,
        buyer_phone: buyerInfo.phone,
        buyer_budget: Number(form.max_budget),
        compatibility_score: matchResult.score,
        status: "pending",
        seller_notified: false
      });

      // Update property match count
      await base44.entities.Property.update(matchResult.property.id, {
        match_count: (matchResult.property.match_count || 0) + 1
      });

      setStep(6);
      toast({ title: "تم تأكيد المطابقة! ✅" });
    } catch (e) {
      toast({ title: "حدث خطأ", variant: "destructive" });
    } finally {
      setSavingMatch(false);
    }
  };

  const steps = [
    { num: 1, label: "المعاملة" },
    { num: 2, label: "العقار" },
    { num: 3, label: "الموقع" },
    { num: 4, label: "الميزانية" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-6 max-w-3xl">
        <div className="mb-8 space-y-2">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 font-body">
            <ArrowRight className="w-4 h-4" /> العودة للرئيسية
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">البحث عن عقار</h1>
          <p className="text-muted-foreground font-body">حدد معاييرك الأربعة وميزانيتك — والباقي علينا</p>
        </div>

        {/* Steps - only show for steps 1-4 */}
        {step <= 4 && (
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
        )}

        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 space-y-8">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="font-heading font-semibold text-base">ماذا تريد؟ *</Label>
              <div className="flex gap-3">
                {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update("transaction_type", key)}
                    className={`flex-1 py-4 rounded-xl border-2 font-heading font-semibold text-lg transition-all ${
                      form.transaction_type === key
                        ? "border-secondary bg-secondary/10"
                        : "border-border hover:border-secondary/40"
                    }`}
                  >
                    {key === "sale" ? "🏠 شراء عقار" : "🔑 استئجار عقار"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <Label className="font-heading font-semibold text-base">أي نوع عقار تبحث عنه؟ *</Label>
              <PropertyTypeSelector value={form.property_type} onChange={(v) => update("property_type", v)} />
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <Label className="font-heading font-semibold text-base">أين تريد العقار؟ *</Label>
              <LocationSelector
                wilaya={form.wilaya}
                commune={form.commune}
                onWilayaChange={(v) => update("wilaya", v)}
                onCommuneChange={(v) => update("commune", v)}
              />
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-heading font-semibold text-base">
                  أقصى ميزانية يمكنك تحمّلها {form.transaction_type === "rent" ? "(شهرياً)" : ""} (دج) *
                </Label>
                <Input
                  type="number"
                  placeholder="مثال: 15000000"
                  value={form.max_budget}
                  onChange={(e) => update("max_budget", e.target.value)}
                  className="text-left text-xl font-mono h-14"
                  dir="ltr"
                />
                {form.max_budget && (
                  <p className="text-sm text-muted-foreground">{formatPrice(Number(form.max_budget))}</p>
                )}
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 space-y-3">
                <h4 className="font-heading font-semibold text-sm">ملخص البحث</h4>
                <div className="grid grid-cols-2 gap-2 text-sm font-body">
                  <span className="text-muted-foreground">المعاملة:</span>
                  <span className="font-medium">{TRANSACTION_TYPES[form.transaction_type]}</span>
                  <span className="text-muted-foreground">النوع:</span>
                  <span className="font-medium">{PROPERTY_TYPES[form.property_type]}</span>
                  <span className="text-muted-foreground">الموقع:</span>
                  <span className="font-medium">{form.commune}، {form.wilaya}</span>
                  {form.max_budget && Number(form.max_budget) > 0 && (
                    <>
                      <span className="text-muted-foreground">الميزانية القصوى:</span>
                      <span className="font-semibold text-secondary">{formatPrice(Number(form.max_budget))}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Match Result */}
          {step === 5 && matchResult && (
            <div className="text-center space-y-6">
              {matchResult.found ? (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                    <PartyPopper className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">تهانينا! تم العثور على تطابق 🎉</h2>
                    <p className="text-muted-foreground font-body">
                      ميزانيتك تتطابق مع {matchResult.totalMatches} عرض عقاري في {form.commune}، {form.wilaya}
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-xl p-6 space-y-4 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground font-body">درجة التوافق</span>
                      <span className="text-2xl font-display font-bold text-green-600">{matchResult.score}%</span>
                    </div>
                    <div className="w-full bg-border rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${matchResult.score}%` }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm font-body">
                      <div>
                        <span className="text-muted-foreground">نوع العقار</span>
                        <p className="font-medium">{PROPERTY_TYPES[matchResult.property.property_type]}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الموقع</span>
                        <p className="font-medium">{matchResult.property.commune}، {matchResult.property.wilaya}</p>
                      </div>
                      {matchResult.property.area && (
                        <div>
                          <span className="text-muted-foreground">المساحة</span>
                          <p className="font-medium">{matchResult.property.area} م²</p>
                        </div>
                      )}
                      {matchResult.property.title && (
                        <div>
                          <span className="text-muted-foreground">العنوان</span>
                          <p className="font-medium">{matchResult.property.title}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 text-right">
                    <h3 className="font-heading font-semibold">أدخل بياناتك لتأكيد المطابقة</h3>
                    <div className="space-y-3">
                      <Input
                        placeholder="الاسم الكامل"
                        value={buyerInfo.name}
                        onChange={(e) => setBuyerInfo(p => ({ ...p, name: e.target.value }))}
                      />
                      <Input
                        type="tel"
                        placeholder="رقم الهاتف (واتساب)"
                        value={buyerInfo.phone}
                        onChange={(e) => setBuyerInfo(p => ({ ...p, phone: e.target.value }))}
                        className="text-left"
                        dir="ltr"
                      />
                    </div>
                    <Button
                      onClick={confirmMatch}
                      disabled={savingMatch}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-heading py-6 text-lg"
                    >
                      {savingMatch ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                      تأكيد المطابقة والتواصل
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">لم يتم العثور على تطابق حالياً</h2>
                    <p className="text-muted-foreground font-body leading-relaxed">
                      لا يوجد حالياً عرض يطابق معاييرك وميزانيتك في {form.commune}، {form.wilaya}.
                      لا تقلق — سيتم إشعارك فوراً عند ظهور عرض مناسب.
                    </p>
                    {matchResult.hint === "wrong_type" && (
                      <p className="text-sm text-amber-600 font-body bg-amber-50 rounded-lg p-3 mt-3">
                        💡 توجد عروض في {form.commune} لكن من أنواع أخرى. جرّب تغيير نوع العقار.
                      </p>
                    )}
                    {matchResult.hint === "budget_low" && (
                      <p className="text-sm text-amber-600 font-body bg-amber-50 rounded-lg p-3 mt-3">
                        💡 توجد عروض من نوع {PROPERTY_TYPES[form.property_type]} في {form.commune} لكن ميزانيتك لا تكفي. جرّب رفع الميزانية.
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={() => { setStep(2); setMatchResult(null); }} className="font-heading">
                      تغيير نوع العقار
                    </Button>
                    <Button onClick={() => { setStep(4); setMatchResult(null); }} variant="outline" className="font-heading">
                      تعديل الميزانية
                    </Button>
                    <Button onClick={() => { setStep(1); setMatchResult(null); setForm({ transaction_type: "", property_type: "", wilaya: "", commune: "", max_budget: "" }); }} variant="ghost" className="font-heading">
                      بحث جديد بالكامل
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 6: Confirmed */}
          {step === 6 && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-display font-bold text-foreground">تم تأكيد المطابقة! ✅</h2>
                <p className="text-muted-foreground font-body leading-relaxed">
                  تم إشعار صاحب العقار وسيتواصل معك على واتساب قريباً.
                  <br />تأكد من أن رقمك نشط على واتساب.
                </p>
              </div>
              <Link to="/">
                <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading">
                  العودة للرئيسية
                </Button>
              </Link>
            </div>
          )}

          {/* Navigation for steps 1-4 */}
          {step <= 4 && (
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
                  onClick={runMatch}
                  disabled={!canProceed() || loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 font-heading"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Search className="w-4 h-4 ml-2" />}
                  بدء المطابقة
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}