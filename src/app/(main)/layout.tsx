import React from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col flex-1 min-h-screen w-full relative">
      <AppHeader />
      <div className="flex-1 pb-20 px-3 sm:px-4 pt-3 w-full">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
