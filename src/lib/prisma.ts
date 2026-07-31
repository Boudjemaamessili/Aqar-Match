import {PrismaClient} from '@prisma/client';

const globalForPrisma = globalThis as unknown as {prisma?: PrismaClient};

/**
 * عميل Prisma الوحيد (singleton) — يمنع استنزاف الاتصالات مع hot-reload.
 *
 * ⚠️ قاعدة أمنية: حقول مثل Property.secretMin و Match.internalScore و
 *    تفصيل النقاط "server-only". لا تُعَد نتائج Prisma كما هي إلى العميل
 *    أبداً — تمر حتماً عبر محوّلات (serializers) صريحة في طبقة الـ API
 *    (المرحلتان 4–5).
 */
export const prisma: PrismaClient = (globalForPrisma.prisma ??= new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
}));
