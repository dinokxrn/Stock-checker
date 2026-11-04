"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function safeRevalidate() {
  try {
    revalidatePath("/master");
    revalidatePath("/");
    revalidatePath("/dashboard");
  } catch {
    // Gracefully ignore when executed outside Next.js request context (e.g. CLI tests)
  }
}

export interface SupplierInput {
  name: string;
  contactPhone?: string | null;
  note?: string | null;
  minOrderAmount: number;
  orderDays?: string | null;
}

export interface ItemInput {
  name: string;
  unit: string;
  unitPrice: number;
  note?: string | null;
  supplierId: string;
}

/**
 * Fetch all suppliers with item counts and sorted by name
 */
export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: {
        _count: {
          select: { items: true },
        },
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: suppliers };
  } catch (error) {
    console.error("Failed to fetch suppliers:", error);
    return { success: false, error: "ไม่สามารถดึงข้อมูลคู่ค้าได้" };
  }
}

/**
 * Create a new supplier
 */
export async function createSupplier(data: SupplierInput) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "กรุณาระบุชื่อบริษัทคู่ค้า" };
    }

    const minAmount = Math.max(0, Number(data.minOrderAmount) || 0);

    const supplier = await prisma.supplier.create({
      data: {
        name: data.name.trim(),
        contactPhone: data.contactPhone?.trim() || null,
        note: data.note?.trim() || null,
        minOrderAmount: minAmount,
        orderDays: data.orderDays?.trim() || null,
      },
    });

    safeRevalidate();
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Failed to create supplier:", error);
    return { success: false, error: "ไม่สามารถเพิ่มข้อมูลคู่ค้าได้" };
  }
}

/**
 * Update an existing supplier
 */
export async function updateSupplier(id: string, data: Partial<SupplierInput>) {
  try {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: "ชื่อคู่ค้าต้องไม่เป็นค่าว่าง" };
    }

    const updateData: {
      name?: string;
      contactPhone?: string | null;
      note?: string | null;
      minOrderAmount?: number;
      orderDays?: string | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.contactPhone !== undefined) updateData.contactPhone = data.contactPhone?.trim() || null;
    if (data.note !== undefined) updateData.note = data.note?.trim() || null;
    if (data.orderDays !== undefined) updateData.orderDays = data.orderDays?.trim() || null;
    if (data.minOrderAmount !== undefined) {
      updateData.minOrderAmount = Math.max(0, Number(data.minOrderAmount) || 0);
    }

    const supplier = await prisma.supplier.update({
      where: { id },
      data: updateData,
    });

    safeRevalidate();
    return { success: true, data: supplier };
  } catch (error) {
    console.error("Failed to update supplier:", error);
    return { success: false, error: "ไม่สามารถแก้ไขข้อมูลคู่ค้าได้" };
  }
}

/**
 * Delete a supplier (cascades to items)
 */
export async function deleteSupplier(id: string) {
  try {
    const deleted = await prisma.supplier.delete({
      where: { id },
    });

    safeRevalidate();
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete supplier:", error);
    return { success: false, error: "ไม่สามารถลบข้อมูลคู่ค้าได้" };
  }
}

/**
 * Fetch all items, optionally filtered by supplierId or search keyword
 */
export async function getItems(supplierId?: string, search?: string) {
  try {
    const where: {
      supplierId?: string;
      OR?: Array<{ name: { contains: string } } | { note: { contains: string } }>;
    } = {};

    if (supplierId && supplierId !== "ALL") {
      where.supplierId = supplierId;
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
      orderBy: [{ supplier: { name: "asc" } }, { name: "asc" }],
    });

    return { success: true, data: items };
  } catch (error) {
    console.error("Failed to fetch items:", error);
    return { success: false, error: "ไม่สามารถดึงรายการสินค้าได้" };
  }
}

/**
 * Create a new item
 */
export async function createItem(data: ItemInput) {
  try {
    if (!data.name?.trim()) {
      return { success: false, error: "กรุณาระบุชื่อสินค้า" };
    }
    if (!data.supplierId) {
      return { success: false, error: "กรุณาเลือกบริษัทคู่ค้า" };
    }

    const unitPrice = Math.max(0, Number(data.unitPrice) || 0);
    const unit = data.unit?.trim() || "ชิ้น";

    const item = await prisma.item.create({
      data: {
        name: data.name.trim(),
        unit,
        unitPrice,
        note: data.note?.trim() || null,
        supplierId: data.supplierId,
        status: "NONE",
      },
      include: {
        supplier: true,
      },
    });

    safeRevalidate();
    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to create item:", error);
    return { success: false, error: "ไม่สามารถเพิ่มรายการสินค้าได้" };
  }
}

/**
 * Update an existing item
 */
export async function updateItem(id: string, data: Partial<ItemInput>) {
  try {
    if (data.name !== undefined && !data.name.trim()) {
      return { success: false, error: "ชื่อสินค้าต้องไม่เป็นค่าว่าง" };
    }

    const updateData: {
      name?: string;
      unit?: string;
      unitPrice?: number;
      note?: string | null;
      supplierId?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.unit !== undefined) updateData.unit = data.unit.trim() || "ชิ้น";
    if (data.unitPrice !== undefined) {
      updateData.unitPrice = Math.max(0, Number(data.unitPrice) || 0);
    }
    if (data.note !== undefined) updateData.note = data.note?.trim() || null;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId;

    const item = await prisma.item.update({
      where: { id },
      data: updateData,
      include: {
        supplier: true,
      },
    });

    safeRevalidate();
    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to update item:", error);
    return { success: false, error: "ไม่สามารถแก้ไขรายการสินค้าได้" };
  }
}

/**
 * Update item price in-place (quick edit with immediate feedback)
 */
export async function updateItemPrice(id: string, unitPrice: number) {
  try {
    const validPrice = Math.max(0, Number(unitPrice) || 0);

    const item = await prisma.item.update({
      where: { id },
      data: { unitPrice: validPrice },
      include: {
        supplier: true,
      },
    });

    safeRevalidate();
    return { success: true, data: item };
  } catch (error) {
    console.error("Failed to update item price:", error);
    return { success: false, error: "ไม่สามารถบันทึกราคาใหม่ได้" };
  }
}

/**
 * Delete an item
 */
export async function deleteItem(id: string) {
  try {
    const deleted = await prisma.item.delete({
      where: { id },
    });

    safeRevalidate();
    return { success: true, data: deleted };
  } catch (error) {
    console.error("Failed to delete item:", error);
    return { success: false, error: "ไม่สามารถลบรายการสินค้าได้" };
  }
}
