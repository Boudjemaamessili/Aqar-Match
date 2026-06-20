import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12" dir="rtl">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-right">
            <h3 className="text-2xl font-display font-bold">
              <span className="text-secondary">Match</span>IQ
            </h3>
            <p className="text-primary-foreground/60 text-sm font-body">
              منصة المطابقة العقارية الذكية — الجزائر
            </p>
          </div>
          <div className="flex gap-8 text-sm font-body">
            <Link to="/sell" className="text-primary-foreground/70 hover:text-secondary transition-colors">نشر عقار</Link>
            <Link to="/buy" className="text-primary-foreground/70 hover:text-secondary transition-colors">البحث عن عقار</Link>
            <Link to="/dashboard" className="text-primary-foreground/70 hover:text-secondary transition-colors">لوحة التحكم</Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10 mt-8 pt-6 text-center text-xs text-primary-foreground/40 font-body">
          © {new Date().getFullYear()} MatchIQ — جميع الحقوق محفوظة
        </div>
      </div>
    </footer>
  );
}