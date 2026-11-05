import { prisma } from "@/lib/prisma";
import { StockCheckingView } from "@/components/stock/StockCheckingView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({
      select: {
        id: true,
        name: true,
        minOrderAmount: true,
        orderDays: true,
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
            orderDays: true,
          },
        },
      },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
    }),
  ]);

  return <StockCheckingView initialItems={items} suppliers={suppliers} />;
}
