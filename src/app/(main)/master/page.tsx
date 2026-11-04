import { prisma } from "@/lib/prisma";
import { MasterView } from "./MasterView";

export const dynamic = "force-dynamic";

export default async function MasterDataPage() {
  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.item.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            minOrderAmount: true,
          },
        },
      },
      orderBy: [{ supplier: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      <MasterView initialSuppliers={suppliers} initialItems={items} />
    </div>
  );
}
