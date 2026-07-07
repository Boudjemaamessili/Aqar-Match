"use client";

import { Fragment } from "react";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import { useLang } from "./LanguageContext";
import { cn } from "@/lib/utils";

export function Stepper({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  const { dir } = useLang();
  const ArrowIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-2">
      <div className="flex items-center justify-between min-w-[480px] md:min-w-0">
        {Array.from({ length: total }).map((_, idx) => {
          const stepNum = idx + 1;
          const isCurrent = stepNum === current;
          const isDone = stepNum < current;
          const isFuture = stepNum > current;
          return (
            <Fragment key={idx}>
              <div className="flex flex-col items-center gap-1.5 md:gap-2">
                <div
                  className={cn(
                    "w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center font-bold text-sm md:text-base transition-colors",
                    isCurrent && "bg-[var(--gold)] text-[var(--navy)] ring-4 ring-[var(--gold)]/20",
                    isDone && "bg-[var(--navy)] text-[var(--gold)]",
                    isFuture && "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="w-4 h-4 md:w-5 md:h-5" /> : stepNum}
                </div>
                <span
                  className={cn(
                    "text-[10px] md:text-xs font-medium text-center max-w-[80px] leading-tight",
                    isCurrent
                      ? "text-[var(--navy)] font-bold"
                      : isDone
                      ? "text-[var(--navy)]"
                      : "text-muted-foreground"
                  )}
                >
                  {labels[idx]}
                </span>
              </div>
              {idx < total - 1 && (
                <div className="flex-1 h-0.5 mx-1 md:mx-2 bg-muted relative">
                  {isDone && (
                    <div className="absolute inset-0 bg-[var(--gold)]" />
                  )}
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
