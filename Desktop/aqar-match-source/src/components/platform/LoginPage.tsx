"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLang } from "./LanguageContext";
import { useAuth, OTP_TTL_SECONDS } from "./AuthContext";
import { OTPInput, CountdownTimer } from "./OTPInput";
import { PlatformButton } from "./PlatformButton";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Home as HomeIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = "entry" | "otp" | "redirect" | "success";

export function LoginPage({
  onBackHome,
  onAuthSuccess,
}: {
  onBackHome: () => void;
  onAuthSuccess: (role: "owner" | "seeker") => void;
}) {
  const { t, dir } = useLang();
  const { signInWithEmail, signInWithGoogle, sendOTP, verifyOTP, resetPending, pendingEmail } =
    useAuth();

  const [stage, setStage] = useState<Stage>("entry");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // حالة 2FA
  const [otp, setOtp] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpResetKey, setOtpResetKey] = useState(0);
  const [redirectRole, setRedirectRole] = useState<"owner" | "seeker" | null>(null);

  const triggerSendOTP = useCallback(
    async (targetEmail: string) => {
      setError(null);
      setOtp("");
      setOtpExpired(false);
      setResendCountdown(60); // لا يمكن إعادة الإرسال قبل 60 ثانية
      const res = await sendOTP(targetEmail);
      if (res.ok) {
        setDemoCode(res.demoCode ?? null);
        setOtpResetKey((k) => k + 1);
      } else {
        setError("auth_failed_2fa");
      }
    },
    [sendOTP]
  );

  // عند تغيّر pendingEmail من AuthContext (بعد نجاح الدخول) → انتقل لمرحلة OTP
  useEffect(() => {
    if (pendingEmail && stage === "entry") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEmail(pendingEmail);
      triggerSendOTP(pendingEmail);
      setStage("otp");
    }
  }, [pendingEmail, stage, triggerSendOTP]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;
    setLoading(true);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "auth_invalid");
      return;
    }
    // إذا عاد ok=true ولم يكن هناك pendingEmail فهذا يعني أن الجهاز موثوق
    // وتولّى AuthContext إنشاء الجلسة — ننتقل للتوجيه مباشرة
    if (!pendingEmail) {
      // الجلسة أُنشئت — اقرأ الدور من useAuth
      // سنأخذ الدور من معلومات المستخدم المخزنة
      const session = localStorage.getItem("aqar_match_session");
      if (session) {
        const user = JSON.parse(session);
        setRedirectRole(user.role);
        setStage("redirect");
      }
    }
    // وإلا، useEffect سينتقل بنا لمرحلة OTP تلقائيًا
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (!res.ok) {
      setError(res.error || "auth_invalid");
      return;
    }
    if (!pendingEmail) {
      const session = localStorage.getItem("aqar_match_session");
      if (session) {
        const user = JSON.parse(session);
        setRedirectRole(user.role);
        setStage("redirect");
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (otp.length !== 6) return;
    setLoading(true);
    const res = await verifyOTP(email, otp, trustDevice);
    setLoading(false);
    if (!res.ok || !res.user) {
      setError(res.error || "otp_invalid");
      return;
    }
    setRedirectRole(res.user.role);
    setStage("redirect");
  };

  const handleResend = () => {
    if (resendCountdown > 0) return;
    triggerSendOTP(email);
  };

  const handleBackToEntry = () => {
    resetPending();
    setStage("entry");
    setOtp("");
    setError(null);
    setDemoCode(null);
  };

  // عداد إعادة الإرسال
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => {
      setResendCountdown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  // التوجيه التلقائي بعد عرض رسالة النجاح
  useEffect(() => {
    if (stage !== "redirect" || !redirectRole) return;
    const id = setTimeout(() => {
      onAuthSuccess(redirectRole);
    }, 2200);
    return () => clearTimeout(id);
  }, [stage, redirectRole, onAuthSuccess]);

  const PrevIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <main className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-white via-[var(--gold)]/5 to-white">
      <div className="w-full max-w-md">
        {/* زر العودة للرئيسية */}
        <button
          onClick={onBackHome}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-[var(--navy)] mb-6 transition mx-auto"
        >
          <HomeIcon className="w-4 h-4" />
          {t("back_home")}
        </button>

        {/* بطاقة الدخول */}
        <div className="bg-white rounded-2xl shadow-xl border border-border/50 overflow-hidden">
          {/* رأس البطاقة — شعار */}
          <div className="bg-[var(--navy)] px-8 pt-8 pb-6 text-center">
            <h1 className="flex items-baseline justify-center gap-1 text-3xl font-extrabold mb-2">
              <span className="text-white">{t("brand_aqar")}</span>
              <span className="text-[var(--gold)]">{t("brand_match")}</span>
            </h1>
            <div className="w-12 h-0.5 bg-[var(--gold)] mx-auto opacity-60" />
          </div>

          <div className="p-6 md:p-8">
            {/* === المرحلة 1: Entry (البريد + كلمة المرور + Google) === */}
            {stage === "entry" && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-extrabold text-[var(--navy)] mb-1">
                    {t("login_welcome")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("login_subtitle")}
                  </p>
                </div>

                {/* زر Google — بارز في الأعلى */}
                <PlatformButton
                  variant="gray"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full gap-3 py-3.5 border-2 border-border hover:border-[var(--gold)]/50"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  <span className="font-bold">{t("login_google")}</span>
                </PlatformButton>

                {/* فاصل "أو" */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-medium uppercase">
                    {t("login_or")}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* نموذج البريد + كلمة المرور */}
                <form onSubmit={handleEmailSignIn} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t("login_email")}
                    </label>
                    <div className="relative">
                      <Mail className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("login_email_ph")}
                        dir="ltr"
                        required
                        className="w-full ps-10 pe-3 py-3 rounded-lg border-2 border-border bg-white text-sm text-foreground focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      {t("login_password")}
                    </label>
                    <div className="relative">
                      <Lock className="absolute top-1/2 -translate-y-1/2 start-3 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("login_password_ph")}
                        dir="ltr"
                        required
                        className="w-full ps-10 pe-10 py-3 rounded-lg border-2 border-border bg-white text-sm text-foreground focus:outline-none focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/20 transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute top-1/2 -translate-y-1/2 end-3 text-muted-foreground hover:text-foreground"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-border text-[var(--gold)] focus:ring-[var(--gold)]"
                      />
                      <span className="text-muted-foreground">
                        {t("login_remember")}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-[var(--navy)] hover:text-[var(--gold)] font-medium"
                    >
                      {t("login_forgot")}
                    </button>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t(error)}</span>
                    </div>
                  )}

                  <PlatformButton
                    type="submit"
                    variant="gold"
                    disabled={loading || !email || !password}
                    className="w-full py-3.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("auth_redirecting")}
                      </>
                    ) : (
                      t("login_signin_btn")
                    )}
                  </PlatformButton>
                </form>

                {/* رابط التسجيل */}
                <p className="text-center text-sm text-muted-foreground">
                  {t("login_no_account")}{" "}
                  <button className="text-[var(--navy)] hover:text-[var(--gold)] font-bold">
                    {t("login_signup_link")}
                  </button>
                </p>

                {/* تنبيه أمني */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Shield className="w-3.5 h-3.5 text-[var(--gold)]" />
                  <span>{t("login_secure_note")}</span>
                </div>

                {/* تنبيه: بيانات تجريبية للمطور */}
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800" dir="ltr">
                  <p className="font-bold mb-1">Demo accounts (mock auth):</p>
                  <p>owner@aqar.match / demo1234 → Owner role</p>
                  <p>seeker@aqar.match / demo1234 → Seeker role</p>
                </div>
              </div>
            )}

            {/* === المرحلة 3: 2FA (OTP) === */}
            {stage === "otp" && (
              <div className="space-y-5">
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-full bg-[var(--gold)]/10 flex items-center justify-center">
                      <Shield className="w-7 h-7 text-[var(--gold)]" />
                    </div>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-[var(--navy)] mb-1">
                    {t("otp_title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {t("otp_subtitle")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("otp_sent_to")}{" "}
                    <span className="font-bold text-foreground" dir="ltr">
                      {email}
                    </span>
                  </p>
                  {demoCode && (
                    <div
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 border border-yellow-300 text-xs text-yellow-900 font-bold"
                      dir="ltr"
                    >
                      <span>Demo code:</span>
                      <span className="font-mono tracking-wider">{demoCode}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-5">
                  {/* عداد تنازلي لصلاحية الرمز */}
                  <div className="text-center text-sm">
                    {otpExpired ? (
                      <span className="text-red-600 font-medium">
                        {t("otp_invalid")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {t("otp_expires_in")}{" "}
                        <CountdownTimer
                          seconds={OTP_TTL_SECONDS}
                          onExpire={() => setOtpExpired(true)}
                          resetKey={otpResetKey}
                        />
                      </span>
                    )}
                  </div>

                  {/* حقل OTP */}
                  <OTPInput
                    value={otp}
                    onChange={setOtp}
                    disabled={loading || otpExpired}
                  />

                  {/* مربع الثقة بالجهاز */}
                  <label className="flex items-center gap-2 cursor-pointer justify-center">
                    <input
                      type="checkbox"
                      checked={trustDevice}
                      onChange={(e) => setTrustDevice(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-[var(--gold)] focus:ring-[var(--gold)]"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("otp_trust_device")}
                    </span>
                  </label>

                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{t(error)}</span>
                    </div>
                  )}

                  <PlatformButton
                    type="submit"
                    variant="gold"
                    disabled={loading || otp.length !== 6 || otpExpired}
                    className="w-full py-3.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("auth_redirecting")}
                      </>
                    ) : (
                      t("otp_verify")
                    )}
                  </PlatformButton>
                </form>

                {/* إعادة الإرسال */}
                <div className="text-center text-sm">
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground">
                      {t("otp_resend_in")}{" "}
                      <span className="font-mono font-bold text-[var(--navy)]">
                        0:{String(resendCountdown).padStart(2, "0")}
                      </span>
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-[var(--navy)] hover:text-[var(--gold)] font-bold"
                    >
                      {t("otp_resend")}
                    </button>
                  )}
                </div>

                {/* العودة */}
                <div className="flex items-center justify-between pt-3 border-t border-border text-sm">
                  <button
                    onClick={handleBackToEntry}
                    className="flex items-center gap-1.5 text-muted-foreground hover:text-[var(--navy)]"
                  >
                    <PrevIcon className="w-4 h-4" />
                    {t("otp_back")}
                  </button>
                  <button
                    onClick={handleBackToEntry}
                    className="text-[var(--navy)] hover:text-[var(--gold)] font-medium"
                  >
                    {t("otp_change_email")}
                  </button>
                </div>
              </div>
            )}

            {/* === المرحلة 4: Redirect (التوجيه الذكي) === */}
            {stage === "redirect" && redirectRole && (
              <div className="space-y-5 text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-green-600" />
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-[var(--navy)]">
                  {t("auth_success")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {redirectRole === "owner"
                    ? t("redirect_owner")
                    : t("redirect_seeker")}
                </p>
                <div className="flex justify-center pt-4">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--gold)]" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* تذييل البطاقة — أمان */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {t("login_secure_note")}
        </p>
      </div>
    </main>
  );
}

/** أيقونة Google الرسمية */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
