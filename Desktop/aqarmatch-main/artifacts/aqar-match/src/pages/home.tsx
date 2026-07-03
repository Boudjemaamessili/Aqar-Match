import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useGetListingStats, useGetWilayat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/listing-card";
import { Building, Home, MapPin, Search, Tag, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetListingStats();
  const { data: wilayat, isLoading: wilayatLoading } = useGetWilayat();

  const [searchWilaya, setSearchWilaya] = useState<string>("");
  const [searchDealType, setSearchDealType] = useState<string>("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchWilaya && searchWilaya !== "all") params.set("wilaya", searchWilaya);
    if (searchDealType && searchDealType !== "all") params.set("deal_type", searchDealType);
    setLocation(`/listings?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-primary text-primary-foreground py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent to-transparent" />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center gap-6">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight max-w-3xl leading-tight">
            ابحث عن عقارك المثالي أو اعرضه <span className="text-accent">بذكاء وسرية</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl">
            عقارMatch هي منصتك الموثوقة. للمشترين: اكتشف إن كانت ميزانيتك تتطابق مع العقار. وللبائعين: اعرض عقارك بسعر معلن وسعر أدنى سري.
          </p>

          <Card className="w-full max-w-4xl mt-8 bg-background/95 backdrop-blur shadow-xl border-white/20 p-2 md:p-4 rounded-2xl">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Select value={searchWilaya} onValueChange={setSearchWilaya}>
                  <SelectTrigger className="h-14 text-base border-muted bg-background" data-testid="select-wilaya-search">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <SelectValue placeholder="اختر الولاية..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الولايات</SelectItem>
                    {!wilayatLoading && wilayat?.map((w) => (
                      <SelectItem key={w.code} value={w.name_ar}>
                        {w.code} - {w.name_ar}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 relative">
                <Select value={searchDealType} onValueChange={setSearchDealType}>
                  <SelectTrigger className="h-14 text-base border-muted bg-background" data-testid="select-deal-type-search">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-muted-foreground" />
                      <SelectValue placeholder="نوع المعاملة..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="بيع">بيع</SelectItem>
                    <SelectItem value="إيجار">إيجار</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="h-14 px-8 text-lg font-bold bg-accent hover:bg-accent/90 text-accent-foreground" data-testid="button-submit-search">
                <Search className="w-5 h-5 ml-2" />
                بحث
              </Button>
            </form>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 -mt-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-primary/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Building className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">إجمالي العقارات</p>
                {statsLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-black">{stats?.total || 0}</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-primary/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                <Tag className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">عقارات للبيع</p>
                {statsLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-black">{stats?.for_sale || 0}</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-primary/10">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                <Home className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">عقارات للإيجار</p>
                {statsLoading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-black">{stats?.for_rent || 0}</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-accent" />
              أحدث العقارات
            </h2>
            <p className="text-muted-foreground mt-2">اكتشف أحدث العروض المضافة في المنصة</p>
          </div>
          <Link href="/listings" className="text-primary font-bold hover:underline" data-testid="link-view-all">
            عرض الكل &larr;
          </Link>
        </div>

        {statsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-5">
                  <Skeleton className="h-6 w-3/4 mb-3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats?.recent_listings && stats.recent_listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.recent_listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-muted/30 rounded-xl border border-dashed border-border">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold text-foreground">لا توجد عقارات حديثة</h3>
            <p className="text-muted-foreground mt-1">كن أول من يضيف عقاراً!</p>
            <Button asChild className="mt-6">
              <Link href="/listings/new">إضافة عقار</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
