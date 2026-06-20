import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, Users, TrendingUp, Plus, Eye, Clock, CheckCircle, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { PROPERTY_TYPES, TRANSACTION_TYPES, formatPrice, PROPERTY_STATUS } from "@/lib/algeriaData";
import AnalyticsTab from "@/components/dashboard/AnalyticsTab";

const StatusBadge = ({ status }) => {
  const colors = {
    active: "bg-green-100 text-green-700",
    pending_payment: "bg-yellow-100 text-yellow-700",
    matched: "bg-blue-100 text-blue-700",
    expired: "bg-red-100 text-red-700",
    deactivated: "bg-gray-100 text-gray-600"
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-heading font-medium ${colors[status] || colors.active}`}>
      {PROPERTY_STATUS[status] || status}
    </span>
  );
};

const MatchStatusBadge = ({ status }) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-700",
    seller_contacted: "bg-blue-100 text-blue-700",
    in_negotiation: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
  };
  const labels = {
    pending: "في الانتظار",
    seller_contacted: "تم التواصل",
    in_negotiation: "قيد التفاوض",
    completed: "مكتمل",
    cancelled: "ملغي"
  };
  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-heading font-medium ${colors[status] || colors.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [matches, setMatches] = useState([]);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [props, mtchs, qrs] = await Promise.all([
          base44.entities.Property.list("-created_date", 50),
          base44.entities.Match.list("-created_date", 50),
          base44.entities.SearchQuery.list("-created_date", 20)
        ]);
        setProperties(props);
        setMatches(mtchs);
        setQueries(qrs);
      } catch(e) {}
      setLoading(false);
    };
    load();
  }, []);

  const activeProps = properties.filter(p => p.status === "active").length;
  const totalMatches = matches.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground font-body">إدارة عقاراتك ومتابعة المطابقات</p>
          </div>
          <Link to="/sell">
            <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-heading">
              <Plus className="w-4 h-4 ml-2" /> نشر عقار جديد
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Building2, label: "العقارات النشطة", value: activeProps, color: "text-blue-600 bg-blue-50" },
            { icon: Users, label: "المطابقات", value: totalMatches, color: "text-green-600 bg-green-50" },
            { icon: TrendingUp, label: "عمليات البحث", value: queries.length, color: "text-purple-600 bg-purple-50" }
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground font-body">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-muted rounded-xl p-1">
            <TabsTrigger value="analytics" className="font-heading rounded-lg flex items-center gap-1">
              <BarChart2 className="w-4 h-4" /> الإحصائيات
            </TabsTrigger>
            <TabsTrigger value="properties" className="font-heading rounded-lg">العقارات</TabsTrigger>
            <TabsTrigger value="matches" className="font-heading rounded-lg">المطابقات</TabsTrigger>
            <TabsTrigger value="searches" className="font-heading rounded-lg">عمليات البحث</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab properties={properties} matches={matches} />
          </TabsContent>

          <TabsContent value="properties">
            {properties.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-body">لا توجد عقارات بعد</p>
                <Link to="/sell">
                  <Button className="bg-secondary text-secondary-foreground font-heading">نشر أول عقار</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {properties.map(p => (
                  <div key={p.id} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-heading font-semibold text-foreground">{p.title || PROPERTY_TYPES[p.property_type]}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-sm text-muted-foreground font-body">
                        {TRANSACTION_TYPES[p.transaction_type]} · {p.commune}، {p.wilaya}
                        {p.area ? ` · ${p.area} م²` : ""}
                      </p>
                      <p className="font-heading font-bold text-secondary">{formatPrice(p.target_price)}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{p.match_count || 0} مطابقة</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="matches">
            {matches.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-body">لا توجد مطابقات بعد</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map(m => (
                  <div key={m.id} className="bg-card rounded-xl border border-border p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="font-heading font-semibold">{m.buyer_name}</span>
                      </div>
                      <MatchStatusBadge status={m.status} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm font-body">
                      <div>
                        <span className="text-muted-foreground">الميزانية</span>
                        <p className="font-medium">{formatPrice(m.buyer_budget)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">الهاتف</span>
                        <p className="font-medium" dir="ltr">{m.buyer_phone}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">درجة التوافق</span>
                        <p className="font-medium text-green-600">{m.compatibility_score}%</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">التاريخ</span>
                        <p className="font-medium">{new Date(m.created_date).toLocaleDateString('ar-DZ')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="searches">
            {queries.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Eye className="w-12 h-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground font-body">لا توجد عمليات بحث مسجلة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queries.map(q => (
                  <div key={q.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <div className="font-body text-sm">
                        <span className="font-medium">{TRANSACTION_TYPES[q.transaction_type]} {PROPERTY_TYPES[q.property_type]}</span>
                        <span className="text-muted-foreground"> في {q.commune}، {q.wilaya}</span>
                      </div>
                    </div>
                    <div className="text-left text-sm font-body">
                      {q.max_budget ? formatPrice(q.max_budget) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}