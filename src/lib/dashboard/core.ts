/**
 * نواة لوحة التحكم النقية — أنواع الحمولة + المصنع الفارغ.
 * بلا Prisma: عقارات اللوحة تُسلسَل في serializers.ts، وباقي الأقسام
 * تُعيد استخدام مسلسِلات المرحلة 5 المعتمدة (أنواع هنا فقط).
 */
import type {
  BuyerMatchView,
  PublicSearchRequest,
  SellerMatchView
} from '@/lib/matches/serializers';
import type {DashboardProperty} from './serializers';

export interface DashboardSummary {
  readonly propertiesCount: number;
  readonly searchesCount: number;
  /// مطابقات المستخدم على الجهتين (كمشتري + كبائع)
  readonly matchesCount: number;
  /// ما ينتظر ردّ بائع ضمن مهلة الـ 48 ساعة (الجهتان)
  readonly pendingCount: number;
}

export interface DashboardData {
  readonly properties: readonly DashboardProperty[];
  readonly searches: readonly PublicSearchRequest[];
  readonly matches: readonly BuyerMatchView[];
  readonly sellerMatches: readonly SellerMatchView[];
  readonly summary: DashboardSummary;
}

/** حمولة فارغة نظيفة — لا مستخدم/لا جلسة/رقم غير صالح (حسب عقد المرحلة 6) */
export function emptyDashboardData(): DashboardData {
  return {
    properties: [],
    searches: [],
    matches: [],
    sellerMatches: [],
    summary: {propertiesCount: 0, searchesCount: 0, matchesCount: 0, pendingCount: 0}
  };
}

