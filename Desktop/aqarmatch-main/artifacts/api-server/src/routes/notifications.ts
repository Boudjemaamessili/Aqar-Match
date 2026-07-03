import { Router, Request, Response } from "express";
import { db, listingsTable, matchesTable, notificationsTable, EXPIRY_WARN_DAYS } from "@workspace/db";
import { eq, and, gt, lte, inArray } from "drizzle-orm";

const router = Router();

function computeDaysRemaining(expiresAt: Date): number {
  const now = new Date();
  const diff = expiresAt.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

router.get("/notifications", async (req: Request, res: Response) => {
  const phone = String(req.query.phone ?? "");
  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  const now = new Date();
  const warnCutoff = new Date();
  warnCutoff.setDate(warnCutoff.getDate() + EXPIRY_WARN_DAYS);

  // Find active listings expiring within the warning window
  const expiringListings = await db
    .select()
    .from(listingsTable)
    .where(
      and(
        eq(listingsTable.user_phone, phone),
        eq(listingsTable.is_active, true),
        gt(listingsTable.expires_at, now),
        lte(listingsTable.expires_at, warnCutoff)
      )
    );

  if (expiringListings.length === 0) {
    res.json({
      phone,
      unseen_count: 0,
      has_alerts: false,
      expiring_listings: [],
    });
    return;
  }

  // Fetch match counts for each expiring listing
  const listingIds = expiringListings.map(l => l.id);
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

  // Upsert notifications (one per listing, skip duplicates from today)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const listing of expiringListings) {
    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.seller_phone, phone),
          eq(notificationsTable.listing_id, listing.id),
          gt(notificationsTable.created_at, today)
        )
      );

    if (existing.length === 0) {
      await db.insert(notificationsTable).values({
        seller_phone: phone,
        listing_id: listing.id,
        type: "expiry_warning",
        seen: false,
      });
    }
  }

  // Count unseen notifications
  const unseenRows = await db
    .select()
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.seller_phone, phone),
        eq(notificationsTable.seen, false)
      )
    );

  const expiring_listings = expiringListings.map(l => {
    const matches = matchesByListing[l.id] ?? [];
    return {
      listing_id: l.id,
      deal_type: l.deal_type,
      wilaya: l.wilaya,
      municipality: l.municipality,
      days_remaining: computeDaysRemaining(new Date(l.expires_at)),
      asking_price: parseFloat(l.asking_price as unknown as string),
      total_inquiries: matches.length,
      matched_count: matches.filter(m => m.matched === "true").length,
    };
  });

  res.json({
    phone,
    unseen_count: unseenRows.length,
    has_alerts: true,
    expiring_listings,
  });
});

router.post("/notifications/mark-seen", async (req: Request, res: Response) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) {
    res.status(400).json({ error: "phone is required" });
    return;
  }

  const rows = await db
    .select()
    .from(notificationsTable)
    .where(
      and(
        eq(notificationsTable.seller_phone, phone),
        eq(notificationsTable.seen, false)
      )
    );

  if (rows.length > 0) {
    const ids = rows.map(r => r.id);
    await db
      .update(notificationsTable)
      .set({ seen: true })
      .where(inArray(notificationsTable.id, ids));
  }

  res.json({ updated: rows.length });
});

export default router;
