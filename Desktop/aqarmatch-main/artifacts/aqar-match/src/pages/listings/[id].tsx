import { useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useGetListing, useMatchListing, getGetListingQueryKey } from "@workspace/api-client-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Tag, Calendar, ShieldCheck, HelpCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

const matchSchema = z.object({
  budget: z.coerce.number().min(1000, "الميزانية غير منطقية"),
  buyer_phone: z.string().min(8, "رقم الهاتف غير صحيح"),
});

export default function ListingDetailPage() {
  const [, params] = useRoute("/listings/:id");
  const listingId = params?.id ? Number(params.id) : 0;
  const [, setLocation] = useLocation();

  const { data: listing, isLoading, error } = useGetListing(listingId, {
    query: { enabled: !!listingId, queryKey: getGetListingQueryKey(listingId) }
  });

  const matchMutation = useMatchListing();

  const form = useForm<z.infer<typeof matchSchema>>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      buyer_phone: "",
    },
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h2 className="text-2xl font-bold text-destructive">حدث خطأ</h2>
        <p className="text-muted-foreground mt-2">لا يمكن العثور على العقار المطلوب</p>
        <Button asChild className="mt-6">
          <Link href="/listings">العودة للتصفح</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !listing) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full mt-12" />
          </div>
        </div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("ar-DZ").format(listing.asking_price);

  function onMatchSubmit(data: z.infer<typeof matchSchema>) {
    matchMutation.mutate({
      id: listingId,
      data: {
        budget: data.budget,
        buyer_phone: data.buyer_phone,
      }
    }, {
      onSuccess: (result) => {
        if (result.matched && result.seller_phone) {
          // Success! Redirect to match page
          setLocation(`/match?phone=${encodeURIComponent(result.seller_phone)}`);
        } else {
          // Failed match
          toast.error("عذراً، ميزانيتك لا تتطابق مع الحد الأدنى السري للبائع.", {
            description: "يمكنك محاولة زيادة الميزانية أو البحث عن عقار آخر.",
            duration: 6000,
          });
        }
      },
      onError: (err) => {
        toast.error("حدث خطأ أثناء الفحص");
        console.error(err);
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/listings" className="hover:text-primary">العقارات</Link>
        <span>/</span>
        <span className="text-foreground">{listing.wilaya}</span>
        <span>/</span>
        <span className="text-foreground">{listing.municipality}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Listing Details */}
        <div className="lg:col-span-7 space-y-8">
          {!listing.is_active && (
            <div className="bg-destructive/10 text-destructive border border-destructive/20 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg mb-1">هذا العقار منتهي الصلاحية</h3>
                <p className="text-sm opacity-90">لا يمكن إجراء فحص التطابق لهذا العقار حالياً.</p>
              </div>
            </div>
          )}
          <div className="aspect-[16/10] bg-muted rounded-2xl overflow-hidden relative border border-border">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-muted-foreground/30 font-bold text-4xl">عقارMatch</span>
            </div>
            <div className="absolute top-4 right-4">
              <Badge className="text-lg px-4 py-1.5 shadow-md">{listing.deal_type}</Badge>
            </div>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-black mb-4">
              عقار لل{listing.deal_type} في {listing.municipality}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="font-medium text-lg">{listing.wilaya} - {listing.municipality}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                <span>أضيف في: {format(new Date(listing.created_at), "yyyy-MM-dd")}</span>
              </div>
            </div>

            <div className="bg-secondary/20 p-6 rounded-xl border border-secondary mb-8">
              <div className="text-sm text-muted-foreground mb-1">السعر المطلوب (المعلن)</div>
              <div className="text-4xl font-black text-primary flex items-end gap-2">
                {formattedPrice} <span className="text-xl font-bold text-muted-foreground mb-1">دج</span>
              </div>
            </div>

            {listing.neighborhoods && listing.neighborhoods.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">الأحياء / المناطق</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.neighborhoods.map((n, i) => (
                    <Badge key={i} variant="outline" className="text-sm py-1.5 bg-background">
                      {n}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Match Check Form */}
        <div className="lg:col-span-5">
          <div className="bg-card border-2 border-primary/20 rounded-2xl shadow-xl p-6 md:p-8 sticky top-24">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8 text-accent" />
              <h2 className="text-2xl font-black text-primary">فحص التطابق</h2>
            </div>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              البائع وضع سعراً أدنى سرياً لا يظهر لأحد. أدخل أقصى ميزانية لديك للتأكد من تطابقها مع السعر السري والحصول على رقم البائع مباشرة.
            </p>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onMatchSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-lg flex items-center justify-between">
                        أقصى ميزانية لديك (دج)
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="مثال: 12000000" {...field} className="h-14 text-xl font-bold font-mono" data-testid="input-match-budget" />
                      </FormControl>
                      <FormDescription>كن صريحاً، هذه فرصتك الوحيدة للمطابقة.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold">رقم هاتفك</FormLabel>
                      <FormControl>
                        <Input placeholder="0555000000" {...field} dir="ltr" className="h-12 text-right" data-testid="input-match-phone" />
                      </FormControl>
                      <FormDescription>للتواصل في حال إتمام التطابق</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-lg font-black bg-accent hover:bg-accent/90 mt-4 disabled:opacity-50" 
                  disabled={matchMutation.isPending || !listing.is_active}
                  data-testid="button-match-submit"
                >
                  {matchMutation.isPending ? "جاري الفحص..." : !listing.is_active ? "العقار منتهي الصلاحية" : "افحص التطابق الآن"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

      </div>
    </div>
  );
}
