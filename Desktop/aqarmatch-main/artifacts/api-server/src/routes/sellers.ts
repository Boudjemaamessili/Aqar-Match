import { Router, Request, Response } from "express";
import { db, listingsTable, matchesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router = Router();

function computeDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

router.get("/sellers/:phone/inquiries", async (req: Request, res: Response) => {
  const phone = String(req.params.phone);

  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.user_phone, phone));

  if (listings.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على عقارات لهذا الرقم" });
    return;
  }

  const listingIds = listings.map(l => l.id);

  const allMatches = await db
    .select()
    .from(matchesTable)
    .where(
      listingIds.length === 1
        ? eq(matchesTable.listing_id, listingIds[0])
        : inArray(matchesTable.listing_id, listingIds)
    );

  const matchesByListing: Record<number, typeof allMatches> = {};
  for (const m of allMatches) {
    if (!matchesByListing[m.listing_id]) matchesByListing[m.listing_id] = [];
    matchesByListing[m.listing_id].push(m);
  }

  const now = new Date();

  const listingsWithInquiries = listings.map(l => {
    const matches = matchesByListing[l.id] ?? [];
    const expiresAt = new Date(l.expires_at);
    const isActive = l.is_active && expiresAt > now;
    return {
      id: l.id,
      deal_type: l.deal_type,
      wilaya: l.wilaya,
      municipality: l.municipality,
      neighborhoods: l.neighborhoods ?? [],
      asking_price: parseFloat(l.asking_price as unknown as string),
      created_at: l.created_at.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: isActive,
      days_remaining: computeDaysRemaining(expiresAt),
      matches: matches.map(m => ({
        id: m.id,
        buyer_phone: m.buyer_phone,
        budget: parseFloat(m.budget as unknown as string),
        matched: m.matched === "true",
        created_at: m.created_at.toISOString(),
      })),
      total_inquiries: matches.length,
      matched_count: matches.filter(m => m.matched === "true").length,
    };
  });

  const total_inquiries = listingsWithInquiries.reduce((s, l) => s + l.total_inquiries, 0);
  const total_matched = listingsWithInquiries.reduce((s, l) => s + l.matched_count, 0);

  res.json({
    phone,
    total_listings: listings.length,
    total_inquiries,
    total_matched,
    listings: listingsWithInquiries,
  });
});

export default router;
