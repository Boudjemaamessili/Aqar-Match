"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

// تحويل سلسلة إلى مصفوفة بطول محدد (مع تعبئة بالخانات الفارغة)
function toPaddedArray(value: string, length: number): string[] {
  const chars = value.split("");
  const result: string[] = [];
  for (let i = 0; i < length; i++) {
    result[i] = chars[i] || "";
  }
  return result;
}

/**
 * مكوّن إدخال رمز OTP بـ 6 خانات
 * - ينتقل تلقائيًا بين الخانات
 * - يدعم اللصق
 * - يدعم الحذف بالرجوع للخلف
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  autoFocus = true,
}: OTPInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [localValue, setLocalValue] = useState<string[]>(() =>
    toPaddedArray(value, length)
  );

  useEffect(() => {
    setLocalValue(toPaddedArray(value, length));
  }, [value, length]);

  useEffect(() => {
    if (autoFocus && inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, [autoFocus]);

  const focusInput = (idx: number) => {
    if (idx >= 0 && idx < length && inputsRef.current[idx]) {
      inputsRef.current[idx]?.focus();
      inputsRef.current[idx]?.select();
    }
  };

  const handleChange = (idx: number, val: string) => {
    if (disabled) return;
    // قبول رقم واحد فقط
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...localValue];
    next[idx] = digit;
    setLocalValue(next);
    onChange(next.join(""));
    if (digit && idx < length - 1) {
      focusInput(idx + 1);
    }
  };

  const handleKeyDown = (idx: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Backspace") {
      if (localValue[idx]) {
        // مسح الخانة الحالية
        const next = [...localValue];
        next[idx] = "";
        setLocalValue(next);
        onChange(next.join(""));
      } else if (idx > 0) {
        // الرجوع للخانة السابقة ومسحها
        focusInput(idx - 1);
        const next = [...localValue];
        next[idx - 1] = "";
        setLocalValue(next);
        onChange(next.join(""));
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(e.key === "ArrowLeft" ? idx - 1 : idx + 1);
    } else if (e.key === "Enter") {
      // السماح للنموذج بإرسال
      return;
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      const next = toPaddedArray(pasted, length);
      setLocalValue(next);
      onChange(next.join(""));
      focusInput(Math.min(pasted.length, length - 1));
    }
  };

  return (
    <div
      className="flex gap-2 md:gap-3 justify-center"
      dir="ltr"
      role="group"
      aria-label="OTP code input"
    >
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={localValue[idx] || ""}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Digit ${idx + 1}`}
          className={cn(
            "w-11 h-14 md:w-14 md:h-16 text-center text-2xl md:text-3xl font-bold rounded-xl border-2 transition-all",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2",
            "bg-white",
            localValue[idx]
              ? "border-[var(--gold)] bg-[var(--gold)]/5 text-[var(--navy)]"
              : "border-border text-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
      ))}
    </div>
  );
}

/**
 * عداد تنازلي بصيغة MM:SS
 */
export function CountdownTimer({
  seconds,
  onExpire,
  resetKey,
}: {
  seconds: number;
  onExpire?: () => void;
  resetKey?: unknown; // تغييره يعيد التشغيل
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(seconds);
  }, [seconds, resetKey]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    const id = setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [remaining, onExpire]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <span
      className={cn(
        "font-mono font-bold tabular-nums",
        remaining <= 30 ? "text-red-600" : "text-[var(--navy)]"
      )}
    >
      {mm}:{ss}
    </span>
  );
}
