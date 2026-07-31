/**
 * مسلسِلات الاستجابة — الحد الفاصل بين نماذج DB والعميل.
 * لا يخرج أي حقل حسّاس من هنا (القاعدة الذهبية نفسها لـ secretMin لاحقاً).
 */
import type {User} from '@prisma/client';

export interface PublicUser {
  readonly id: string;
  readonly phone: string;
  readonly name: string | null;
  readonly role: User['role'];
  readonly preferredLocale: string;
  readonly isVerifiedAgency: boolean;
  readonly agencyName: string | null;
  readonly createdAt: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    role: user.role,
    preferredLocale: user.preferredLocale,
    isVerifiedAgency: user.isVerifiedAgency,
    agencyName: user.agencyName,
    createdAt: user.createdAt.toISOString()
  };
}
