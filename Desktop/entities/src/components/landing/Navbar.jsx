import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-primary-foreground/10" dir="rtl">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-display font-bold text-primary-foreground">
          <span className="text-secondary">Match</span>IQ
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/sell" className="text-primary-foreground/70 hover:text-secondary transition-colors font-body text-sm">نشر عقار</Link>
          <Link to="/buy" className="text-primary-foreground/70 hover:text-secondary transition-colors font-body text-sm">البحث عن عقار</Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-heading">
              لوحة التحكم
            </Button>
          </Link>
        </div>

        <button className="md:hidden text-primary-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-primary border-t border-primary-foreground/10 px-6 py-4 space-y-3">
          <Link to="/sell" onClick={() => setOpen(false)} className="block text-primary-foreground/70 hover:text-secondary font-body">نشر عقار</Link>
          <Link to="/buy" onClick={() => setOpen(false)} className="block text-primary-foreground/70 hover:text-secondary font-body">البحث عن عقار</Link>
          <Link to="/dashboard" onClick={() => setOpen(false)} className="block text-primary-foreground/70 hover:text-secondary font-body">لوحة التحكم</Link>
        </div>
      )}
    </nav>
  );
}