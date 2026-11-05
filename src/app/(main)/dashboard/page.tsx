import React from "react";
import { prisma } from "@/lib/prisma";
import OrderDashboardView, { DashboardSupplier } from "@/components/dashboard/OrderDashboardView";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch suppliers and their associated items from SQLite database
  const suppliers = await prisma.supplier.findMany({
    include: {
      items: {
        orderBy: [
          { status: "desc" },
          { sortOrder: "asc" },
          { name: "asc" },
        ],
      },
    },
    orderBy: [
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });

  // Ensure serialization into pure dashboard props
  const sanitizedSuppliers: DashboardSupplier[] = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    contactPhone: s.contactPhone,
    note: s.note,
    minOrderAmount: s.minOrderAmount,
    orderDays: s.orderDays,
    items: s.items.map((i) => ({
      id: i.id,
      name: i.name,
      unit: i.unit,
      unitPrice: i.unitPrice,
      note: i.note,
      status: i.status,
      remain: i.remain,
      ordered: i.ordered,
      isOrdered: i.isOrdered,
      supplierId: i.supplierId,
    })),
  }));

  return <OrderDashboardView initialSuppliers={sanitizedSuppliers} />;
}
