import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetSellerInquiries, getGetSellerInquiriesQueryKey, useRenewListing, useGetNotifications, getGetNotificationsQueryKey, useMarkNotificationsSeen, useFetchSellerAnalytics, getFetchSellerAnalyticsQueryKey } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { arDZ } from "date-fns/locale";
import { Building, Building2, Calendar, CheckCircle2, ChevronLeft, Inbox, MapPin, Search, Phone, Receipt, XCircle, Clock, AlertTriangle, RefreshCw, Bell, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const phoneSchema = z.object({
  phone: z.string().min(8, "الرجاء إدخال رقم هاتف صحيح").max(20, "رقم الهاتف طويل جداً"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function InquiriesPage() {
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [analyticsDays, setAnalyticsDays] = useState(30);

  const form = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: "",
    },
  });

  const { data, isLoading, isError, error } = useGetSellerInquiries(submittedPhone, {
    query: {
      enabled: !!submittedPhone,
      queryKey: getGetSellerInquiriesQueryKey(submittedPhone),
      retry: false,
    },
  });

  const { data: analyticsData, isLoading: analyticsLoading } = useFetchSellerAnalytics(
    { phone: submittedPhone, period_days: analyticsDays },
    { query: { enabled: !!submittedPhone, queryKey: getFetchSellerAnalyticsQueryKey({ phone: submittedPhone, period_days: analyticsDays }) } }
  );

  const queryClient = useQueryClient();
  const renew = useRenewListing();

  const { data: notifData } = useGetNotifications(
    { phone: submittedPhone },
    {
      query: {
        enabled: !!submittedPhone,
        queryKey: getGetNotificationsQueryKey({ phone: submittedPhone }),
      },
    }
  );

  const markSeen = useMarkNotificationsSeen();
  const handleDismissAlerts = () => {
    markSeen.mutate(
      { data: { phone: submittedPhone } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey({ phone: submittedPhone }) });
        },
      }
    );
  };

  const handleRenew = (listingId: number) => {
    renew.mutate(
      { id: listingId, data: { seller_phone: submittedPhone } },
      {
        onSuccess: () => {
          toast.success("تم تجديد إعلانك لـ 30 يوماً إضافية");
          queryClient.invalidateQueries({ queryKey: getGetSellerInquiriesQueryKey(submittedPhone) });
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey({ phone: submittedPhone }) });
        },
        onError: () => toast.error("فشل التجديد. الرجاء المحاولة مرة أخرى."),
      }
    );
  };

  const onSubmit = (values: PhoneFormValues) => {
    setSubmittedPhone(values.phone);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-DZ", {
      style: "currency",
      currency: "DZD",
      maximumFractionDigits: 0,
    })
      .format(price)
      .replace("د.ج.‏", "دج");
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: arDZ });
    } catch {
      return dateString.split("T")[0];
    }
  };

  if (isError) {
    if ((error as any)?.status === 404) {
      toast.error("لم يتم العثور على عقارات لهذا الرقم. تحقق من الرقم أو أضف عقارك أولاً.");
    } else {
      toast.error("حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-5xl">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4 text-primary">
          <Inbox className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-4">استفساراتي</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          أدخل رقم هاتفك لعرض جميع عقاراتك ومتابعة محاولات التطابق والاستفسارات من المشترين المحتملين.
        </p>
      </div>

      <Card className="max-w-md mx-auto mb-12 shadow-sm border-primary/10">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>رقم الهاتف</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="مثال: 0555123456"
                          className="pr-10 h-12 text-lg text-left"
                          dir="ltr"
                          data-testid="input-phone"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-12 text-lg font-bold"
                data-testid="button-submit-phone"
              >
                <Search className="w-5 h-5 ml-2" />
                عرض الاستفسارات
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {data && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {notifData?.has_alerts && (
            <div 
              className="p-4 md:p-6 bg-amber-50 dark:bg-amber-950/20 border-r-4 border-r-amber-500 rounded-l-lg border-y border-l border-amber-200 dark:border-amber-900/30 animate-in fade-in slide-in-from-top-4 duration-500 relative shadow-sm"
              data-testid="banner-expiry-alert"
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 left-2 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/50 h-8 w-8 rounded-full"
                onClick={handleDismissAlerts}
                data-testid="button-dismiss-alert"
              >
                <X className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-3 mb-4 text-amber-800 dark:text-amber-500">
                <Bell className="w-6 h-6 animate-pulse" />
                <h3 className="font-bold text-lg">تنبيه: عقاراتك تقترب من انتهاء الصلاحية</h3>
              </div>
              
              <div className="space-y-3">
                {notifData.expiring_listings?.map((listing) => (
                  <div key={listing.listing_id} className="bg-white/60 dark:bg-black/20 p-3 rounded border border-amber-100 dark:border-amber-900/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-amber-900 dark:text-amber-400">
                      <Badge variant={listing.deal_type === "بيع" ? "default" : "secondary"} className="text-xs bg-amber-200 text-amber-900 hover:bg-amber-300 dark:bg-amber-900 dark:text-amber-100">
                        {listing.deal_type}
                      </Badge>
                      <span className="font-semibold">عقار في {listing.municipality}، {listing.wilaya}</span>
                      <span className="hidden md:inline text-amber-300 dark:text-amber-800">•</span>
                      <span className="flex items-center gap-1 font-bold text-amber-700 dark:text-amber-500"><Clock className="w-3.5 h-3.5"/> ينتهي خلال {listing.days_remaining} أيام</span>
                      <span className="hidden md:inline text-amber-300 dark:text-amber-800">•</span>
                      <span>{listing.total_inquiries} استفسارات</span>
                      <span className="hidden md:inline text-amber-300 dark:text-amber-800">•</span>
                      <span>{listing.matched_count} تطابق</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap gap-2"
                      onClick={() => handleRenew(listing.listing_id)}
                      disabled={renew.isPending && renew.variables?.id === listing.listing_id}
                    >
                      {renew.isPending && renew.variables?.id === listing.listing_id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      تجديد الآن
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Building className="w-8 h-8 text-primary mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي العقارات</p>
                <p className="text-3xl font-black">{data.total_listings}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Receipt className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">إجمالي الاستفسارات</p>
                <p className="text-3xl font-black">{data.total_inquiries}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-100 dark:border-green-900/30">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">التطابقات الناجحة</p>
                <p className="text-3xl font-black">{data.total_matched}</p>
              </CardContent>
            </Card>
          </div>

          {analyticsData && (
            <div className="space-y-4" data-testid="section-analytics">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-2">
                <h2 className="text-2xl font-bold">إحصائيات النشاط</h2>
                <div className="flex bg-muted/50 rounded-lg p-1">
                  {[7, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => setAnalyticsDays(days)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        analyticsDays === days
                          ? "bg-background shadow-sm text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {days === 7 ? "7 أيام" : days === 30 ? "30 يوماً" : "90 يوماً"}
                    </button>
                  ))}
                </div>
              </div>

              {analyticsData.daily_data.every((d) => d.total === 0) ? (
                <div className="bg-muted/20 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground">
                  <Inbox className="w-10 h-10 mb-3 opacity-20" />
                  <p>لا توجد استفسارات خلال هذه الفترة</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">تطور الاستفسارات اليومية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 w-full mt-4" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.daily_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(val) => {
                                try {
                                  return format(new Date(val), "dd/MM", { locale: arDZ });
                                } catch {
                                  return val;
                                }
                              }}
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis 
                              tick={{ fontSize: 12, fill: '#6b7280' }}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip 
                              formatter={(value, name) => [value, name === 'total' ? 'إجمالي الاستفسارات' : 'التطابقات']}
                              labelFormatter={(label) => {
                                try {
                                  return format(new Date(label), "dd MMMM yyyy", { locale: arDZ });
                                } catch {
                                  return label;
                                }
                              }}
                              contentStyle={{ textAlign: 'right', direction: 'rtl', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend 
                              formatter={(value) => value === 'total' ? 'إجمالي الاستفسارات' : 'التطابقات'}
                              iconType="circle"
                            />
                            <Bar dataKey="total" name="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="matched" name="matched" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">أداء العقارات</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="bg-muted/10">
                            <TableRow>
                              <TableHead className="text-right py-3">العقار</TableHead>
                              <TableHead className="text-right py-3">الاستفسارات (إجمالي)</TableHead>
                              <TableHead className="text-right py-3">التطابقات</TableHead>
                              <TableHead className="text-right py-3">معدل التطابق</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {analyticsData.by_listing.map((listing) => {
                              const matchRate = listing.total_inquiries > 0 
                                ? Math.round((listing.matched_count / listing.total_inquiries) * 100) 
                                : 0;
                                
                              return (
                                <TableRow key={listing.listing_id}>
                                  <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                      <Badge variant={listing.deal_type === "بيع" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0.5">
                                        {listing.deal_type}
                                      </Badge>
                                      <span>{listing.municipality}، {listing.wilaya}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>{listing.total_inquiries}</TableCell>
                                  <TableCell>{listing.matched_count}</TableCell>
                                  <TableCell>
                                    {listing.total_inquiries > 0 ? (
                                      <span className={matchRate > 0 ? "text-green-600 font-bold" : "text-muted-foreground"}>
                                        {matchRate}%
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-2xl font-bold border-b pb-2">تفاصيل العقارات والاستفسارات</h2>
            
            {data.listings.map((listing) => (
              <Card key={listing.id} className={`overflow-hidden shadow-sm ${!listing.is_active ? 'border-destructive/30 opacity-80' : 'border-muted'}`}>
                <div className="bg-muted/30 p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={listing.deal_type === "بيع" ? "default" : "secondary"} className="text-sm px-3 py-1">
                        {listing.deal_type}
                      </Badge>
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {listing.municipality}، {listing.wilaya}
                      </h3>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-4 text-sm flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        أضيف في {formatDate(listing.created_at)}
                      </span>
                      {listing.neighborhoods.length > 0 && (
                        <span className="hidden md:inline-flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {listing.neighborhoods.join("، ")}
                        </span>
                      )}
                      
                      {!listing.is_active ? (
                        <Badge variant="destructive" className="flex gap-1 items-center text-[10px] py-0 px-2 h-5">
                          <AlertTriangle className="w-3 h-3" /> منتهي الصلاحية
                        </Badge>
                      ) : listing.days_remaining !== undefined && listing.days_remaining <= 7 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50 dark:bg-amber-950/30 flex gap-1 items-center text-[10px] py-0 px-2 h-5">
                          <Clock className="w-3 h-3" /> ينتهي خلال {listing.days_remaining} أيام ⚠
                        </Badge>
                      ) : listing.days_remaining !== undefined ? (
                        <Badge variant="secondary" className="text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 flex gap-1 items-center text-[10px] py-0 px-2 h-5">
                          <Clock className="w-3 h-3" /> ينتهي خلال {listing.days_remaining} أيام
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                    {(!listing.is_active || (listing.days_remaining !== undefined && listing.days_remaining <= 7)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2 border-primary/20 text-primary hover:bg-primary/5" data-testid={`button-renew-${listing.id}`}>
                            <RefreshCw className="w-4 h-4" />
                            تجديد الإعلان
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-right">تجديد إعلان العقار</AlertDialogTitle>
                            <AlertDialogDescription className="text-right">
                              هل أنت متأكد من رغبتك في تجديد هذا الإعلان لمدة 30 يوماً إضافية؟
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-row-reverse sm:flex-row gap-2 w-full justify-start mt-4">
                            <AlertDialogAction onClick={() => handleRenew(listing.id)} disabled={renew.isPending} className="gap-2" data-testid={`button-confirm-renew-${listing.id}`}>
                              {renew.isPending && renew.variables?.id === listing.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                              تأكيد التجديد
                            </AlertDialogAction>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <div className="text-right bg-background p-3 rounded-lg border shadow-sm w-full sm:w-auto">
                      <p className="text-sm text-muted-foreground mb-1">السعر المطلوب</p>
                      <p className="text-xl font-bold text-primary" dir="ltr">{formatPrice(listing.asking_price)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-0">
                  {listing.matches.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/10">
                          <TableRow>
                            <TableHead className="text-right font-bold py-4">رقم المشتري</TableHead>
                            <TableHead className="text-right font-bold py-4">الميزانية المقترحة</TableHead>
                            <TableHead className="text-right font-bold py-4">النتيجة</TableHead>
                            <TableHead className="text-right font-bold py-4">التاريخ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listing.matches.map((match) => (
                            <TableRow key={match.id} className="hover:bg-muted/5">
                              <TableCell className="font-medium" dir="ltr">{match.buyer_phone}</TableCell>
                              <TableCell dir="ltr">{formatPrice(match.budget)}</TableCell>
                              <TableCell>
                                {match.matched ? (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200 gap-1 pr-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    تطابق
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground gap-1 pr-1.5">
                                    <XCircle className="w-3.5 h-3.5" />
                                    لم يتطابق
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {formatDate(match.created_at)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>لم يتلق هذا العقار أي استفسارات أو محاولات تطابق حتى الآن.</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isError && (error as any)?.status === 404 && (
        <Card className="border-dashed border-2 bg-muted/20 mt-8">
          <CardContent className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-xl font-bold mb-2">لا توجد عقارات</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              لم يتم العثور على عقارات مرتبطة برقم الهاتف هذا. يرجى التحقق من الرقم أو إضافة عقارك أولاً.
            </p>
            <Button variant="outline" asChild>
              <a href="/listings/new">إضافة عقار جديد</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
