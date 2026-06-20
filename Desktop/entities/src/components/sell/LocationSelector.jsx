import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WILAYAS, COMMUNES_BY_WILAYA } from "@/lib/algeriaData";

export default function LocationSelector({ wilaya, commune, onWilayaChange, onCommuneChange }) {
  const communes = wilaya ? (COMMUNES_BY_WILAYA[wilaya] || []) : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="font-heading text-sm">الولاية *</Label>
        <Select value={wilaya || ""} onValueChange={(v) => { onWilayaChange(v); onCommuneChange(""); }}>
          <SelectTrigger><SelectValue placeholder="اختر الولاية" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {WILAYAS.map(w => (
              <SelectItem key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">البلدية *</Label>
        <Select value={commune || ""} onValueChange={onCommuneChange} disabled={!wilaya}>
          <SelectTrigger><SelectValue placeholder={wilaya ? "اختر البلدية" : "اختر الولاية أولاً"} /></SelectTrigger>
          <SelectContent className="max-h-60">
            {communes.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}