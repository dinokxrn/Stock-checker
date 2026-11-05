"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type StockStatus = "NONE" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

function safeRevalidate() {
  try {
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/master");
    revalidatePath("/history");
  } catch {
    // Gracefully ignore when executed outside Next.js request context (e.g. CLI tests)
  }
}

/**
 * Update stock status, remain count, and ordered quantity for an item with strict sanitization.
 * 
 * Sanitization Rules:
 * - NONE: remain = null, ordered = null
 * - IN_STOCK: remain = Math.max(0, remain ?? 0), ordered = null (prevents phantom order totals)
 * - LOW_STOCK: remain = Math.max(0, remain ?? 0), ordered = null (prevents phantom order totals)
 * - OUT_OF_STOCK: remain = 0, ordered = Math.max(1, ordered ?? 1) (mandatory order quantity >= 1)
 */
export async function updateItemStockStatus(
  itemId: string,
  status: StockStatus,
  remain?: number | null,
  ordered?: number | null
) {
  try {
    if (!itemId) {
      return { success: false, error: "ไม่พบรหัสสินค้า (Item ID required)" };
    }

    const validStatuses: StockStatus[] = ["NONE", "IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"];
    if (!validStatuses.includes(status)) {
      return { success: false, error: "สถานะไม่ถูกต้อง (Invalid status)" };
    }

    let sanitizedRemain: number | null = null;
    let sanitizedOrdered: number | null = null;

    if (status === "NONE") {
      sanitizedRemain = null;
      sanitizedOrdered = null;
    } else if (status === "IN_STOCK" || status === "LOW_STOCK") {
      sanitizedRemain =
        remain !== null && remain !== undefined && !isNaN(Number(remain))
          ? Math.max(0, Number(remain))
          : 0;
      sanitizedOrdered = null;
    } else if (status === "OUT_OF_STOCK") {
      sanitizedRemain = 0;
      sanitizedOrdered =
        ordered !== null && ordered !== undefined && !isNaN(Number(ordered))
          ? Math.max(1, Number(ordered))
          : 1;
    }

    const updatedItem = await prisma.item.update({
      where: { id: itemId },
      data: {
        status,
        remain: sanitizedRemain,
        ordered: sanitizedOrdered,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            minOrderAmount: true,
          },
        },
      },
    });

    safeRevalidate();
    return { success: true, data: updatedItem };
  } catch (error) {
    console.error("Failed to update item stock status:", error);
    return { success: false, error: "ไม่สามารถบันทึกสถานะสต็อกได้" };
  }
}

/**
 * Toggle or set ordered status for an item (e.g. "สั่งแล้ว" / "ยังไม่สั่ง")
 */
export async function toggleItemOrderedStatus(itemId: string, isOrdered?: boolean) {
  try {
    if (!itemId) {
      return { success: false, error: "ไม่พบรหัสสินค้า" };
    }

    let nextState = isOrdered;
    if (nextState === undefined) {
      const current = await prisma.item.findUnique({
        where: { id: itemId },
        select: { isOrdered: true },
      });
      nextState = !current?.isOrdered;
    }

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: { isOrdered: nextState },
    });

    safeRevalidate();
    return { success: true, isOrdered: updated.isOrdered };
  } catch (error) {
    console.error("Failed to toggle item ordered status:", error);
    return { success: false, error: "ไม่สามารถอัปเดตสถานะการสั่งซื้อได้" };
  }
}

/**
 * Bulk toggle ordered status for all out-of-stock / low-stock items of a supplier
 */
export async function toggleSupplierItemsOrdered(supplierId: string, isOrdered: boolean) {
  try {
    if (!supplierId) {
      return { success: false, error: "ไม่พบรหัสบริษัทคู่ค้า" };
    }

    await prisma.item.updateMany({
      where: {
        supplierId,
        status: { in: ["OUT_OF_STOCK", "LOW_STOCK"] },
      },
      data: { isOrdered },
    });

    safeRevalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle supplier items ordered status:", error);
    return { success: false, error: "ไม่สามารถอัปเดตสถานะการสั่งซื้อของบริษัทได้" };
  }
}

/**
 * Fetch all items formatted for stock checking with supplier information.
 */
export async function getStockItems(supplierId?: string, search?: string, status?: StockStatus) {
  try {
    const where: {
      supplierId?: string;
      status?: string;
      OR?: Array<{ name: { contains: string } } | { note: { contains: string } }>;
    } = {};

    if (supplierId && supplierId !== "ALL") {
      where.supplierId = supplierId;
    }

    if (status && status !== ("ALL" as unknown)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { note: { contains: term } },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            minOrderAmount: true,
          },
        },
      },
      orderBy: [
        { supplier: { name: "asc" } },
        { name: "asc" },
      ],
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch stock items:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลรายการสต็อกได้" };
  }
}
