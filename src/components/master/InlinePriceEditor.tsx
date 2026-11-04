"use client";

import { useState, useRef, useEffect } from "react";
import { updateItemPrice } from "@/actions/master-data";
import { Check, X, Pencil, Loader2 } from "lucide-react";

interface InlinePriceEditorProps {
  itemId: string;
  initialPrice: number;
  unit: string;
  onPriceUpdated?: (newPrice: number) => void;
}

export function InlinePriceEditor({
  itemId,
  initialPrice,
  unit,
  onPriceUpdated,
}: InlinePriceEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState<string>(initialPrice.toString());
  const [currentDisplayPrice, setCurrentDisplayPrice] = useState<number>(initialPrice);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentDisplayPrice(initialPrice);
    setPrice(initialPrice.toString());
  }, [initialPrice]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsEditing(false);
    setPrice(currentDisplayPrice.toString());
    setError(null);
  };

  const handleSave = async (e?: React.MouseEvent | React.FormEvent) => {
    if (e) e.stopPropagation();
    const numPrice = parseFloat(price);

    if (isNaN(numPrice) || numPrice < 0) {
      setError("ราคาต้องเป็นตัวเลขที่ถูกต้องและไม่ติดลบ");
      return;
    }

    // Optimistic update
    const previousPrice = currentDisplayPrice;
    setCurrentDisplayPrice(numPrice);
    setIsEditing(false);
    setIsSaving(true);
    setError(null);

    const res = await updateItemPrice(itemId, numPrice);
    setIsSaving(false);

    if (res.success && res.data) {
      onPriceUpdated?.(numPrice);
    } else {
      // Rollback on failure
      setCurrentDisplayPrice(previousPrice);
      setPrice(previousPrice.toString());
      setError(res.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div
        className="flex items-center gap-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
            ฿
          </span>
          <input
            ref={inputRef}
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-24 pl-6 pr-2 py-2 text-sm font-bold text-slate-800 bg-white border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm min-h-[44px]"
            placeholder="0.00"
          />
        </div>

        {/* 48px touch target confirm button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-emerald-600 active:bg-emerald-700 text-white shadow hover:bg-emerald-500 transition-colors touch-manipulation"
          title="บันทึกราคา"
          aria-label="บันทึกราคา"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className="w-5 h-5" />
          )}
        </button>

        {/* 48px touch target cancel button */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-200 active:bg-slate-300 text-slate-600 hover:bg-slate-300 transition-colors touch-manipulation"
          title="ยกเลิก"
          aria-label="ยกเลิก"
        >
          <X className="w-5 h-5" />
        </button>

        {error && (
          <span className="text-xs text-rose-600 font-medium ml-1">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleStartEdit}
        disabled={isSaving}
        className="group inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-300 transition-all text-left touch-manipulation min-h-[40px]"
        title="แตะเพื่อแก้ไขราคา"
      >
        {isSaving ? (
          <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
        ) : (
          <span className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            ฿{currentDisplayPrice.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
        <span className="text-xs text-slate-500 font-medium">/{unit}</span>
        <Pencil className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 ml-1 transition-colors" />
      </button>

      {error && (
        <span className="text-xs text-rose-600 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
