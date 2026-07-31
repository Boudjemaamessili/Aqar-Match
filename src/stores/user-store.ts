'use client';

/**
 * مخزن المستخدم (Zustand) — مصدر الحقيقة في الواجهة العميلة لهوية المسجَّل.
 * يُحقن من مكوّن خادم بعد التحقق الحقيقي من الجلسة (hydrate-once)،
 * وتقرأه المكوّنات العميلة (لوحة التحكم…) دون إعادة جلب /api/auth/me.
 */
import {create} from 'zustand';
import type {PublicUser} from '@/lib/auth/serializers';

interface UserStoreState {
  /// null = زائر مجهول (أو قبل الحقن الأول — انظر hydrated)
  readonly user: PublicUser | null;
  /// هل حُقن المخزن من جلسة موثوقة؟ يميّز «مجهل» عن «لم يُحمَّل بعد»
  readonly hydrated: boolean;
  readonly setUser: (user: PublicUser | null) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({user, hydrated: true})
}));
