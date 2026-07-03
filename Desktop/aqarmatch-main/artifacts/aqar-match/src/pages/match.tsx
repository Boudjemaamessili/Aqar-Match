import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { CheckCircle2, Phone, ArrowRight } from "lucide-react";

export default function MatchSuccessPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const sellerPhone = searchParams.get("phone");

  if (!sellerPhone) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold">لا يوجد تطابق متاح</h2>
        <Button asChild className="mt-6">
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-3xl p-8 md:p-12 shadow-2xl border border-primary/20 text-center animate-in fade-in zoom-in duration-500">
        
        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4">
          تطابق ناجح! 🎉
        </h1>
        
        <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
          مبروك! ميزانيتك تتطابق مع السعر الذي يطلبه البائع. تواصل معه الآن لإتمام الصفقة.
        </p>

        <div className="bg-primary/5 rounded-2xl p-6 mb-10 border border-primary/10">
          <div className="text-sm font-bold text-primary mb-2 uppercase tracking-widest">رقم البائع</div>
          <div className="text-4xl font-black font-mono tracking-wider flex items-center justify-center gap-3" dir="ltr">
            <Phone className="w-6 h-6 text-accent" />
            <a href={`tel:${sellerPhone}`} className="hover:text-accent transition-colors" data-testid="text-seller-phone">
              {sellerPhone}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="w-full h-14 text-lg font-bold">
            <a href={`tel:${sellerPhone}`}>
              <Phone className="w-5 h-5 ml-2" />
              اتصل الآن
            </a>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full h-14">
            <Link href="/listings">
              العودة لتصفح العقارات
              <ArrowRight className="w-5 h-5 mr-2" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
