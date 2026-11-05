"use client";

import React, { useState } from "react";
import { KeyRound, X, Check, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { changePinAction } from "@/actions/auth";
import { useLanguage } from "@/contexts/LanguageContext";

interface PinSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PinSettingsModal({ isOpen, onClose }: PinSettingsModalProps) {
  const { t, lang } = useLanguage();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPins, setShowPins] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isLoading) return;
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPin) {
      setError(t("val_current_pin_required"));
      return;
    }

    if (!newPin || !/^\d{4}$/.test(newPin)) {
      setError(t("val_new_pin_format"));
      return;
    }

    if (newPin !== confirmPin) {
      setError(t("val_pin_mismatch"));
      return;
    }

    if (currentPin === newPin) {
      setError(t("val_pin_must_differ"));
      return;
    }

    setIsLoading(true);
    try {
      const res = await changePinAction(currentPin, newPin, confirmPin);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1200);
      } else {
        setError(res.error || (lang === "en" ? "Failed to change PIN" : "ไม่สามารถเปลี่ยนรหัส PIN ได้"));
      }
    } catch {
      setError(t("network_error"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-settings-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 id="pin-settings-title" className="text-base font-bold text-slate-800">
                {t("pin_modal_title")}
              </h3>
              <p className="text-xs text-slate-500">{t("pin_modal_subtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label={t("close")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{t("pin_change_success")}</span>
            </div>
          )}

          {/* Toggle show/hide PIN */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowPins((prev) => !prev)}
              className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              <span>{showPins ? t("hide_digits") : t("show_digits")}</span>
            </button>
          </div>

          {/* Current PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("current_pin_label")} <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPins ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("current_pin_placeholder")}
              disabled={isLoading || success}
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base font-mono tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
            />
          </div>

          {/* New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("new_pin_label")} <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPins ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("new_pin_placeholder")}
              disabled={isLoading || success}
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base font-mono tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
            />
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t("confirm_pin_label")} <span className="text-rose-500">*</span>
            </label>
            <input
              type={showPins ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
              placeholder={t("confirm_pin_placeholder")}
              disabled={isLoading || success}
              className="w-full h-12 px-3.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base font-mono tracking-widest text-slate-800 placeholder:text-slate-400 placeholder:font-sans placeholder:tracking-normal placeholder:text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading || success || newPin.length < 4}
              className="flex-1 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t("loading")}</span>
                </>
              ) : (
                <span>{t("save_new_pin_btn")}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PinSettingsModal;
