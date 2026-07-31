/**
 * خدمة لوحة التحكم — تجميع نشاط المستخدم (server-only).
 *
 * الشكل:
 *   properties    ← عقاراته كبائع (sellerId)
 *   searches      ← طلبات بحثه كمشتري (buyerId) + عدّادات
 *   matches       ← مطابقات مرتبطة بطلبات بحثه (كما يراها المشتري)
 *   sellerMatches ← مطابقات واردة على عقاراته (كما يراها البائع)
 *   summary       ← عدّادات دقيقة من DB (وليست طول المصفوفات المقتطعة)
 *
 * أداء: كنس كسول للمنتهية على الجهتين، ثم 8 استعلامات في معاملة واحدة —
 * لا N+1 إطلاقاً. أمان: كل الخرج يمرّ عبر المسلسِلات المعتمدة حصراً
 * (secretMin / maxBudget / الهوية الصريحة لا تخرج — انظر serializers).
 */
import type {User} from '@prisma/client';
import {prisma} from '@/lib/prisma';
import {
  toBuyerMatchView,
  toPublicSearchRequest,
  toSellerMatchView
} from '@/lib/matches/serializers';
import {expireOverdueMatches, matchIncludeForBuyerClause} from '@/lib/matches/service';
import {
  DASHBOARD_MATCHES_MAX_ITEMS,
  DASHBOARD_PROPERTIES_MAX_ITEMS,
  DASHBOARD_SEARCHES_MAX_ITEMS
} from './constants';
import {emptyDashboardData, type DashboardData} from './core';
import {toDashboardProperty} from './serializers';

export {emptyDashboardData};
export type {DashboardData, DashboardSummary} from './core';

export async function getDashboardData(user: User): Promise<DashboardData> {
  // الكنس الكسول (قرار المستخدم في المرحلة 5): العدادات تُقرأ بعده لتكون طازجة
  await expireOverdueMatches({buyerId: user.id});
  await expireOverdueMatches({sellerId: user.id});

  const [
    properties,
    searches,
    buyerMatches,
    sellerMatches,
    propertiesCount,
    searchesCount,
    matchesCount,
    pendingCount
  ] = await prisma.$transaction([
    prisma.property.findMany({
      where: {sellerId: user.id},
      orderBy: {createdAt: 'desc'},
      take: DASHBOARD_PROPERTIES_MAX_ITEMS,
      include: {
        wilaya: {select: {code: true, nameAr: true, nameFr: true}},
        commune: {select: {id: true, nameAr: true, nameFr: true}},
        images: {orderBy: {sortOrder: 'asc'}, take: 1},
        _count: {select: {matches: true, images: true}}
      }
    }),
    prisma.searchRequest.findMany({
      where: {buyerId: user.id},
      orderBy: {createdAt: 'desc'},
      take: DASHBOARD_SEARCHES_MAX_ITEMS,
      include: {
        _count: {select: {matches: true}},
        matches: {where: {status: 'SELLER_NOTIFIED'}, select: {id: true}}
      }
    }),
    prisma.match.findMany({
      where: {buyerId: user.id},
      orderBy: {createdAt: 'desc'},
      take: DASHBOARD_MATCHES_MAX_ITEMS,
      include: matchIncludeForBuyerClause
    }),
    prisma.match.findMany({
      where: {sellerId: user.id},
      orderBy: {createdAt: 'desc'},
      take: DASHBOARD_MATCHES_MAX_ITEMS,
      include: {
        property: {include: {images: {orderBy: {sortOrder: 'asc'}, take: 1}}},
        searchRequest: true,
        buyer: {select: {name: true}}
      }
    }),
    prisma.property.count({where: {sellerId: user.id}}),
    prisma.searchRequest.count({where: {buyerId: user.id}}),
    prisma.match.count({where: {OR: [{buyerId: user.id}, {sellerId: user.id}]}}),
    prisma.match.count({
      where: {OR: [{buyerId: user.id}, {sellerId: user.id}], status: 'SELLER_NOTIFIED'}
    })
  ]);

  return {
    properties: properties.map(toDashboardProperty),
    searches: searches.map((s) => toPublicSearchRequest(s, s.matches.length)),
    matches: buyerMatches.map(toBuyerMatchView),
    sellerMatches: sellerMatches.map((m) => toSellerMatchView(m, m.buyer.name)),
    summary: {propertiesCount, searchesCount, matchesCount, pendingCount}
  };
}
