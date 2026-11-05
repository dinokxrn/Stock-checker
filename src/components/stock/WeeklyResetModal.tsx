"use client";

import { useState } from "react";
import { StockStats } from "./StockFilterBar";
import { archiveAndResetWeeklyStock } from "@/actions/snapshot";
import {
  RotateCcw,
  AlertTriangle,
  Archive,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  FileText,
} from "lucide-react";

interface WeeklyResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StockStats;
  onResetSuccess: () => void;
}

export function WeeklyResetModal({
  isOpen,
  onClose,
  stats,
  onResetSuccess,
}: WeeklyResetModalProps) {
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmReset = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await archiveAndResetWeeklyStock(note);

      if (!res.success) {
        setErrorMessage(res.error || "เกิดข้อผิดพลาดในการรีเซ็ตสต็อก");
        setIsSubmitting(false);
        return;
      }

      // Success
      setNote("");
      setIsSubmitting(false);
      onResetSuccess();
      onClose();
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMessage("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่อีกครั้ง");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-modal-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
              <RotateCcw className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 id="reset-modal-title" className="text-base font-bold text-slate-800">
                รีเซ็ตประจำสัปดาห์
              </h3>
              <p className="text-xs text-slate-500">Weekly Archive & Reset</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Explanation Alert */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>การดำเนินการนี้จะจัดเก็บประวัติและล้างสถานะ</span>
            </div>
            <p className="text-amber-800/90 leading-relaxed pl-5">
              ระบบจะบันทึกสถานะการนับปัจจุบันทั้งหมดเป็น <strong>ประวัติย้อนหลัง (Snapshot Archive)</strong>{" "}
              จากนั้นจะปรับสถานะสินค้าทุกรายการกลับเป็น <strong>&ldquo;ยังไม่นับ&rdquo; (NONE)</strong> เพื่อเริ่มต้นการนับในรอบถัดไป
            </p>
          </div>

          {/* Current Live Metrics Summary */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2.5">
            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-slate-500" />
              <span>ข้อมูลที่จะถูกจัดเก็บใน Snapshot รอบนี้</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ตรวจนับแล้ว</span>
                </div>
                <div className="text-sm font-extrabold text-slate-800 mt-0.5">
                  {stats.checked} / {stats.total} รายการ
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-600" />
                  <span>สินค้าหมด (ต้องสั่ง)</span>
                </div>
                <div className="text-sm font-extrabold text-rose-600 mt-0.5">
                  {stats.outOfStock} รายการ
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>มีพอในสต็อก</span>
                </div>
                <div className="text-sm font-extrabold text-emerald-700 mt-0.5">
                  {stats.inStock} รายการ
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>สินค้าใกล้หมด</span>
                </div>
                <div className="text-sm font-extrabold text-amber-700 mt-0.5">
                  {stats.lowStock} รายการ
                </div>
              </div>
            </div>

            {stats.totalOrderAmount > 0 && (
              <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-semibold">ยอดสั่งซื้อประมาณการรวม:</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  ฿{stats.totalOrderAmount.toLocaleString("th-TH")}
                </span>
              </div>
            )}
          </div>

          {/* Optional Note / Memo */}
          <div className="space-y-1.5">
            <label htmlFor="reset-note" className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>บันทึกช่วยจำ (ไม่บังคับ):</span>
            </label>
            <input
              id="reset-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น รอบสัปดาห์ที่ 1 พ.ย. 67, นับก่อนส่งของ..."
              disabled={isSubmitting}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[48px] touch-manipulation"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons - 48px touch targets */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleConfirmReset}
            disabled={isSubmitting}
            className="flex-1 min-h-[48px] px-4 py-3 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 touch-manipulation transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังจัดเก็บและรีเซ็ต...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>ยืนยันจัดเก็บและรีเซ็ต</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-h-[48px] px-4 py-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm rounded-xl touch-manipulation transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
}
