"use client";

import { Lock, AlertTriangle, Lightbulb, Info } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "secure" | "warning" | "tip" | "info";

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  const config = {
    secure: {
      icon: Lock,
      bg: "bg-[var(--gold)]/10",
      border: "border-[var(--gold)]/30",
      text: "text-[var(--navy)]",
      iconColor: "text-[var(--gold)]",
    },
    warning: {
      icon: AlertTriangle,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-yellow-900",
      iconColor: "text-yellow-600",
    },
    tip: {
      icon: Lightbulb,
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-900",
      iconColor: "text-blue-500",
    },
    info: {
      icon: Info,
      bg: "bg-muted",
      border: "border-border",
      text: "text-foreground",
      iconColor: "text-muted-foreground",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-3 rounded-lg border text-sm",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.iconColor)} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
