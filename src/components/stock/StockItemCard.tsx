"use client";

import { useState, useTransition, useCallback } from "react";
import {
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Tag,
  Plus,
  Minus,
  Loader2,
  Check,
  FileText,
} from "lucide-react";
import { StockStatus } from "@/actions/stock";

export interface StockItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  note: string | null;
  status: string;
  remain: number | null;
  ordered: number | null;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
    minOrderAmount: number;
    orderDays?: string | null;
  };
}

interface StockItemCardProps {
  item: StockItem;
  onUpdate: (
    itemId: string,
    status: StockStatus,
    remain?: number | null,
    ordered?: number | null
  ) => Promise<boolean>;
}

export function StockItemCard({ item, onUpdate }: StockItemCardProps) {
  const [isPending, startTransition] = useTransition();
  const [justSaved, setJustSaved] = useState(false);

  // Local optimistic state for instant 0ms response
  const [localStatus, setLocalStatus] = useState<StockStatus>(
    (item.status as StockStatus) || "NONE"
  );
  const [localRemain, setLocalRemain] = useState<number>(
    item.remain !== null && item.remain !== undefined ? item.remain : 0
  );
  const [localOrdered, setLocalOrdered] = useState<number>(
    item.ordered !== null && item.ordered !== undefined && item.ordered > 0
      ? item.ordered
      : 1
  );
  const [hasPendingConfirmation, setHasPendingConfirmation] = useState<boolean>(false);

  const commitUpdate = useCallback(
    (newStatus: StockStatus, newRemain: number | null, newOrdered: number | null) => {
      startTransition(async () => {
        const success = await onUpdate(item.id, newStatus, newRemain, newOrdered);
        if (success) {
          setJustSaved(true);
          setHasPendingConfirmation(false);
          setTimeout(() => setJustSaved(false), 1500);
        }
      });
    },
    [item.id, onUpdate]
  );

  // Status Switcher
  const handleStatusChange = (newStatus: StockStatus) => {
    if (newStatus === "NONE") {
      setLocalStatus("NONE");
      setHasPendingConfirmation(false);
      commitUpdate("NONE", null, null);
      return;
    }

    setLocalStatus(newStatus);
    setHasPendingConfirmation(true);

    if (newStatus === "OUT_OF_STOCK") {
      if (localOrdered <= 0) setLocalOrdered(1);
    }
  };

  // Confirm button handler
  const handleConfirm = useCallback(() => {
    if (localStatus === "OUT_OF_STOCK") {
      const orderVal = localOrdered > 0 ? localOrdered : 1;
      setLocalOrdered(orderVal);
      commitUpdate("OUT_OF_STOCK", 0, orderVal);
    } else if (localStatus === "IN_STOCK" || localStatus === "LOW_STOCK") {
      const remainVal = localRemain >= 0 ? localRemain : 0;
      setLocalRemain(remainVal);
      commitUpdate(localStatus, remainVal, null);
    }
  }, [localStatus, localOrdered, localRemain, commitUpdate]);

  const isChanged =
    hasPendingConfirmation ||
    localStatus !== item.status ||
    (localStatus === "OUT_OF_STOCK" && localOrdered !== item.ordered) ||
    (localStatus !== "OUT_OF_STOCK" && localRemain !== item.remain);

  // Stepper handlers for Remain
  const handleRemainStep = (delta: number) => {
    const nextVal = Math.max(0, localRemain + delta);
    setLocalRemain(nextVal);
    setHasPendingConfirmation(true);
  };

  const handleRemainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? 0 : Math.max(0, Number(e.target.value) || 0);
    setLocalRemain(val);
    setHasPendingConfirmation(true);
  };

  // Stepper handlers for Ordered
  const handleOrderedStep = (delta: number) => {
    const nextVal = Math.max(1, localOrdered + delta);
    setLocalOrdered(nextVal);
    setHasPendingConfirmation(true);
  };

  const handleOrderedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? 1 : Math.max(1, Number(e.target.value) || 1);
    setLocalOrdered(val);
    setHasPendingConfirmation(true);
  };

  // Card theme classes based on status
  const cardBorderClass = {
    NONE: "border-slate-200/90 bg-white",
    IN_STOCK: "border-emerald-300 bg-emerald-50/15 shadow-emerald-500/5",
    LOW_STOCK: "border-amber-300 bg-amber-50/15 shadow-amber-500/5",
    OUT_OF_STOCK: "border-rose-300 bg-rose-50/20 shadow-rose-500/5",
  }[localStatus];

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col gap-3 relative ${cardBorderClass}`}
    >
      {/* Header: Name, Supplier, Price, Status Sync Indicator */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-800 leading-snug">
              {item.name}
            </h3>
            {justSaved && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-100/70 px-2 py-0.5 rounded-full animate-fade-in">
                <Check className="w-3 h-3" />
                บันทึกแล้ว
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin" />
                กำลังซิงค์...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs">
            {item.supplier && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium">
                <Building2 className="w-3 h-3 text-blue-500" />
                <span className="truncate max-w-[150px]">{item.supplier.name}</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
              <Tag className="w-3 h-3 text-slate-500" />
              <span>หน่วย: {item.unit}</span>
            </span>

            {item.note && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
                <FileText className="w-3 h-3 text-amber-600" />
                <span className="truncate max-w-[140px]">{item.note}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4-State Toggle Segmented Grid - 48px touch targets */}
      <div className="grid grid-cols-4 gap-1.5 pt-1">
        {/* NONE Button */}
        <button
          type="button"
          onClick={() => handleStatusChange("NONE")}
          className={`min-h-[48px] px-1 py-1.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all touch-manipulation active:scale-[0.98] ${
            localStatus === "NONE"
              ? "bg-slate-700 text-white shadow-md ring-2 ring-slate-400"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-tight">ยังไม่นับ</span>
        </button>

        {/* IN_STOCK Button */}
        <button
          type="button"
          onClick={() => handleStatusChange("IN_STOCK")}
          className={`min-h-[48px] px-1 py-1.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all touch-manipulation active:scale-[0.98] ${
            localStatus === "IN_STOCK"
              ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-tight">มีพอ</span>
        </button>

        {/* LOW_STOCK Button */}
        <button
          type="button"
          onClick={() => handleStatusChange("LOW_STOCK")}
          className={`min-h-[48px] px-1 py-1.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all touch-manipulation active:scale-[0.98] ${
            localStatus === "LOW_STOCK"
              ? "bg-amber-600 text-white shadow-md ring-2 ring-amber-400"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-tight">ใกล้หมด</span>
        </button>

        {/* OUT_OF_STOCK Button */}
        <button
          type="button"
          onClick={() => handleStatusChange("OUT_OF_STOCK")}
          className={`min-h-[48px] px-1 py-1.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all touch-manipulation active:scale-[0.98] ${
            localStatus === "OUT_OF_STOCK"
              ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400"
              : "bg-rose-50 text-rose-700 hover:bg-rose-100"
          }`}
        >
          <XCircle className="w-4 h-4 shrink-0" />
          <span className="text-[11px] leading-tight">สินค้าหมด</span>
        </button>
      </div>

      {/* Dynamic Form Area: Remain vs Ordered */}
      {(localStatus === "IN_STOCK" || localStatus === "LOW_STOCK") && (
        <div className="mt-1 p-3 bg-white/90 border border-slate-200/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>จำนวนคงเหลือ (Remain)</span>
              <span className="text-slate-400 font-normal">({item.unit})</span>
            </label>
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                localStatus === "IN_STOCK"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {localStatus === "IN_STOCK" ? "ไม่ต้องสั่งเพิ่ม" : "สต็อกใกล้หมด"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stepper -1 */}
            <button
              type="button"
              onClick={() => handleRemainStep(-1)}
              disabled={localRemain <= 0}
              className="min-h-[48px] min-w-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 text-slate-700 rounded-xl flex items-center justify-center font-bold touch-manipulation transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Direct Number Input */}
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={localRemain}
                onChange={handleRemainChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                className="w-full min-h-[48px] text-center text-lg font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 pointer-events-none">
                {item.unit}
              </span>
            </div>

            {/* Stepper +1 */}
            <button
              type="button"
              onClick={() => handleRemainStep(1)}
              className="min-h-[48px] min-w-[48px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl flex items-center justify-center font-bold touch-manipulation transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stepper Pills */}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1">ปุ่มด่วน:</span>
            {[5, 10].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => handleRemainStep(step)}
                className="px-2.5 py-1 min-h-[36px] bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg touch-manipulation transition-colors"
              >
                +{step}
              </button>
            ))}
          </div>

          {/* Confirm Button for Remain */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] touch-manipulation ${
                isChanged
                  ? localStatus === "IN_STOCK"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                    : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-amber-500/25 ring-2 ring-amber-400/40"
                  : localStatus === "IN_STOCK"
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isChanged ? "ยืนยัน (" : "บันทึกแล้ว ("}
                    {localStatus === "IN_STOCK"
                      ? `มีพอ ${localRemain} ${item.unit}`
                      : `คงเหลือ ${localRemain} ${item.unit}`}
                    )
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* OUT OF STOCK: Mandatory Ordered Quantity + Instant Line Total */}
      {localStatus === "OUT_OF_STOCK" && (
        <div className="mt-1 p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
              <span>จำนวนที่ต้องสั่งซื้อ (Ordered)</span>
              <span className="text-rose-600 font-semibold">*จำเป็น</span>
            </label>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              รวมในใบสั่งซื้อ
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Stepper -1 (min 1) */}
            <button
              type="button"
              onClick={() => handleOrderedStep(-1)}
              disabled={localOrdered <= 1}
              className="min-h-[48px] min-w-[48px] bg-white hover:bg-rose-100 active:bg-rose-200 disabled:opacity-40 text-rose-700 border border-rose-200 rounded-xl flex items-center justify-center font-bold touch-manipulation transition-colors shadow-sm"
            >
              <Minus className="w-5 h-5" />
            </button>

            {/* Direct Number Input */}
            <div className="relative flex-1">
              <input
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={localOrdered}
                onChange={handleOrderedChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleConfirm();
                  }
                }}
                className="w-full min-h-[48px] text-center text-lg font-bold text-rose-900 bg-white border border-rose-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-rose-500 pointer-events-none">
                {item.unit}
              </span>
            </div>

            {/* Stepper +1 */}
            <button
              type="button"
              onClick={() => handleOrderedStep(1)}
              className="min-h-[48px] min-w-[48px] bg-white hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl flex items-center justify-center font-bold touch-manipulation transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stepper Pills */}
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <span className="text-[11px] text-rose-600 mr-1">ปุ่มด่วน:</span>
            {[5, 10].map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => handleOrderedStep(step)}
                className="px-2.5 py-1 min-h-[36px] bg-white hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg touch-manipulation transition-colors shadow-sm"
              >
                +{step}
              </button>
            ))}
          </div>

          {/* Confirm Button for Ordered */}
          <div className="pt-1.5">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className={`w-full min-h-[46px] py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] touch-manipulation ${
                isChanged
                  ? "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-500/25 ring-2 ring-rose-400/40"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
              }`}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>
                    {isChanged ? "ยืนยัน (" : "บันทึกแล้ว ("}สั่งซื้อ {localOrdered} {item.unit})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* NONE status hint */}
      {localStatus === "NONE" && (
        <div className="text-center py-1 text-[11px] text-slate-400">
          แตะเลือกสถานะเพื่อเริ่มบันทึกการตรวจนับ
        </div>
      )}
    </div>
  );
}
