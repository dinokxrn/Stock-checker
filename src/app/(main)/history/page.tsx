import React from "react";
import { History } from "lucide-react";

export default function HistoryPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center min-h-[60vh]">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-sm border border-indigo-100">
        <History className="w-7 h-7" />
      </div>
      <h2 className="text-lg font-bold text-slate-800">ประวัติการนับย้อนหลัง (History Log)</h2>
      <p className="text-xs text-slate-500 max-w-xs mt-1">
        ดูประวัติการนับสต็อกและ Snapshot ประจำสัปดาห์ที่บันทึกไว้ในฐานข้อมูล (ขั้นตอน [G4])
      </p>
    </div>
  );
}
