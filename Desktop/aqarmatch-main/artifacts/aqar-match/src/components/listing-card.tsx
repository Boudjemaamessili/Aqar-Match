import { Link } from "wouter";
import type { Listing } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Tag, Clock, AlertTriangle } from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat("ar-DZ").format(listing.asking_price);

  return (
    <Card className={`overflow-hidden transition-all flex flex-col group ${listing.is_active ? 'hover:shadow-md hover:border-primary/30' : 'opacity-60'}`}>
      <CardHeader className="p-0">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {/* Placeholder for an image - using CSS pattern for texture */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
            <BuildingIcon className="w-16 h-16 opacity-20" />
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            <Badge variant={listing.deal_type === "بيع" ? "default" : "secondary"} className="shadow-sm font-bold px-3 py-1">
              {listing.deal_type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors">
            {listing.deal_type} في {listing.municipality}
          </h3>
        </div>
        
        <div className="flex items-center text-muted-foreground text-sm gap-1.5">
          <MapPin className="w-4 h-4 shrink-0 text-accent" />
          <span className="truncate">{listing.wilaya} - {listing.municipality}</span>
        </div>

        {listing.neighborhoods && listing.neighborhoods.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {listing.neighborhoods.slice(0, 3).map((n: string, i: number) => (
              <Badge key={i} variant="outline" className="text-[10px] bg-background/50">
                {n}
              </Badge>
            ))}
            {listing.neighborhoods.length > 3 && (
              <Badge variant="outline" className="text-[10px] bg-background/50">+{listing.neighborhoods.length - 3}</Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 flex flex-col gap-3 mt-auto">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3" /> السعر المطلوب
            </span>
            <span className="font-black text-primary text-lg">
              {formattedPrice} دج
            </span>
          </div>
          
          <Link href={`/listings/${listing.id}`} className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-bold transition-colors" data-testid={`link-listing-${listing.id}`}>
            التفاصيل
          </Link>
        </div>

        <div className="w-full flex justify-start">
          {!listing.is_active ? (
            <Badge variant="destructive" className="flex gap-1 items-center font-bold text-xs py-1">
              <AlertTriangle className="w-3 h-3" /> منتهي الصلاحية
            </Badge>
          ) : listing.days_remaining !== undefined && listing.days_remaining <= 7 ? (
            <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50 dark:bg-amber-950/30 flex gap-1 items-center font-bold text-xs py-1">
              <Clock className="w-3 h-3" /> ينتهي خلال {listing.days_remaining} أيام ⚠
            </Badge>
          ) : listing.days_remaining !== undefined ? (
            <Badge variant="secondary" className="text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 flex gap-1 items-center font-bold text-xs py-1">
              <Clock className="w-3 h-3" /> ينتهي خلال {listing.days_remaining} أيام
            </Badge>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M12 10h.01" />
      <path d="M12 14h.01" />
      <path d="M16 10h.01" />
      <path d="M16 14h.01" />
      <path d="M8 10h.01" />
      <path d="M8 14h.01" />
    </svg>
  );
}
