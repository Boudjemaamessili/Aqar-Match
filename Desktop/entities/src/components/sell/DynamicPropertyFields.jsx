import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DynamicPropertyFields({ propertyType, details, onChange }) {
  const update = (key, val) => onChange({ ...details, [key]: val });

  if (!propertyType) return null;

  const commonFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">المساحة (م²)</Label>
        <Input
          type="number"
          placeholder="مثال: 120"
          value={details.area || ""}
          onChange={(e) => update("area", e.target.value)}
          className="text-left"
          dir="ltr"
        />
      </div>
    </>
  );

  const apartmentFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الغرف</Label>
        <Select value={details.rooms || ""} onValueChange={(v) => update("rooms", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4", "5", "6+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">الطابق</Label>
        <Input
          type="number"
          placeholder="مثال: 3"
          value={details.floor || ""}
          onChange={(e) => update("floor", e.target.value)}
          className="text-left"
          dir="ltr"
        />
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الحمامات</Label>
        <Select value={details.bathrooms || ""} onValueChange={(v) => update("bathrooms", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const villaFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الغرف</Label>
        <Select value={details.rooms || ""} onValueChange={(v) => update("rooms", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["3", "4", "5", "6", "7", "8+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الطوابق</Label>
        <Select value={details.floors || ""} onValueChange={(v) => update("floors", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">مساحة الأرض (م²)</Label>
        <Input
          type="number"
          placeholder="مثال: 300"
          value={details.land_area || ""}
          onChange={(e) => update("land_area", e.target.value)}
          className="text-left"
          dir="ltr"
        />
      </div>
    </>
  );

  const houseFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الغرف</Label>
        <Select value={details.rooms || ""} onValueChange={(v) => update("rooms", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["2", "3", "4", "5", "6+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الطوابق</Label>
        <Select value={details.floors || ""} onValueChange={(v) => update("floors", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const commercialFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">نوع النشاط التجاري</Label>
        <Select value={details.business_type || ""} onValueChange={(v) => update("business_type", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["محل تجاري", "مكتب", "مخزن", "مطعم/مقهى", "أخرى"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الواجهات</Label>
        <Select value={details.facades || ""} onValueChange={(v) => update("facades", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const landFields = (
    <>
      <div className="space-y-2">
        <Label className="font-heading text-sm">عدد الواجهات</Label>
        <Select value={details.facades || ""} onValueChange={(v) => update("facades", v)}>
          <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
          <SelectContent>
            {["1", "2", "3", "4+"].map(r => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {propertyType === "construction_land" && (
        <div className="space-y-2">
          <Label className="font-heading text-sm">معامل شغل الأرض (COS)</Label>
          <Input
            type="text"
            placeholder="مثال: 0.6"
            value={details.cos || ""}
            onChange={(e) => update("cos", e.target.value)}
            className="text-left"
            dir="ltr"
          />
        </div>
      )}
    </>
  );

  const fieldMap = {
    apartment: apartmentFields,
    villa: villaFields,
    house: houseFields,
    commercial: commercialFields,
    agricultural_land: landFields,
    construction_land: landFields
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {commonFields}
      {fieldMap[propertyType]}
    </div>
  );
}