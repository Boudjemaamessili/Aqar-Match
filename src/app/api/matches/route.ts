/**
 * GET /api/matches?role=buyer|seller — صندوق مطابقات المستخدم.
 *   buyer  ← طلبات بحثه (بطاقات عامة + درجة عرض)
 *   seller ← عقاراته المرتبطة (رسومه + المهلة — بلا ميزانية المشتري أبداً)
 * كنس كسول بنطاق الدور قبل القراءة. أسماء المشترين تُقنَّع قبل الكشف.
 * معامل role يُتحقق بـ Zod (أي قيمة أخرى = 400) + محدد معدل قراءة لكل مستخدم.
 */
import type {NextRequest} from 'next/server';
import {ApiError, ok, withApi} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {MATCHES_INBOX_MAX_ITEMS, MATCHES_READ_RATE_LIMIT} from '@/lib/matches/constants';
import {matchesInboxQuerySchema} from '@/lib/matches/schemas';
import {toBuyerMatchView, toSellerMatchView} from '@/lib/matches/serializers';
import {expireOverdueMatches, matchIncludeForBuyerClause} from '@/lib/matches/service';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

export const GET = withApi(async (request: NextRequest) => {
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `matches:read:${user.id}`,
    MATCHES_READ_RATE_LIMIT.limit,
    MATCHES_READ_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات قراءة كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  // تحقق صارم للمعامل — القيم غير المصرّح بها تُرفض ولا تُفسَّر بصمت
  const {role} = matchesInboxQuerySchema.parse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );

  if (role === 'seller') {
    await expireOverdueMatches({sellerId: user.id});
    const matches = await prisma.match.findMany({
      where: {sellerId: user.id},
      orderBy: {createdAt: 'desc'},
      take: MATCHES_INBOX_MAX_ITEMS,
      include: {
        property: {include: {images: {orderBy: {sortOrder: 'asc'}, take: 1}}},
        searchRequest: true,
        buyer: {select: {name: true}}
      }
    });
    return ok({
      role: 'seller',
      items: matches.map((m) => toSellerMatchView(m, m.buyer.name)),
      count: matches.length
    });
  }

  await expireOverdueMatches({buyerId: user.id});
  const matches = await prisma.match.findMany({
    where: {buyerId: user.id},
    orderBy: {createdAt: 'desc'},
    take: MATCHES_INBOX_MAX_ITEMS,
    include: matchIncludeForBuyerClause
  });
  return ok({role: 'buyer', items: matches.map(toBuyerMatchView), count: matches.length});
});
