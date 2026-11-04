"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Delete, Lock, ArrowRight, Loader2 } from "lucide-react";

interface PinKeypadProps {
  onComplete: (pin: string) => Promise<void> | void;
  isLoading?: boolean;
  errorMessage?: string | null;
  title?: string;
  subtitle?: string;
  maxDigits?: number;
  minDigits?: number;
}

export function PinKeypad({
  onComplete,
  isLoading = false,
  errorMessage = null,
  title = "กรุณาระบุรหัส PIN",
  subtitle = "รหัสตัวเลข 4-6 หลักเพื่อเข้าใช้งาน",
  maxDigits = 6,
  minDigits = 4,
}: PinKeypadProps) {
  const [pin, setPin] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  // Trigger shake animation when error message appears
  useEffect(() => {
    if (errorMessage) {
      setIsShaking(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate([100, 50, 100]);
        } catch {
          // Ignore vibration permission errors
        }
      }
      const timer = setTimeout(() => {
        setIsShaking(false);
        setPin(""); // Clear on error for re-entry
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleDigit = useCallback(
    (digit: string) => {
      if (isLoading) return;
      if (pin.length < maxDigits) {
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          try {
            navigator.vibrate(30);
          } catch {
            // Ignore
          }
        }
        setPin((prev) => prev + digit);
      }
    },
    [isLoading, pin.length, maxDigits]
  );

  const handleDelete = useCallback(() => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
  }, [isLoading]);

  const handleClear = useCallback(() => {
    if (isLoading) return;
    setPin("");
  }, [isLoading]);

  const handleSubmit = useCallback(() => {
    if (isLoading || pin.length < minDigits) return;
    onComplete(pin);
  }, [isLoading, pin, minDigits, onComplete]);

  // Physical keyboard support for desktop / tablets with external keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleDelete();
      } else if (e.key === "Escape" || e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, handleDigit, handleDelete, handleClear, handleSubmit]);

  const keys = [
    { label: "1", val: "1" },
    { label: "2", val: "2" },
    { label: "3", val: "3" },
    { label: "4", val: "4" },
    { label: "5", val: "5" },
    { label: "6", val: "6" },
    { label: "7", val: "7" },
    { label: "8", val: "8" },
    { label: "9", val: "9" },
    { label: "C", val: "clear" },
    { label: "0", val: "0" },
    { label: "delete", val: "delete" },
  ];

  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center select-none">
      {/* Title & Icon Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 shadow-inner border border-blue-100">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </div>

      {/* Visual PIN Dots Indicator */}
      <div
        className={`flex items-center justify-center gap-3.5 mb-6 py-2 px-6 rounded-2xl bg-slate-50 border border-slate-200/80 ${
          isShaking ? "animate-shake border-red-300 bg-red-50/50" : ""
        }`}
      >
        {Array.from({ length: maxDigits }).map((_, idx) => {
          const isFilled = idx < pin.length;
          const isRequired = idx < minDigits;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-150 transform ${
                isFilled
                  ? "bg-blue-600 scale-110 shadow-sm"
                  : isRequired
                  ? "border-2 border-slate-300 bg-white"
                  : "border border-dashed border-slate-300 bg-slate-100/60"
              }`}
            />
          );
        })}
      </div>

      {/* Error message display */}
      {errorMessage && (
        <div className="text-xs font-medium text-rose-600 mb-4 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-center animate-fade-in">
          {errorMessage}
        </div>
      )}

      {/* 3x4 Touch Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-3 w-full mb-5">
        {keys.map((k, index) => {
          if (k.val === "clear") {
            return (
              <button
                key={index}
                type="button"
                onClick={handleClear}
                disabled={isLoading || pin.length === 0}
                className="h-16 w-full flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 font-bold text-base active:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm border border-slate-200/60 touch-manipulation"
                aria-label="ล้างทั้งหมด"
              >
                C
              </button>
            );
          }

          if (k.val === "delete") {
            return (
              <button
                key={index}
                type="button"
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="h-16 w-full flex items-center justify-center rounded-2xl bg-slate-100 text-slate-600 active:bg-slate-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm border border-slate-200/60 touch-manipulation"
                aria-label="ลบตัวเลขล่าสุด"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDigit(k.val)}
              disabled={isLoading || pin.length >= maxDigits}
              className="h-16 w-full flex items-center justify-center rounded-2xl bg-white text-slate-800 font-semibold text-2xl active:bg-blue-50 active:text-blue-700 active:scale-95 disabled:opacity-50 transition-all shadow-sm hover:shadow border border-slate-200/80 touch-manipulation"
            >
              {k.label}
            </button>
          );
        })}
      </div>

      {/* Enter / Submit Button */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isLoading || pin.length < minDigits}
        className={`w-full h-13 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md touch-manipulation ${
          pin.length >= minDigits && !isLoading
            ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98] shadow-blue-500/25"
            : "bg-slate-200 text-slate-400 cursor-not-allowed"
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>กำลังตรวจสอบ...</span>
          </>
        ) : (
          <>
            <span>เข้าสู่ระบบ</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
}
export default PinKeypad;
