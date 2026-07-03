import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useCreateListing, useGetWilayat, getGetListingsQueryKey, getGetListingStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EyeOff, Building, Tag } from "lucide-react";

const formSchema = z.object({
  deal_type: z.enum(["بيع", "إيجار"], {
    required_error: "يرجى اختيار نوع المعاملة",
  }),
  wilaya: z.string({
    required_error: "يرجى اختيار الولاية",
  }).min(1, "يرجى اختيار الولاية"),
  municipality: z.string().min(2, "يرجى إدخال اسم البلدية"),
  neighborhoods_input: z.string().optional(),
  asking_price: z.coerce.number().min(1000, "السعر المطلوب غير منطقي"),
  floor_price: z.coerce.number().min(1000, "السعر الأدنى غير منطقي"),
  user_phone: z.string().min(8, "رقم الهاتف غير صحيح"),
}).refine(data => data.floor_price <= data.asking_price, {
  message: "السعر الأدنى السري يجب أن يكون أقل من أو يساوي السعر المطلوب",
  path: ["floor_price"],
});

type FormValues = z.infer<typeof formSchema>;

export default function NewListingPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: wilayat, isLoading: wilayatLoading } = useGetWilayat();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      municipality: "",
      neighborhoods_input: "",
      user_phone: "",
    },
  });

  const createListingMutation = useCreateListing();

  function onSubmit(data: FormValues) {
    // Convert comma separated string to array
    const neighborhoods = data.neighborhoods_input
      ? data.neighborhoods_input.split(",").map(s => s.trim()).filter(Boolean)
      : [];

    createListingMutation.mutate({
      data: {
        deal_type: data.deal_type,
        wilaya: data.wilaya,
        municipality: data.municipality,
        neighborhoods,
        asking_price: data.asking_price,
        floor_price: data.floor_price,
        user_phone: data.user_phone,
      }
    }, {
      onSuccess: (newListing) => {
        toast.success("تمت إضافة العقار بنجاح!");
        queryClient.invalidateQueries({ queryKey: getGetListingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetListingStatsQueryKey() });
        setLocation(`/listings/${newListing.id}`);
      },
      onError: (err) => {
        toast.error("حدث خطأ أثناء إضافة العقار");
        console.error(err);
      }
    });
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="bg-muted/50 border-b border-border pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Building className="w-5 h-5" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">إضافة عقار جديد</CardTitle>
          </div>
          <CardDescription className="text-base">
            قم بإضافة تفاصيل عقارك. الميزة الفريدة هنا هي السعر الأدنى السري الذي يضمن لك بيعاً ذكياً.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="deal_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع المعاملة</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-deal-type">
                            <SelectValue placeholder="اختر نوع المعاملة" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="بيع">بيع</SelectItem>
                          <SelectItem value="إيجار">إيجار</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="wilaya"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الولاية</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="input-wilaya" disabled={wilayatLoading}>
                            <SelectValue placeholder={wilayatLoading ? "جاري التحميل..." : "اختر الولاية"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wilayat?.map((w) => (
                            <SelectItem key={w.code} value={w.name_ar}>
                              {w.code} - {w.name_ar}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="municipality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>البلدية</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: القبة" {...field} data-testid="input-municipality" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="neighborhoods_input"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الأحياء (اختياري)</FormLabel>
                      <FormControl>
                        <Input placeholder="مفصولة بفاصلة (مثال: حي الينابيع، حي المنظر الجميل)" {...field} data-testid="input-neighborhoods" />
                      </FormControl>
                      <FormDescription>افصل بين أسماء الأحياء بفاصلة</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="bg-secondary/30 p-6 rounded-xl border border-secondary my-8">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent" /> تسعير العقار
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="asking_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-primary">السعر المطلوب (المعلن) دج</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} className="text-lg font-mono font-bold h-12" data-testid="input-asking-price" />
                        </FormControl>
                        <FormDescription>هذا السعر سيظهر للجميع في المنصة</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="floor_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-accent flex items-center gap-1">
                          <EyeOff className="w-4 h-4" /> السعر الأدنى (السري) دج
                        </FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} className="text-lg font-mono font-bold h-12 border-accent/50 focus-visible:ring-accent" data-testid="input-floor-price" />
                        </FormControl>
                        <FormDescription className="text-accent/80">هذا السعر لن يظهر لأحد. يستخدم للمطابقة فقط.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="user_phone"
                render={({ field }) => (
                  <FormItem className="md:w-1/2">
                    <FormLabel>رقم هاتفك</FormLabel>
                    <FormControl>
                      <Input placeholder="0555000000" {...field} dir="ltr" className="text-right" data-testid="input-seller-phone" />
                    </FormControl>
                    <FormDescription>سيتم عرضه فقط للمشترين المتطابقين معك</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-6 border-t border-border flex justify-end">
                <Button type="submit" size="lg" className="w-full md:w-auto font-bold px-12" disabled={createListingMutation.isPending} data-testid="button-submit-listing">
                  {createListingMutation.isPending ? "جاري الإضافة..." : "أضف العقار"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
