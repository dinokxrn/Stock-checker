"use client";

import { useState } from "react";
import { deleteSupplier } from "@/actions/master-data";
import { getSupplierScheduleStatus } from "@/lib/order-schedule";
import {
  Building2,
  Phone,
  Package,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  Calendar,
} from "lucide-react";

export interface SupplierItem {
  id: string;
  name: string;
  contactPhone: string | null;
  note: string | null;
  minOrderAmount: number;
  orderDays?: string | null;
  _count?: {
    items: number;
  };
}

interface SupplierListProps {
  suppliers: SupplierItem[];
  onEdit: (supplier: SupplierItem) => void;
  onRefresh: () => void;
}

export function SupplierList({
  suppliers,
  onEdit,
  onRefresh,
}: SupplierListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState<SupplierItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDeleteSupplier) return;

    setDeletingId(confirmDeleteSupplier.id);
    setError(null);

    const res = await deleteSupplier(confirmDeleteSupplier.id);
    setDeletingId(null);

    if (res.success) {
      setConfirmDeleteSupplier(null);
      onRefresh();
    } else {
      setError(res.error || "ไม่สามารถลบข้อมูลคู่ค้าได้");
    }
  };

  if (suppliers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-700 mb-1">ยังไม่มีข้อมูลบริษัทคู่ค้า</h3>
        <p className="text-xs text-slate-500 max-w-xs">
          กดปุ่ม &quot;เพิ่มคู่ค้าใหม่&quot; ด้านบนเพื่อเริ่มต้นสร้างข้อมูลบริษัทและกำหนดเกณฑ์ยอดสั่งซื้อขั้นต่ำ
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

      {suppliers.map((supplier) => {
        const itemCount = supplier._count?.items ?? 0;

        return (
          <div
            key={supplier.id}
            className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col gap-3"
          >
            {/* Top row: Name & Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 truncate">
                    {supplier.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <Package className="w-3.5 h-3.5 text-slate-400" />
                      {itemCount} รายการสินค้า
                    </span>
                    {(() => {
                      const schedule = getSupplierScheduleStatus(supplier.orderDays);
                      if (!schedule) return null;
                      return (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${schedule.badgeClass}`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{schedule.badgeText}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Items Count & Min Order Badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                  <Package className="w-3.5 h-3.5 text-slate-500" />
                  {supplier._count?.items ?? 0} รายการ
                </span>
                {supplier.minOrderAmount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    ขั้นต่ำ ฿{supplier.minOrderAmount.toLocaleString("th-TH")}
                  </span>
                )}
              </div>
            </div>

            {/* Optional Phone & Note */}
            {(supplier.contactPhone || supplier.note) && (
              <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5 text-xs text-slate-600">
                {supplier.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>โทร:</span>
                    <a
                      href={`tel:${supplier.contactPhone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {supplier.contactPhone}
                    </a>
                  </div>
                )}
                {supplier.note && (
                  <div className="flex items-start gap-1.5 text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{supplier.note}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons with 48px touch targets */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onEdit(supplier)}
                className="flex-1 min-h-[48px] px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors touch-manipulation"
              >
                <Pencil className="w-4 h-4 text-slate-500" />
                <span>แก้ไขคู่ค้า</span>
              </button>

              <button
                type="button"
                onClick={() => setConfirmDeleteSupplier(supplier)}
                className="w-12 min-h-[48px] flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-600 transition-colors touch-manipulation"
                title="ลบคู่ค้า"
                aria-label={`ลบ ${supplier.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {confirmDeleteSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-800">
                ยืนยันการลบคู่ค้า?
              </h3>
              <p className="text-sm text-slate-600">
                คุณแน่ใจหรือไม่ว่าต้องการลบ{" "}
                <span className="font-semibold text-slate-900">
                  &quot;{confirmDeleteSupplier.name}&quot;
                </span>
                ?
              </p>
              {(confirmDeleteSupplier._count?.items ?? 0) > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-left mt-2">
                  ⚠️ คำเตือน: คู่ค้านี้มีสินค้าผูกอยู่{" "}
                  <span className="font-bold">
                    {confirmDeleteSupplier._count?.items} รายการ
                  </span>{" "}
                  การลบคู่ค้าจะลบรายการสินค้าที่ผูกอยู่ทั้งหมดโดยอัตโนมัติ (Cascade)
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setConfirmDeleteSupplier(null)}
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
