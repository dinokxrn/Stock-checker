"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

export interface ArchiveSnapshotResult {
  id: string;
  snapshotDate: Date;
  note: string | null;
  totalItemsChecked: number;
  totalOutOfStock: number;
  totalOrderAmount: number;
  createdAt: Date;
  itemsCount: number;
}

/**
 * Execute atomic snapshot archiving and weekly stock reset.
 * 
 * Logic:
 * 1. Read all current live items and their suppliers.
 * 2. Calculate summary statistics (totalItemsChecked, totalOutOfStock, totalOrderAmount).
 * 3. In an atomic transaction:
 *    a. Create SnapshotArchive record with frozen summary statistics and optional note.
 *    b. Create SnapshotItem records for all items, capturing frozen supplierName, itemName,
 *       unit, unitPrice, status, remain, ordered, and lineTotal.
 *    c. Reset all live items in `Item` table back to status: "NONE", remain: null, ordered: null.
 * 4. Trigger safe cache revalidation.
 */
export async function archiveAndResetWeeklyStock(note?: string) {
  try {
    const trimmedNote = note && note.trim().length > 0 ? note.trim() : null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch all items with supplier names
      const items = await tx.item.findMany({
        include: {
          supplier: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [
          { supplier: { name: "asc" } },
          { name: "asc" },
        ],
      });

      if (items.length === 0) {
        throw new Error("ไม่พบรายการสินค้าในระบบที่จะจัดเก็บ");
      }

      // 2. Compute snapshot metrics
      let totalItemsChecked = 0;
      let totalOutOfStock = 0;
      let totalOrderAmount = 0;

      const snapshotItemsData = items.map((item) => {
        const isChecked = item.status !== "NONE";
        if (isChecked) {
          totalItemsChecked++;
        }

        const isOutOfStock = item.status === "OUT_OF_STOCK";
        let orderQty: number | null = null;
        let lineTotal = 0;

        if (isOutOfStock) {
          totalOutOfStock++;
          orderQty = item.ordered && item.ordered > 0 ? item.ordered : 1;
          lineTotal = item.unitPrice * orderQty;
          totalOrderAmount += lineTotal;
        }

        return {
          supplierName: item.supplier.name,
          itemName: item.name,
          unit: item.unit,
          unitPrice: item.unitPrice,
          status: item.status,
          remain: item.remain,
          ordered: orderQty,
          lineTotal,
        };
      });

      // 3. Create SnapshotArchive record with nested SnapshotItems
      const snapshot = await tx.snapshotArchive.create({
        data: {
          snapshotDate: new Date(),
          note: trimmedNote,
          totalItemsChecked,
          totalOutOfStock,
          totalOrderAmount,
          items: {
            create: snapshotItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Atomically reset all live items to NONE
      await tx.item.updateMany({
        data: {
          status: "NONE",
          remain: null,
          ordered: null,
        },
      });

      return snapshot;
    });

    safeRevalidate();

    return {
      success: true,
      data: {
        id: result.id,
        snapshotDate: result.snapshotDate,
        note: result.note,
        totalItemsChecked: result.totalItemsChecked,
        totalOutOfStock: result.totalOutOfStock,
        totalOrderAmount: result.totalOrderAmount,
        createdAt: result.createdAt,
        itemsCount: result.items.length,
      },
    };
  } catch (error) {
    console.error("Failed to archive and reset weekly stock:", error);
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการบันทึกและรีเซ็ตสต็อก";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Retrieve all past snapshot archives with their item details.
 */
export async function getSnapshotsAction() {
  try {
    const snapshots = await prisma.snapshotArchive.findMany({
      include: {
        items: {
          orderBy: [
            { supplierName: "asc" },
            { itemName: "asc" },
          ],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: snapshots,
    };
  } catch (error) {
    console.error("Failed to fetch snapshots:", error);
    return {
      success: false,
      error: "ไม่สามารถดึงข้อมูลประวัติย้อนหลังได้",
      data: [],
    };
  }
}

/**
 * Delete a past snapshot archive (cascades to all associated SnapshotItems).
 */
export async function deleteSnapshotAction(snapshotId: string) {
  try {
    if (!snapshotId) {
      return { success: false, error: "ระบุรหัสประวัติย้อนหลังที่ต้องการลบ" };
    }

    await prisma.snapshotArchive.delete({
      where: { id: snapshotId },
    });

    safeRevalidate();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete snapshot archive:", error);
    return {
      success: false,
      error: "ไม่สามารถลบข้อมูลประวัติการนับย้อนหลังได้",
    };
  }
}
