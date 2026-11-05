"use client";

import { useState, useEffect } from "react";
import { createSupplier, updateSupplier, SupplierInput } from "@/actions/master-data";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Building2, Phone, FileText, Banknote, Loader2, Calendar } from "lucide-react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplier?: {
    id: string;
    name: string;
    contactPhone: string | null;
    note: string | null;
    minOrderAmount: number;
    orderDays?: string | null;
  } | null;
}

const TH_ORDER_DAYS = [
  { num: 1, label: "จันทร์", short: "จ." },
  { num: 2, label: "อังคาร", short: "อ." },
  { num: 3, label: "พุธ", short: "พ." },
  { num: 4, label: "พฤหัส", short: "พฤ." },
  { num: 5, label: "ศุกร์", short: "ศ." },
  { num: 6, label: "เสาร์", short: "ส." },
  { num: 0, label: "อาทิตย์", short: "อา." },
];

const EN_ORDER_DAYS = [
  { num: 1, label: "Monday", short: "Mon" },
  { num: 2, label: "Tuesday", short: "Tue" },
  { num: 3, label: "Wednesday", short: "Wed" },
  { num: 4, label: "Thursday", short: "Thu" },
  { num: 5, label: "Friday", short: "Fri" },
  { num: 6, label: "Saturday", short: "Sat" },
  { num: 0, label: "Sunday", short: "Sun" },
];

export function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplier,
}: SupplierModalProps) {
  const { t, lang } = useLanguage();
  const orderDaysList = lang === "en" ? EN_ORDER_DAYS : TH_ORDER_DAYS;
  const isEditing = Boolean(supplier);
  const [name, setName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [note, setNote] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplier) {
      setName(supplier.name);
      setContactPhone(supplier.contactPhone || "");
      setMinOrderAmount(supplier.minOrderAmount.toString());
      setNote(supplier.note || "");
      if (supplier.orderDays) {
        const parsed = supplier.orderDays
          .split(",")
          .map((d) => parseInt(d.trim(), 10))
          .filter((d) => !isNaN(d));
        setSelectedDays(parsed);
      } else {
        setSelectedDays([]);
      }
    } else {
      setName("");
      setContactPhone("");
      setMinOrderAmount("0");
      setNote("");
      setSelectedDays([]);
    }
    setError(null);
  }, [supplier, isOpen]);

  const toggleDay = (dayNum: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayNum) ? prev.filter((d) => d !== dayNum) : [...prev, dayNum].sort()
    );
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t("val_supplier_name_required"));
      return;
    }

    const minAmount = parseFloat(minOrderAmount);
    if (isNaN(minAmount) || minAmount < 0) {
      setError(t("val_min_order_positive"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: SupplierInput = {
      name: name.trim(),
      contactPhone: contactPhone.trim() || null,
      note: note.trim() || null,
      minOrderAmount: minAmount,
      orderDays: selectedDays.length > 0 ? selectedDays.join(",") : null,
    };

    let result;
    if (isEditing && supplier) {
      result = await updateSupplier(supplier.id, payload);
    } else {
      result = await createSupplier(payload);
    }

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || t("error_save_supplier"));
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? t("edit_supplier_title") : t("add_supplier_title")}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? t("edit_supplier_desc") : t("add_supplier_desc")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-manipulation"
            aria-label={t("close")}
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

          {/* Supplier Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <span>{t("supplier_name_label")}</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("supplier_name_placeholder")}
                className="w-full px-3.5 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
            </div>
          </div>

          {/* Minimum Order Amount */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-600" />
              <span>{t("min_order_amount_label")}</span>
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
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-3 text-base font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
            </div>
            <p className="text-xs text-slate-500">
              {t("min_order_amount_hint")}
            </p>
          </div>

          {/* Order Days Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{t("weekly_order_days_label")}</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {selectedDays.length > 0
                  ? t("order_days_selected_count").replace("{count}", String(selectedDays.length))
                  : t("order_days_not_specified")}
              </span>
            </label>
            <div className="grid grid-cols-7 gap-1.5 pt-1">
              {orderDaysList.map((day) => {
                const isSelected = selectedDays.includes(day.num);
                return (
                  <button
                    key={day.num}
                    type="button"
                    onClick={() => toggleDay(day.num)}
                    className={`min-h-[44px] py-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all touch-manipulation border ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-sm scale-102"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 active:scale-95"
                    }`}
                  >
                    <span>{day.short}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-500">
              {t("order_days_hint")}
            </p>
          </div>

          {/* Contact Phone */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{t("contact_phone_label")}</span>
            </label>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder={t("contact_phone_placeholder")}
              className="w-full px-3.5 py-3 text-base text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{t("supplier_note_label")}</span>
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("supplier_note_placeholder")}
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
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 min-h-[48px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{t("saving")}</span>
                </>
              ) : (
                <span>{isEditing ? t("save_changes") : t("add_supplier")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
