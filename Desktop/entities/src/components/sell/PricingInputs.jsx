import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Tag } from "lucide-react";
import { formatPrice } from "@/lib/algeriaData";

export default function PricingInputs({ targetPrice, secretMinPrice, onTargetChange, onSecretChange, transactionType }) {
  const label = transactionType === "rent" ? "شهرياً" : "";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="font-heading text-sm flex items-center gap-2">
          <Tag className="w-4 h-4 text-secondary" />
          السعر المطلوب {label} (دج) *
        </Label>
        <Input
          type="number"
          placeholder="مثال: 15000000"
          value={targetPrice || ""}
          onChange={(e) => onTargetChange(e.target.value)}
          className="text-left text-lg font-mono"
          dir="ltr"
        />
        {targetPrice && (
          <p className="text-xs text-muted-foreground">{formatPrice(Number(targetPrice))}</p>
        )}
      </div>

      <div className="space-y-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
        <Label className="font-heading text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-destructive" />
          الحد الأدنى السري {label} (دج) *
        </Label>
        <Input
          type="number"
          placeholder="مثال: 12000000"
          value={secretMinPrice || ""}
          onChange={(e) => onSecretChange(e.target.value)}
          className="text-left text-lg font-mono"
          dir="ltr"
        />
        {secretMinPrice && (
          <p className="text-xs text-muted-foreground">{formatPrice(Number(secretMinPrice))}</p>
        )}
        <p className="text-xs text-destructive/80 mt-2 font-body">
          🔒 هذا الرقم سري ومشفّر بالكامل — لن يظهر لأي مشتري أو طرف ثالث
        </p>
      </div>

      {targetPrice && secretMinPrice && Number(secretMinPrice) > Number(targetPrice) && (
        <p className="text-sm text-destructive font-body">
          ⚠️ الحد الأدنى لا يمكن أن يتجاوز السعر المطلوب
        </p>
      )}
    </div>
  );
}