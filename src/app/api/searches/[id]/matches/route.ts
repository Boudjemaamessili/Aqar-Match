/**
 * GET /api/searches/:id/matches — مطابقات طلب بحث يملكه المستدعي.
 * يطبّق الكنس الكسول أولاً (تعتيم المنتهية 48 س) بنطاق المشتري فقط.
 */
import type {NextRequest} from 'next/server';
import {ApiError, ok, withApi} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {MATCHES_INBOX_MAX_ITEMS, SEARCH_READ_RATE_LIMIT} from '@/lib/matches/constants';
import {toBuyerMatchView} from '@/lib/matches/serializers';
import {expireOverdueMatches, matchIncludeForBuyerClause} from '@/lib/matches/service';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

type Props = {params: Promise<{id: string}>};

export const GET = withApi(async (request: NextRequest, {params}: Props) => {
  const {user} = await requireUser(request);

  const readRate = hitRateLimit(
    `search:read:${user.id}`,
    SEARCH_READ_RATE_LIMIT.limit,
    SEARCH_READ_RATE_LIMIT.windowMs
  );
  if (!readRate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'طلبات قراءة كثيرة — أعد المحاولة بعد قليل', {
      retryAfterSeconds: secondsUntilReset(readRate.resetAt)
    });
  }

  const {id} = await params;

  const search = await prisma.searchRequest.findUnique({where: {id}, select: {buyerId: true}});
  if (!search) {
    throw new ApiError(404, 'SEARCH_NOT_FOUND', 'طلب البحث غير موجود');
  }
  if (search.buyerId !== user.id) {
    throw new ApiError(403, 'FORBIDDEN', 'طلب البحث هذا لا يخصك');
  }

  await expireOverdueMatches({buyerId: user.id});

  const matches = await prisma.match.findMany({
    where: {searchRequestId: id},
    orderBy: {internalScore: 'desc'},
    take: MATCHES_INBOX_MAX_ITEMS,
    include: matchIncludeForBuyerClause
  });

  return ok({items: matches.map(toBuyerMatchView), count: matches.length});
});
