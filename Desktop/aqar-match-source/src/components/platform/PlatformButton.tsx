"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "gold" | "gray" | "text" | "navy";

interface PlatformButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const PlatformButton = forwardRef<
  HTMLButtonElement,
  PlatformButtonProps
>(({ variant = "gold", className, children, disabled, ...props }, ref) => {
  const variants: Record<Variant, string> = {
    gold:
      "bg-[var(--gold)] text-[var(--navy)] font-bold hover:bg-[var(--gold-dark)] hover:text-white shadow-sm",
    gray: "bg-gray-200 text-gray-800 font-medium hover:bg-gray-300",
    text: "text-[var(--navy)] underline hover:text-[var(--gold)] bg-transparent shadow-none",
    navy:
      "bg-[var(--navy)] text-white font-bold hover:bg-[var(--navy-light)] shadow-sm",
  };

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 min-h-12 text-sm md:text-base transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-inherit disabled:hover:text-inherit",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

PlatformButton.displayName = "PlatformButton";
