import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Eye, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-bl from-primary via-primary/95 to-primary/90" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/50 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-2 rounded-full text-sm font-body">
            <Zap className="w-4 h-4" />
            <span>أول منصة عقارية ذكية في الجزائر</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-primary-foreground leading-tight">
            <span className="text-secondary">MatchIQ</span>
            <br />
            <span className="text-3xl md:text-5xl lg:text-5xl font-heading">لا تصفّح. لا بحث. فقط تطابق ذكي.</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-2xl mx-auto font-body leading-relaxed">
            المنصة التي تُنهي عصر التصفّح العشوائي. أدخل معاييرك، وسنجد لك العقار المثالي
            عبر خوارزمية مطابقة سرّية تحمي خصوصية الجميع.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link to="/sell">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 font-heading">
                أنا بائع / مؤجّر
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
            <Link to="/buy">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-lg px-8 py-6 font-heading">
                أنا مشتري / مستأجر
                <ArrowLeft className="w-5 h-5 mr-2" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-3xl mx-auto">
            {[
              { icon: Eye, title: "صفر تصفّح", desc: "لا قوائم عقارية ولا تمرير لا نهائي" },
              { icon: Shield, title: "خصوصية مطلقة", desc: "بياناتك المالية مشفّرة ومحمية" },
              { icon: Zap, title: "مطابقة فورية", desc: "خوارزمية ذكية تربطك بالعرض المناسب" },
            ].map((item, i) => (
              <div key={i} className="text-center space-y-3 p-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-secondary/20 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="text-primary-foreground font-heading font-semibold">{item.title}</h3>
                <p className="text-primary-foreground/60 text-sm font-body">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}