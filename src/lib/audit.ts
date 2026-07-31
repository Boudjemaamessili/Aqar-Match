/**
 * سجل التدقيق الأمني — كتابة غير قاتلة (لا يُسقط العملية الأساسية عند فشله).
 */
import {prisma} from '@/lib/prisma';
import type {Prisma} from '@prisma/client';

export interface AuditEntry {
  readonly actorId?: string | null;
  readonly action: string;
  readonly entity: string;
  readonly entityId?: string | null;
  readonly metadata?: Prisma.InputJsonValue;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        metadata: entry.metadata
      }
    });
  } catch (error: unknown) {
    console.error('[audit] فشل تسجيل الحدث:', entry.action, error);
  }
}
