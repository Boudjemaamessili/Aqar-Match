import React from "react";
import { Building2, Home, Store, TreePine, MapPin, Castle } from "lucide-react";
import { PROPERTY_TYPES } from "@/lib/algeriaData";

const ICONS = {
  apartment: Building2,
  villa: Castle,
  house: Home,
  commercial: Store,
  agricultural_land: TreePine,
  construction_land: MapPin
};

export default function PropertyTypeSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {Object.entries(PROPERTY_TYPES).map(([key, label]) => {
        const Icon = ICONS[key];
        const selected = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
              selected
                ? "border-secondary bg-secondary/10 text-foreground shadow-md"
                : "border-border bg-card text-muted-foreground hover:border-secondary/40"
            }`}
          >
            <Icon className={`w-7 h-7 ${selected ? "text-secondary" : ""}`} />
            <span className="text-sm font-heading font-medium">{label}</span>
          </button>
        );
      })}
    </div>
  );
}