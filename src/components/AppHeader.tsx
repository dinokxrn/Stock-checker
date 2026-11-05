"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, LogOut, Loader2 } from "lucide-react";
import { PinSettingsModal } from "./PinSettingsModal";
import { logoutAction } from "@/actions/auth";
import { DinoLogo } from "./DinoLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppHeader() {
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [formattedDate, setFormattedDate] = useState("");
  const { lang, t } = useLanguage();

  useEffect(() => {
    try {
      const now = new Date();
      const locale = lang === "th" ? "th-TH" : "en-US";
      const formatter = new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      setFormattedDate(formatter.format(now));
    } catch {
      setFormattedDate(lang === "th" ? "ประจำสัปดาห์" : "Weekly");
    }
  }, [lang]);

  const handleLogout = async () => {
    if (confirm(t("logout_confirm"))) {
      setIsLoggingOut(true);
      await logoutAction();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 shadow-sm max-w-md mx-auto sm:max-w-xl md:max-w-4xl w-full">
        <div className="flex items-center justify-between">
          {/* Logo & Store Information */}
          <div className="flex items-center gap-2.5 min-w-0">
            <DinoLogo size={42} className="shadow-md shadow-emerald-600/15" />
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold text-slate-800 truncate leading-snug flex items-center gap-1">
                <span>{t("app_title")}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md">
                  {t("app_subtitle")}
                </span>
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                <span className="truncate">{formattedDate || "..."}</span>
              </div>
            </div>
          </div>

          {/* Action Tools: Language Switcher, PIN Settings & Logout */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language Switcher Button */}
            <LanguageSwitcher />

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
              title={t("change_pin")}
              aria-label={t("change_pin")}
              className="w-10 h-10 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95 flex items-center justify-center transition-all touch-manipulation border border-transparent hover:border-blue-100"
            >
              <KeyRound className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              title={t("logout")}
              aria-label={t("logout")}
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 active:scale-95 flex items-center justify-center transition-all touch-manipulation disabled:opacity-50 border border-transparent hover:border-rose-100"
            >
              {isLoggingOut ? (
                <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
              ) : (
                <LogOut className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Embedded PIN Settings Modal */}
      <PinSettingsModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
}

export default AppHeader;
