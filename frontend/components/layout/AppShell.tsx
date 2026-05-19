"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, LayoutDashboard, PlusCircle, Settings, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Ana Sayfa", icon: Sparkles },
  { href: "/create", label: "Dilekçe Oluştur", icon: PlusCircle },
  { href: "/dashboard", label: "Geçmiş", icon: LayoutDashboard },
  { href: "/prompts", label: "Promptlar", icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/";

  if (hideSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-card/50 lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">ArzAI</p>
            <p className="text-xs text-muted-foreground">Resmi Dilekçe</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href !== "/" && pathname.startsWith(item.href)
                ? true
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            AI destekli resmi dilekçe platformu. Bilgileriniz güvenle işlenir.
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
