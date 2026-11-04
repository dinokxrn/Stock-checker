"use client";

import { useState, useEffect } from "react";
import { createItem, updateItem, ItemInput } from "@/actions/master-data";
import { X, Package, Building2, Banknote, FileText, Loader2, Sparkles } from "lucide-react";

const COMMON_UNITS = ["ชิ้น", "ลัง", "แพ็ค", "ขวด", "ถุง", "ถาด", "กล่อง", "ซอง", "กระป๋อง"];

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  suppliers: Array<{ id: string; name: string }>;
  defaultSupplierId?: string;
  item?: {
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    note: string | null;
    supplierId: string;
  } | null;
}

export function ItemModal({
  isOpen,
  onClose,
  onSuccess,
  suppliers,
  defaultSupplierId,
  item,
}: ItemModalProps) {
  const isEditing = Boolean(item);
  const [name, setName] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [unitPrice, setUnitPrice] = useState("0");
  const [unit, setUnit] = useState("ชิ้น");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSupplierId(item.supplierId);
      setUnitPrice(item.unitPrice.toString());
      setUnit(item.unit || "ชิ้น");
      setNote(item.note || "");
    } else {
      setName("");
      setSupplierId(defaultSupplierId || (suppliers[0]?.id ?? ""));
      setUnitPrice("0");
      setUnit("ชิ้น");
      setNote("");
    }
    setError(null);
  }, [item, defaultSupplierId, suppliers, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("กรุณากรอกชื่อสินค้า");
      return;
    }
    if (!supplierId) {
      setError("กรุณาเลือกบริษัทคู่ค้า");
      return;
    }

    const price = parseFloat(unitPrice);
    if (isNaN(price) || price < 0) {
      setError("ราคาต่อหน่วยต้องเป็นตัวเลข 0 หรือมากกว่า");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: ItemInput = {
      name: name.trim(),
      supplierId,
      unitPrice: price,
      unit: unit.trim() || "ชิ้น",
      note: note.trim() || null,
    };

    let result;
    if (isEditing && item) {
      result = await updateItem(item.id, payload);
    } else {
      result = await createItem(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? "แก้ไขรายการสินค้า" : "เพิ่มสินค้าใหม่"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "ปรับปรุงข้อมูลสินค้า ราคา และหน่วยนับ"
                  : "กรอกข้อมูลสินค้าเพื่อนำไปตรวจนับในสต็อก"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-manipulation"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              {error}
            </div>
          )}

          {/* Item Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <span>ชื่อสินค้า</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น น้ำดื่มสิงห์ 600ml, มาม่าต้มยำกุ้ง"
              className="w-full px-3.5 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            />
          </div>

          {/* Supplier Select */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <span>บริษัทคู่ค้า / ผู้จัดจำหน่าย</span>
              <span className="text-rose-500">*</span>
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              required
              className="w-full px-3.5 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            >
              <option value="" disabled>
                -- เลือกคู่ค้า --
              </option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price and Unit Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Unit Price */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>ราคาต่อหน่วย</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-3 text-base font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <span>หน่วยนับ</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="เช่น ชิ้น, ลัง"
                className="w-full px-3.5 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
            </div>
          </div>

          {/* Quick Unit Suggestion Pills */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              หน่วยนับแนะนำแตะด่วน:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors touch-manipulation min-h-[36px] ${
                    unit === u
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>หมายเหตุสินค้า (ไม่บังคับ)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น ตำแหน่งจัดเก็บ, รหัสบาร์โค้ด, เงื่อนไขพิเศษ"
              className="w-full px-3.5 py-2.5 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Footer Actions with 48px touch targets */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <span>{isEditing ? "บันทึกการแก้ไข" : "เพิ่มสินค้า"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
