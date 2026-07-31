/**
 * GET /api/matches/:id/contact — كشف التواصل للطرفين (بعد CONTACT_REVEALED فقط).
 *
 * المستدعي يرى الطرف المقابل فقط:
 *   المشتري ← ownerName/ownerPhone المصرَّح بهما على العقار
 *   البائع  ← اسم/هاتف حساب المشتري
 * قبل الكشف: 403 CONTACT_NOT_REVEALED دائماً — بلا استثناءات.
 */
import type {NextRequest} from 'next/server';
import {ApiError, ok, withApi} from '@/lib/api/http';
import {requireUser} from '@/lib/auth/guards';
import {hitRateLimit, secondsUntilReset} from '@/lib/auth/rate-limit';
import {CONTACT_READ_RATE_LIMIT} from '@/lib/matches/constants';
import {toContactReveal} from '@/lib/matches/serializers';
import {getMatchForParty} from '@/lib/matches/service';
import {prisma} from '@/lib/prisma';

export const runtime = 'nodejs';

type Props = {params: Promise<{id: string}>};

export const GET = withApi(async (request: NextRequest, {params}: Props) => {
  const {user} = await requireUser(request);

  const rate = hitRateLimit(
    `match:contact:${user.id}`,
    CONTACT_READ_RATE_LIMIT.limit,
    CONTACT_READ_RATE_LIMIT.windowMs
  );
  if (!rate.allowed) {
    throw new ApiError(429, 'RATE_LIMITED', 'محاولات كثيرة — أعد المحاولة لاحقاً', {
      retryAfterSeconds: secondsUntilReset(rate.resetAt)
    });
  }

  const {id} = await params;
  const {match, party} = await getMatchForParty(id, user);

  if (match.status !== 'CONTACT_REVEALED' || match.revealedAt === null) {
    throw new ApiError(403, 'CONTACT_NOT_REVEALED', 'التواصل لا يُكشف إلا بعد اكتمال الموافقة والدفع');
  }

  if (party === 'buyer') {
    const property = await prisma.property.findUnique({
      where: {id: match.propertyId},
      select: {ownerName: true, ownerPhone: true}
    });
    if (!property?.ownerPhone) {
      throw new ApiError(500, 'INTERNAL', 'بيانات تواصل المالك غير متوفرة');
    }
    return ok(toContactReveal(match.id, match.revealedAt, {
      name: property.ownerName,
      phone: property.ownerPhone
    }));
  }

  const buyer = await prisma.user.findUnique({
    where: {id: match.buyerId},
    select: {name: true, phone: true}
  });
  if (!buyer) {
    throw new ApiError(500, 'INTERNAL', 'بيانات المشتري غير متوفرة');
  }
  return ok(toContactReveal(match.id, match.revealedAt, {name: buyer.name, phone: buyer.phone}));
});
