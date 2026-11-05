"use client";

import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "minimal" | "segmented";
}

export function LanguageSwitcher({ className = "", variant = "pill" }: LanguageSwitcherProps) {
  const { lang, setLang, toggleLang } = useLanguage();

  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 shadow-2xs ${className}`}
      >
        <button
          type="button"
          onClick={() => setLang("th")}
          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
            lang === "th"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
          title="ภาษาไทย"
        >
          <span>🇹🇭</span>
          <span>ไทย</span>
        </button>

        <button
          type="button"
          onClick={() => setLang("en")}
          className={`min-h-[32px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all touch-manipulation flex items-center gap-1 ${
            lang === "en"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
          title="English"
        >
          <span>🇺🇸</span>
          <span>EN</span>
        </button>
      </div>
    );
  }

  // Default "pill" toggle button (compact, ideal for header)
  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-xs font-extrabold text-slate-700 flex items-center gap-1.5 transition-all border border-slate-200/80 shadow-2xs touch-manipulation ${className}`}
      title={lang === "th" ? "Switch to English (เปลี่ยนเป็นภาษาอังกฤษ)" : "เปลี่ยนเป็นภาษาไทย (Switch to Thai)"}
      aria-label="เปลี่ยนภาษา / Switch language"
    >
      <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
      <span className="flex items-center gap-1">
        <span>{lang === "th" ? "🇹🇭 TH" : "🇺🇸 EN"}</span>
      </span>
    </button>
  );
}

export default LanguageSwitcher;
