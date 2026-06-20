import React from "react";
import { Home, Search, Lock, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Home,
    number: "01",
    title: "البائع يُدخل عقاره",
    desc: "يملأ نموذجاً ديناميكياً حسب نوع العقار، ويحدد السعر المطلوب والحد الأدنى السري الذي لن يطّلع عليه أحد."
  },
  {
    icon: Search,
    number: "02",
    title: "المشتري يُحدد معاييره",
    desc: "يختار 4 معايير فقط: نوع المعاملة، نوع العقار، الولاية، والبلدية. ثم يُدخل ميزانيته القصوى."
  },
  {
    icon: Lock,
    number: "03",
    title: "المحرّك السري يعمل",
    desc: "الخوارزمية تقارن ميزانية المشتري بالحد الأدنى السري للبائع. لا أحد يرى أرقام الطرف الآخر."
  },
  {
    icon: CheckCircle,
    number: "04",
    title: "تطابق! تواصل مباشر",
    desc: "عند التطابق، يتلقى البائع إشعاراً فورياً بوجود مشتري جاد ضمن نطاق سعره، ويتواصل معه مباشرة."
  }
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-background" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
            كيف تعمل <span className="text-secondary">MatchIQ</span>؟
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-body">
            أربع خطوات فقط تفصلك عن صفقتك العقارية المثالية
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, i) => (
            <div key={i} className="relative group">
              <div className="bg-card rounded-2xl p-6 border border-border hover:border-secondary/50 transition-all duration-300 hover:shadow-lg h-full space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <span className="text-4xl font-display font-bold text-muted-foreground/20">{step.number}</span>
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground">{step.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -left-4 w-8 text-muted-foreground/30 text-2xl">←</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}