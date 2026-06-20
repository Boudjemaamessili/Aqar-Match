import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/landing/Navbar";

export default function SellSuccess() {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="pt-32 pb-16 container mx-auto px-6 max-w-lg text-center space-y-8">
        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-display font-bold text-foreground">تم نشر عرضك بنجاح!</h1>
          <p className="text-muted-foreground font-body leading-relaxed">
            عقارك الآن في نظام المطابقة الذكي. ستتلقى إشعاراً فورياً على واتساب
            عندما يجد النظام مشترياً تتطابق ميزانيته مع نطاق سعرك.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 space-y-3 text-right">
          <h3 className="font-heading font-semibold">ماذا يحدث الآن؟</h3>
          <ul className="space-y-2 text-sm text-muted-foreground font-body">
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold mt-0.5">١.</span>
              <span>محرّك المطابقة يعمل على مدار الساعة للبحث عن مشترين مناسبين</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold mt-0.5">٢.</span>
              <span>عند التطابق، تتلقى إشعاراً بمعلومات الاتصال بالمشتري</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-secondary font-bold mt-0.5">٣.</span>
              <span>تتواصل مباشرة مع المشتري لإتمام الصفقة — بدون وسيط</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/dashboard">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading">
              لوحة التحكم
            </Button>
          </Link>
          <Link to="/sell">
            <Button variant="outline" className="font-heading">
              نشر عقار آخر
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}