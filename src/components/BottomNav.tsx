"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardCheck, ShoppingCart, Database, History } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    {
      label: t("nav_stock"),
      href: "/",
      icon: ClipboardCheck,
      isActive: (current: string) => current === "/",
    },
    {
      label: t("nav_order"),
      href: "/dashboard",
      icon: ShoppingCart,
      isActive: (current: string) => current.startsWith("/dashboard"),
    },
    {
      label: t("nav_master"),
      href: "/master",
      icon: Database,
      isActive: (current: string) => current.startsWith("/master"),
    },
    {
      label: t("nav_history"),
      href: "/history",
      icon: History,
      isActive: (current: string) => current.startsWith("/history"),
    },
  ];

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] max-w-md mx-auto sm:max-w-xl md:max-w-4xl"
    >
      <div className="grid grid-cols-4 h-16 items-center px-1">
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full py-1.5 px-1 rounded-xl transition-all duration-150 touch-manipulation select-none active:scale-95 ${
                active
                  ? "text-blue-600 font-semibold"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <div
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                  active ? "bg-blue-50 text-blue-600" : "text-slate-500"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
              </div>
              <span className={`text-[11px] leading-tight mt-0.5 ${active ? "text-blue-600" : "text-slate-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
