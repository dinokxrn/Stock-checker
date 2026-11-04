"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PinKeypad } from "@/components/PinKeypad";
import { loginWithPin } from "@/actions/auth";
import { Store, ShieldCheck, Sparkles } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
        setErrorMessage(res.error || "รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* App Branding */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 mb-3 ring-4 ring-blue-50">
          <Store className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
          ตรวจนับสต็อก &amp; สั่งซื้อ
        </h1>
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Stock Checker &amp; Supplier Order System</span>
        </p>
      </div>

      {/* Keypad Container */}
      <div className="w-full bg-white rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 p-6 sm:p-8">
        <PinKeypad
          onComplete={handleComplete}
          isLoading={isLoading}
          errorMessage={errorMessage}
          title="ยืนยันตัวตนด้วยรหัส PIN"
          subtitle="แตะแป้นตัวเลขเพื่อเข้าสู่ระบบร้านค้า"
          minDigits={4}
          maxDigits={6}
        />

        {/* Helpful default credential tip */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">รหัส PIN เริ่มต้น: </span>
            <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-blue-600 font-bold">
              1234
            </span>
            <span className="block text-slate-400 mt-0.5">
              (สามารถเปลี่ยนรหัสได้ที่ไอคอนกุญแจมุมขวาบนเมื่อเข้าสู่ระบบแล้ว)
            </span>
          </div>
        </div>
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
