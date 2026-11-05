"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinKeypad } from "@/components/PinKeypad";
import { loginWithPin } from "@/actions/auth";
import { ShieldCheck } from "lucide-react";
import { DinoLogo } from "@/components/DinoLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleComplete = async (pin: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginWithPin(pin);
      if (res.success) {
        const destination = searchParams.get("from") || "/";
        router.push(destination);
        router.refresh();
      } else {
        setErrorMessage(res.error || t("pin_error"));
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center">
      {/* Top Language Switcher on Login Page */}
      <div className="w-full flex justify-end mb-3">
        <LanguageSwitcher variant="segmented" />
      </div>

      {/* Keypad Container Card with Dino Branding */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
        <PinKeypad
          onComplete={handleComplete}
          isLoading={isLoading}
          errorMessage={errorMessage}
          minDigits={4}
          maxDigits={4}
          header={
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="relative mb-3">
                <DinoLogo size={80} className="rounded-3xl shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-50" />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border-2 border-white">
                  DINO
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                {t("pin_login_title")}
              </h1>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t("pin_login_desc")}</span>
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 min-h-screen bg-slate-50">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center p-8 text-slate-400">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs">กำลังโหลดแบบฟอร์ม...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
