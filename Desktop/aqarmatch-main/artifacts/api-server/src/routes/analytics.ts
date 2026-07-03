import { Router, Request, Response } from "express";
import { db, listingsTable, matchesTable } from "@workspace/db";
import { eq, inArray, gte } from "drizzle-orm";

const router = Router();

router.get("/analytics/seller", async (req: Request, res: Response) => {
  const phone = String(req.query.phone ?? "");
  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }
  const days = Math.min(90, Math.max(7, parseInt(String(req.query.period_days ?? "30")) || 30));

  const listings = await db
    .select()
    .from(listingsTable)
    .where(eq(listingsTable.user_phone, phone));

  if (listings.length === 0) {
    res.status(404).json({ error: "لم يتم العثور على عقارات لهذا الرقم" });
    return;
  }

  const listingIds = listings.map(l => l.id);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const allMatches = await db
    .select()
    .from(matchesTable)
    .where(
      listingIds.length === 1
        ? eq(matchesTable.listing_id, listingIds[0])
        : inArray(matchesTable.listing_id, listingIds)
    );

  const recentMatches = allMatches.filter(m => new Date(m.created_at) >= since);

  // Build a map: date string -> { total, matched }
  const byDay: Record<string, { date: string; total: number; matched: number }> = {};

  // Pre-fill all days in range with zeros
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    byDay[key] = { date: key, total: 0, matched: 0 };
  }

  for (const m of recentMatches) {
    const key = new Date(m.created_at).toISOString().split("T")[0];
    if (byDay[key]) {
      byDay[key].total += 1;
      if (m.matched === "true") byDay[key].matched += 1;
    }
  }

  const daily_data = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  // Per-listing summary
  const matchesByListing: Record<number, typeof allMatches> = {};
  for (const m of allMatches) {
    if (!matchesByListing[m.listing_id]) matchesByListing[m.listing_id] = [];
    matchesByListing[m.listing_id].push(m);
  }

  const by_listing = listings.map(l => {
    const ms = matchesByListing[l.id] ?? [];
    const recent = ms.filter(m => new Date(m.created_at) >= since);
    return {
      listing_id: l.id,
      deal_type: l.deal_type,
      wilaya: l.wilaya,
      municipality: l.municipality,
      total_inquiries: ms.length,
      matched_count: ms.filter(m => m.matched === "true").length,
      recent_inquiries: recent.length,
      recent_matched: recent.filter(m => m.matched === "true").length,
    };
  });

  res.json({
    phone,
    days,
    total_inquiries: allMatches.length,
    total_matched: allMatches.filter(m => m.matched === "true").length,
    daily_data,
    by_listing,
  });
});

export default router;
