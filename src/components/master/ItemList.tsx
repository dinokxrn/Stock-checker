"use client";

import { useState } from "react";
import { deleteItem } from "@/actions/master-data";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Package,
  Building2,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Hash,
} from "lucide-react";

export interface MasterItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  note: string | null;
  status: string;
  remain: number | null;
  ordered: number | null;
  sortOrder?: number;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
    minOrderAmount: number;
  };
}

interface ItemListProps {
  items: MasterItem[];
  onEdit: (item: MasterItem) => void;
  onRefresh: () => void;
  onMoveItem?: (itemId: string, direction: "up" | "down") => Promise<void>;
  onSetItemPosition?: (itemId: string, targetPosition: number) => Promise<void>;
}

export function ItemList({
  items,
  onEdit,
  onRefresh,
  onMoveItem,
  onSetItemPosition,
}: ItemListProps) {
  const { t, lang } = useLanguage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MasterItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Position jump modal state
  const [jumpItem, setJumpItem] = useState<{ item: MasterItem; currentRank: number } | null>(null);
  const [targetRankInput, setTargetRankInput] = useState<number>(1);
  const [isSubmittingRank, setIsSubmittingRank] = useState(false);
  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDeleteItem) return;

    setDeletingId(confirmDeleteItem.id);
    setError(null);

    const res = await deleteItem(confirmDeleteItem.id);
    setDeletingId(null);

    if (res.success) {
      setConfirmDeleteItem(null);
      onRefresh();
    } else {
      setError(res.error || t("error_delete_item"));
    }
  };

  const handleMove = async (itemId: string, direction: "up" | "down") => {
    if (!onMoveItem || movingItemId) return;
    setMovingItemId(itemId);
    try {
      await onMoveItem(itemId, direction);
    } catch {
      setError(t("error_swap_item_order"));
    } finally {
      setMovingItemId(null);
    }
  };

  const handleOpenJumpModal = (item: MasterItem, currentRank: number) => {
    setJumpItem({ item, currentRank });
    setTargetRankInput(currentRank);
  };

  const handleConfirmJump = async () => {
    if (!jumpItem || !onSetItemPosition || isSubmittingRank) return;

    const rank = Math.max(1, targetRankInput);
    setIsSubmittingRank(true);
    try {
      await onSetItemPosition(jumpItem.item.id, rank);
      setJumpItem(null);
    } catch {
      setError(t("error_set_item_position"));
    } finally {
      setIsSubmittingRank(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">{t("empty_items_title")}</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          {t("empty_items_desc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2 animate-shake">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-bold text-rose-600 underline"
          >
            {t("close")}
          </button>
        </div>
      )}

      {items.map((item, index) => {
        const itemRank = index + 1;
        const isFirst = index === 0;
        const isLast = index === items.length - 1;
        const isCurrentlyMoving = movingItemId === item.id;

        return (
          <div
            key={item.id}
            className={`p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col gap-2.5 ${
              isCurrentlyMoving ? "opacity-60 bg-blue-50/20 ring-2 ring-blue-400" : ""
            }`}
          >
            {/* Top row: Rank, Name & Controls */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                {/* Clickable Rank Badge for Direct Jump */}
                <button
                  type="button"
                  onClick={() => handleOpenJumpModal(item, itemRank)}
                  title={t("rank_tooltip")}
                  className="mt-0.5 px-2 py-1 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-800 active:scale-95 text-slate-700 text-xs font-black flex items-center gap-0.5 transition-all border border-slate-200/80 shadow-2xs shrink-0 touch-manipulation"
                >
                  <Hash className="w-3 h-3 text-slate-400" />
                  <span>{itemRank}</span>
                </button>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-800 leading-snug">
                    {item.name}
                  </h3>
                  {item.supplier && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                      <Building2 className="w-3 h-3 text-blue-500" />
                      <span className="truncate max-w-[180px]">{item.supplier.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Controls: Move Up/Down Steppers + Edit + Delete */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Reorder Steppers */}
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200/70 mr-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "up")}
                    disabled={isFirst || Boolean(movingItemId)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white active:bg-blue-50 disabled:opacity-25 disabled:pointer-events-none transition-all touch-manipulation"
                    title={t("move_up")}
                    aria-label={`Move ${item.name} up`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <div className="w-px h-3.5 bg-slate-200" />
                  <button
                    type="button"
                    onClick={() => handleMove(item.id, "down")}
                    disabled={isLast || Boolean(movingItemId)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-white active:bg-blue-50 disabled:opacity-25 disabled:pointer-events-none transition-all touch-manipulation"
                    title={t("move_down")}
                    aria-label={`Move ${item.name} down`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                  title={t("edit_item_tooltip")}
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteItem(item)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors touch-manipulation"
                  title={t("delete_item_tooltip")}
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Middle row: Unit, Price and Details */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="text-[11px] font-medium text-slate-400">{t("counting_unit_label")}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                  {item.unit}
                </span>
                <span className="text-[11px] font-medium text-slate-400 ml-1">{t("price_colon_label")}</span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 font-bold text-emerald-700 border border-emerald-200">
                  ฿{item.unitPrice.toLocaleString(lang === "en" ? "en-US" : "th-TH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </span>
              </div>

              {item.note && (
                <div className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-[200px]">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.note}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Direct Jump to Rank Modal */}
      {jumpItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-inner">
              <ArrowUpDown className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-800">{t("reorder_modal_title")}</h3>
              <p className="text-xs text-slate-500">
                {t("item_colon_label")} <strong className="text-slate-800">{jumpItem.item.name}</strong>
              </p>
              <div className="text-xs text-slate-400">
                {t("current_rank_label").replace("{rank}", String(jumpItem.currentRank)).replace("{total}", String(items.length))}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 text-center">
                {t("target_rank_label")}
              </label>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setTargetRankInput((prev) => Math.max(1, prev - 1))}
                  className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors touch-manipulation"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={items.length}
                  value={targetRankInput}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setTargetRankInput(isNaN(val) ? 1 : Math.max(1, Math.min(items.length, val)));
                  }}
                  className="w-24 h-12 text-center text-2xl font-black text-blue-700 bg-slate-50 border-2 border-blue-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setTargetRankInput((prev) => Math.min(items.length, prev + 1))}
                  className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-lg flex items-center justify-center transition-colors touch-manipulation"
                >
                  +
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTargetRankInput(1)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  {t("rank_first")}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetRankInput(items.length)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                >
                  {t("rank_last").replace("{total}", String(items.length))}
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                disabled={isSubmittingRank}
                onClick={() => setJumpItem(null)}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={isSubmittingRank}
                onClick={handleConfirmJump}
                className="flex-1 min-h-[46px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-70 shadow-blue-500/20"
              >
                {isSubmittingRank ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("moving_rank")}</span>
                  </>
                ) : (
                  <span>{t("save_rank")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">
                {t("delete_item_confirm_title")}
              </h3>
              <p className="text-sm text-slate-600">
                {t("delete_item_confirm_desc").replace("{name}", confirmDeleteItem.name)}
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteItem(null)}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                {t("cancel")}
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={handleDelete}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all touch-manipulation disabled:opacity-70"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("deleting")}</span>
                  </>
                ) : (
                  <span>{t("confirm_delete")}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ItemList;
