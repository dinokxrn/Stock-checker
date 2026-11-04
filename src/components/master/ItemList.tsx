"use client";

import { useState } from "react";
import { deleteItem } from "@/actions/master-data";
import {
  Package,
  Building2,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
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
}

export function ItemList({ items, onEdit, onRefresh }: ItemListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<MasterItem | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(res.error || "ไม่สามารถลบรายการสินค้าได้");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Package className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">ไม่พบรายการสินค้า</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          ยังไม่มีสินค้าที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก กดปุ่ม &quot;เพิ่มสินค้าใหม่&quot; เพื่อเริ่มต้น
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col gap-2.5"
        >
          {/* Top row: Name & Supplier */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-800 leading-snug">
                {item.name}
              </h3>
              {item.supplier && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  <Building2 className="w-3 h-3 text-blue-500" />
                  <span className="truncate max-w-[200px]">{item.supplier.name}</span>
                </div>
              )}
            </div>

            {/* Quick Actions (min 48px touch target) */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
                title="แก้ไขรายละเอียดสินค้า"
                aria-label={`แก้ไข ${item.name}`}
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteItem(item)}
                className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors touch-manipulation"
                title="ลบสินค้า"
                aria-label={`ลบ ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Middle row: Unit and Details */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] font-medium text-slate-400">หน่วยนับ:</span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                {item.unit}
              </span>
            </div>

            {item.note && (
              <div className="flex items-center gap-1 text-xs text-slate-500 truncate max-w-[200px]">
                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{item.note}</span>
              </div>
            )}
          </div>

          {/* Note if available */}
          {item.note && (
            <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-500">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span className="line-clamp-2">{item.note}</span>
            </div>
          )}
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      {confirmDeleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">
                ยืนยันการลบสินค้า?
              </h3>
              <p className="text-sm text-slate-600">
                คุณต้องการลบรายการสินค้า{" "}
                <span className="font-semibold text-slate-900">
                  &quot;{confirmDeleteItem.name}&quot;
                </span>{" "}
                ออกจากระบบใช่หรือไม่?
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteItem(null)}
                className="flex-1 min-h-[48px] px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
              >
                ยกเลิก
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
                    <span>กำลังลบ...</span>
                  </>
                ) : (
                  <span>ยืนยันการลบ</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
