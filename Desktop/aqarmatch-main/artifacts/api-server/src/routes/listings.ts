import { Router, Request, Response } from "express";
import { db, listingsTable, matchesTable, LISTING_EXPIRY_DAYS } from "@workspace/db";
import { eq, desc, and, lte, gt } from "drizzle-orm";
import {
  CreateListingBody,
  GetListingsQueryParams,
  MatchListingBody,
  MatchListingParams,
  GetListingParams,
  RenewListingBody,
} from "@workspace/api-zod";

import { suggestFloorPrice } from "../agents/priceAdvisor.js";

const router = Router();
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL ?? "";

// دالة الإشعار
async function notifySellerViaMake(payload: any): Promise<void> {
  if (!MAKE_WEBHOOK_URL) {
    console.log("[واتساب] MAKE_WEBHOOK_URL غير مضبوط:", payload);
    return;
  }
  try {
    await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[واتساب] فشل الإرسال:", err);
  }
}

// دالة التنسيق
function formatListing(row: typeof listingsTable.$inferSelect) {
  const expiresAt = new Date(row.expires_at);
  return {
    id: row.id,
    deal_type: row.deal_type,
    wilaya: row.wilaya,
    municipality: row.municipality,
    neighborhoods: row.neighborhoods ?? [],
    asking_price: parseFloat(row.asking_price as unknown as string),
    user_phone: row.user_phone,
    property_type: row.property_type,
    area: row.area,
    rooms: row.rooms,
    facades: row.facades,
    floors: row.floors,
    garden: row.garden,
    pool: row.pool,
    created_at: row.created_at.toISOString(),
    expires_at: expiresAt.toISOString(),
    is_active: row.is_active && expiresAt > new Date(),
  };
}

// مسار إنشاء عقار جديد (تم إصلاح التعارض هنا)
router.post("/listings", async (req: Request, res: Response) => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", details: parsed.error.issues });
    return;
  }

  const {
    deal_type, wilaya, municipality, neighborhoods,
    asking_price, floor_price, user_phone,
    property_type, area, rooms, facades, floors, garden, pool,
  } = parsed.data as any;

  if (floor_price > asking_price) {
    res.status(400).json({ error: "السعر الأدنى لا يمكن أن يكون أكبر من سعر الطلب" });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + LISTING_EXPIRY_DAYS);

  const [row] = await db
    .insert(listingsTable)
    .values({
      deal_type,
      wilaya,
      municipality,
      neighborhoods: neighborhoods ?? [],
      asking_price: String(asking_price),
      floor_price: String(floor_price),
      user_phone,
      property_type,
      area,
      rooms,
      facades,
      floors,
      garden,
      pool,
      expires_at: expiresAt,
      is_active: true,
    })
    .returning();

  res.status(201).json(formatListing(row));
});

// باقي الدوال تبقى كما هي في ملفك الأصلي...
export default router;