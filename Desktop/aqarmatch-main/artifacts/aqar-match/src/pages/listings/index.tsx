import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetListings, useGetWilayat } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, Search, XCircle } from "lucide-react";

export default function BrowseListingsPage() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const initialWilaya = searchParams.get("wilaya") || "all";
  const initialDealType = searchParams.get("deal_type") || "all";
  const initialMunicipality = searchParams.get("municipality") || "";
  
  const [wilaya, setWilaya] = useState(initialWilaya);
  const [dealType, setDealType] = useState(initialDealType);
  const [municipality, setMunicipality] = useState(initialMunicipality);
  const [maxPrice, setMaxPrice] = useState("");

  const { data: wilayat, isLoading: wilayatLoading } = useGetWilayat();
  
  const queryParams = {
    ...(wilaya !== "all" && { wilaya }),
    ...(dealType !== "all" && { deal_type: dealType }),
    ...(municipality && { municipality }),
    ...(maxPrice && { max_price: Number(maxPrice) }),
  };

  const { data: listings, isLoading: listingsLoading, refetch } = useGetListings(queryParams);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  const clearFilters = () => {
    setWilaya("all");
    setDealType("all");
    setMunicipality("");
    setMaxPrice("");
    setTimeout(() => refetch(), 0);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Filters Sidebar */}
        <aside className="w-full md:w-72 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
              <Filter className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-lg">تصفية العقارات</h2>
            </div>
            
            <form onSubmit={handleFilter} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">نوع المعاملة</label>
                <Select value={dealType} onValueChange={setDealType}>
                  <SelectTrigger data-testid="filter-deal-type">
                    <SelectValue placeholder="الكل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    <SelectItem value="بيع">بيع</SelectItem>
                    <SelectItem value="إيجار">إيجار</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">الولاية</label>
                <Select value={wilaya} onValueChange={setWilaya}>
                  <SelectTrigger data-testid="filter-wilaya">
                    <SelectValue placeholder="كل الولايات" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">البلدية</label>
                <Input 
                  value={municipality} 
                  onChange={(e) => setMunicipality(e.target.value)}
                  placeholder="ابحث عن بلدية..." 
                  data-testid="filter-municipality"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">أقصى ميزانية (دج)</label>
                <Input 
                  type="number"
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="مثال: 15000000" 
                  data-testid="filter-max-price"
                />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <Button type="submit" className="w-full font-bold" data-testid="button-apply-filters">
                  <Search className="w-4 h-4 ml-2" />
                  تطبيق الفلاتر
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters} className="w-full text-muted-foreground" data-testid="button-clear-filters">
                  <XCircle className="w-4 h-4 ml-2" />
                  مسح الفلاتر
                </Button>
              </div>
            </form>
          </div>
        </aside>

        {/* Listings Grid */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">
              {listingsLoading ? "جاري البحث..." : `نتائج البحث (${listings?.length || 0} عقار)`}
            </h1>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="border rounded-xl overflow-hidden">
                  <Skeleton className="h-48 w-full rounded-none" />
                  <div className="p-5">
                    <Skeleton className="h-6 w-3/4 mb-3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-card rounded-xl border border-dashed border-border shadow-sm">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-foreground">لا توجد نتائج مطابقة</h3>
              <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                لم نتمكن من العثور على عقارات تطابق بحثك. جرب تعديل الفلاتر للوصول إلى نتائج أفضل.
              </p>
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                مسح الفلاتر والمحاولة مجددا
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
