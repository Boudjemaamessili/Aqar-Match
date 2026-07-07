"use client";

/**
 * AuthContext — طبقة المصادقة لمنصة عقار Match
 *
 * هذا الإصدار يستخدم محاكاة (mock) للـ API. للإنتاج، استبدل التطبيقات
 * الداخلية (signInWithEmail, signInWithGoogle, sendOTP, verifyOTP)
 * بنداءات فعلية إلى Supabase Auth + Edge Functions.
 *
 * خطة الترحيل إلى Supabase:
 * 1. npm install @supabase/supabase-js
 * 2. إنشاء client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 * 3. signInWithEmail → supabase.auth.signInWithPassword({ email, password })
 * 4. signInWithGoogle → supabase.auth.signInWithOAuth({ provider: 'google' })
 * 5. sendOTP → استدعاء Edge Function 'send-otp' تولّد رمز 6 أرقام
 *    وتخزّنه في جدول otp_verification مع user_id + expiry
 * 6. verifyOTP → استدعاء Edge Function 'verify-otp' تطابق الرمز
 * 7. الجدول otp_verification: { id, user_id, code_hash, expires_at, used }
 * 8. trusted_device token: تخزين JWT مشفر في localStorage بصلاحية 30 يومًا
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type UserRole = "owner" | "seeker";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  pendingEmail: string | null; // البريد الذي ينتظر 2FA
  trustedDevice: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  // المرحلة 1+2: مصادقة أولية (بريد/كلمة مرور أو Google)
  signInWithEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  // المرحلة 3: OTP
  sendOTP: (email: string) => Promise<{ ok: boolean; demoCode?: string }>;
  verifyOTP: (
    email: string,
    code: string,
    trustDevice: boolean
  ) => Promise<{ ok: boolean; error?: string; user?: User }>;
  signOut: () => void;
  // الحالة الداخلية لإعادة الضبط
  resetPending: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// === محاكاة قاعدة البيانات المحلية (للعرض التوضيحي فقط) ===
const DEMO_USERS: Array<User & { password: string }> = [
  {
    id: "u_owner_1",
    email: "owner@aqar.match",
    password: "demo1234",
    fullName: "محمد الأمين",
    role: "owner",
  },
  {
    id: "u_seeker_1",
    email: "seeker@aqar.match",
    password: "demo1234",
    fullName: "سارة بن علي",
    role: "seeker",
  },
];

const TRUSTED_DEVICE_KEY = "aqar_match_trusted_device";
const TRUSTED_DEVICE_DAYS = 30;
const OTP_TTL_SECONDS = 5 * 60; // 5 دقائق

// محاكاة تخزين الرموز مؤقتًا (في الإنتاج: جدول otp_verification في Supabase)
const otpStore = new Map<string, { code: string; expiresAt: number }>();

function generateOTP(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashString(s: string): string {
  // تشفير بسيط للـ trusted device token (في الإنتاج: استخدم JWT موقّع)
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function isTrustedDevice(): boolean {
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { token: string; expiresAt: number };
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(TRUSTED_DEVICE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function setTrustedDevice() {
  const token = hashString(
    `device_${Date.now()}_${Math.random()}`
  );
  localStorage.setItem(
    TRUSTED_DEVICE_KEY,
    JSON.stringify({
      token,
      expiresAt: Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000,
    })
  );
}

function clearTrustedDevice() {
  localStorage.removeItem(TRUSTED_DEVICE_KEY);
}

const SESSION_KEY = "aqar_match_session";

function saveSession(user: User) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// محاكاة تأخير الشبكة
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    pendingEmail: null,
    trustedDevice: false,
    isLoading: true,
  });

  // تحميل الجلسة عند البدء
  useEffect(() => {
    const u = loadSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      user: u,
      pendingEmail: null,
      trustedDevice: isTrustedDevice(),
      isLoading: false,
    });
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      await delay(900); // محاكاة استدعاء شبكة
      const found = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found || found.password !== password) {
        return { ok: false, error: "auth_invalid" };
      }
      // نجاح المصادقة الأولية — ننتقل لمرحلة 2FA
      // (إلا إذا كان الجهاز موثوقًا)
      if (isTrustedDevice()) {
        const user: User = {
          id: found.id,
          email: found.email,
          fullName: found.fullName,
          role: found.role,
        };
        saveSession(user);
        setState((s) => ({ ...s, user, pendingEmail: null }));
        return { ok: true };
      }
      setState((s) => ({ ...s, pendingEmail: found.email }));
      return { ok: true };
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    // محاكاة: في الإنتاج، نافذة OAuth تُفتح وترجع token
    await delay(1500);
    // نُرجع مستخدم تجريبي (owner) — في الإنتاج يأتي من Supabase
    const found = DEMO_USERS[0];
    if (isTrustedDevice()) {
      const user: User = {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        role: found.role,
        avatarUrl: "https://lh3.googleusercontent.com/a/default",
      };
      saveSession(user);
      setState((s) => ({ ...s, user, pendingEmail: null }));
      return { ok: true };
    }
    setState((s) => ({ ...s, pendingEmail: found.email }));
    return { ok: true };
  }, []);

  const sendOTP = useCallback(async (email: string) => {
    await delay(700);
    const code = generateOTP();
    otpStore.set(email, {
      code,
      expiresAt: Date.now() + OTP_TTL_SECONDS * 1000,
    });
    // في الإنتاج: Edge Function تُرسل الرمز عبر البريد
    // هنا نُرجعه للعرض التوضيحي فقط
    console.info(`[DEMO] OTP for ${email}: ${code}`);
    return { ok: true, demoCode: code };
  }, []);

  const verifyOTP = useCallback(
    async (email: string, code: string, trustDevice: boolean) => {
      await delay(700);
      const record = otpStore.get(email);
      if (!record) {
        return { ok: false, error: "otp_invalid" };
      }
      if (Date.now() > record.expiresAt) {
        otpStore.delete(email);
        return { ok: false, error: "otp_invalid" };
      }
      if (record.code !== code) {
        return { ok: false, error: "otp_invalid" };
      }
      otpStore.delete(email);

      // نجاح — ننشئ الجلسة
      const found = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (!found) {
        return { ok: false, error: "auth_invalid" };
      }
      const user: User = {
        id: found.id,
        email: found.email,
        fullName: found.fullName,
        role: found.role,
      };
      saveSession(user);
      if (trustDevice) setTrustedDevice();

      setState((s) => ({ ...s, user, pendingEmail: null, trustedDevice: trustDevice }));
      return { ok: true, user };
    },
    []
  );

  const signOut = useCallback(() => {
    clearSession();
    clearTrustedDevice();
    setState({
      user: null,
      pendingEmail: null,
      trustedDevice: false,
      isLoading: false,
    });
  }, []);

  const resetPending = useCallback(() => {
    setState((s) => ({ ...s, pendingEmail: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signInWithEmail,
        signInWithGoogle,
        sendOTP,
        verifyOTP,
        signOut,
        resetPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { OTP_TTL_SECONDS };
