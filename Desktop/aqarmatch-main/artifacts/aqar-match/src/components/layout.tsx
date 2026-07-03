import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, Building2, Inbox } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/listings", label: "تصفح", icon: Search },
    { href: "/listings/new", label: "أضف عقارك", icon: PlusCircle },
    { href: "/inquiries", label: "استفساراتي", icon: Inbox, hasBadge: true },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground font-sans">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity" data-testid="link-logo">
            <Building2 className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold tracking-tight">عقارMatch</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-accent ${
                    isActive ? "text-accent" : "text-primary-foreground/80"
                  }`}
                  data-testid={`link-nav-${item.href.replace("/", "") || "home"}`}
                >
                  <div className="relative">
                    <item.icon className="w-4 h-4" />
                    {item.hasBadge && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                      </span>
                    )}
                  </div>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      <footer className="hidden md:block bg-primary/5 border-t border-border mt-12 py-8 text-center text-muted-foreground">
        <div className="container mx-auto px-4">
          <Building2 className="w-8 h-8 mx-auto mb-4 opacity-50" />
          <p>عقارMatch © {new Date().getFullYear()} - المنصة الذكية للعقارات في الجزائر</p>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-primary text-primary-foreground border-t border-primary-foreground/10 flex items-stretch"
        dir="rtl"
      >
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                isActive ? "text-accent" : "text-primary-foreground/70"
              }`}
              data-testid={`link-mobile-nav-${item.href.replace("/", "") || "home"}`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
                {item.hasBadge && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
