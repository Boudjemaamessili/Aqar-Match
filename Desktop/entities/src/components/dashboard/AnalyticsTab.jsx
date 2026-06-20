import React, { useMemo } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { PROPERTY_TYPES, PROPERTY_STATUS } from "@/lib/algeriaData";

const COLORS = ["#1e3a5f", "#f5c518", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

const MATCH_STATUS_LABELS = {
  pending: "في الانتظار",
  seller_contacted: "تم التواصل",
  in_negotiation: "قيد التفاوض",
  completed: "مكتمل",
  cancelled: "ملغي"
};

const MATCH_STATUS_COLORS = {
  pending: "#f59e0b",
  seller_contacted: "#3b82f6",
  in_negotiation: "#8b5cf6",
  completed: "#10b981",
  cancelled: "#ef4444"
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-2 shadow-md text-sm font-body">
        {label && <p className="font-semibold text-foreground mb-1">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color || entry.fill }}>
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsTab({ properties, matches }) {

  // Property status distribution
  const propertyStatusData = useMemo(() => {
    const counts = {};
    properties.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: PROPERTY_STATUS[key] || key,
      value
    }));
  }, [properties]);

  // Match status distribution
  const matchStatusData = useMemo(() => {
    const counts = {};
    matches.forEach(m => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: MATCH_STATUS_LABELS[key] || key,
      value,
      color: MATCH_STATUS_COLORS[key] || "#6b7280"
    }));
  }, [matches]);

  // Matches per property type
  const matchesByPropertyType = useMemo(() => {
    const propMap = {};
    properties.forEach(p => { propMap[p.id] = p.property_type; });

    const counts = {};
    matches.forEach(m => {
      const type = propMap[m.property_id];
      if (type) {
        const label = PROPERTY_TYPES[type] || type;
        counts[label] = (counts[label] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties, matches]);

  // Properties by type
  const propertiesByType = useMemo(() => {
    const counts = {};
    properties.forEach(p => {
      const label = PROPERTY_TYPES[p.property_type] || p.property_type;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [properties]);

  // Matches over time (last 7 months)
  const matchesOverTime = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleString("ar-DZ", { month: "short" }),
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        value: 0
      });
    }
    matches.forEach(m => {
      const d = new Date(m.created_date);
      const entry = months.find(
        mo => mo.monthNum === d.getMonth() && mo.year === d.getFullYear()
      );
      if (entry) entry.value++;
    });
    return months;
  }, [matches]);

  const statCards = [
    { label: "إجمالي العقارات", value: properties.length, color: "bg-blue-50 text-blue-700" },
    { label: "العقارات النشطة", value: properties.filter(p => p.status === "active").length, color: "bg-green-50 text-green-700" },
    { label: "إجمالي المطابقات", value: matches.length, color: "bg-amber-50 text-amber-700" },
    { label: "مطابقات مكتملة", value: matches.filter(m => m.status === "completed").length, color: "bg-purple-50 text-purple-700" }
  ];

  return (
    <div className="space-y-8" dir="rtl">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-3xl font-display font-bold">{s.value}</p>
            <p className="text-sm font-body mt-1 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Matches over time */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">المطابقات خلال الأشهر الستة الأخيرة</h3>
          {matches.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-body">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={matchesOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: "Cairo" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="مطابقات" fill="#f5c518" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Match status pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">توزيع حالات المطابقات</h3>
          {matchStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-body">لا توجد مطابقات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={matchStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {matchStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Property status pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">حالة العقارات المعروضة</h3>
          {propertyStatusData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-body">لا توجد عقارات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={propertyStatusData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                  {propertyStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="font-body text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Properties by type bar */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">العقارات حسب النوع</h3>
          {propertiesByType.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm font-body">لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={propertiesByType} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fontFamily: "Cairo" }} width={85} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="عدد" fill="#1e3a5f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </div>

      {/* Matches by property type */}
      {matchesByPropertyType.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-semibold text-foreground mb-4">المطابقات حسب نوع العقار</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={matchesByPropertyType}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fontFamily: "Cairo" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="مطابقات" radius={[4, 4, 0, 0]}>
                {matchesByPropertyType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}