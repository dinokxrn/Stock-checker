import React from "react";
import { prisma } from "@/lib/prisma";
import HistoryLogView, { SnapshotArchiveData } from "@/components/history/HistoryLogView";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const snapshots = await prisma.snapshotArchive.findMany({
    include: {
      items: {
        orderBy: [{ supplierName: "asc" }, { itemName: "asc" }],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const sanitizedSnapshots: SnapshotArchiveData[] = snapshots.map((s) => ({
    id: s.id,
    snapshotDate: s.snapshotDate.toISOString(),
    note: s.note,
    totalItemsChecked: s.totalItemsChecked,
    totalOutOfStock: s.totalOutOfStock,
    totalOrderAmount: s.totalOrderAmount,
    createdAt: s.createdAt.toISOString(),
    items: s.items.map((i) => ({
      id: i.id,
      snapshotId: i.snapshotId,
      supplierName: i.supplierName,
      itemName: i.itemName,
      unit: i.unit,
      unitPrice: i.unitPrice,
      status: i.status,
      remain: i.remain,
      ordered: i.ordered,
      isOrdered: i.isOrdered,
      lineTotal: i.lineTotal,
    })),
  }));

  return <HistoryLogView initialSnapshots={sanitizedSnapshots} />;
}
