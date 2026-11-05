"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MasterFilterBar, MasterTab } from "@/components/master/MasterFilterBar";
import { ItemList, MasterItem } from "@/components/master/ItemList";
import { SupplierList, SupplierItem } from "@/components/master/SupplierList";
import { SupplierModal } from "@/components/master/SupplierModal";
import { ItemModal } from "@/components/master/ItemModal";
import { swapItemOrder, setItemSortPosition } from "@/actions/master-data";
import { RefreshCw, Database } from "lucide-react";

interface MasterViewProps {
  initialSuppliers: SupplierItem[];
  initialItems: MasterItem[];
}

export function MasterView({ initialSuppliers, initialItems }: MasterViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<MasterTab>("items");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("ALL");
  const [items, setItems] = useState<MasterItem[]>(initialItems);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Modals state
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierItem | null>(null);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  // Reordering handlers for walk sequence across ALL companies
  const handleMoveItem = async (itemId: string, direction: "up" | "down") => {
    // Current visible list in user's view (filteredItems)
    const currentList = [...filteredItems];
    const currentIndex = currentList.findIndex((i) => i.id === itemId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) {
      return;
    }

    const currentItem = currentList[currentIndex];
    const neighborItem = currentList[targetIndex];

    // Optimistically swap sortOrder in local state for 0ms response
    setItems((prevItems) => {
      const next = [...prevItems];
      const idxA = next.findIndex((i) => i.id === currentItem.id);
      const idxB = next.findIndex((i) => i.id === neighborItem.id);

      if (idxA !== -1 && idxB !== -1) {
        const orderA = next[idxA].sortOrder ?? (idxA + 1);
        const orderB = next[idxB].sortOrder ?? (idxB + 1);
        next[idxA] = { ...next[idxA], sortOrder: orderB };
        next[idxB] = { ...next[idxB], sortOrder: orderA };
        next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      }
      return next;
    });

    const res = await swapItemOrder(currentItem.id, neighborItem.id);
    if (!res.success) {
      setItems(initialItems); // Rollback on error
    } else {
      router.refresh();
    }
  };

  const handleSetItemPosition = async (itemId: string, targetPosition: number) => {
    const res = await setItemSortPosition(itemId, targetPosition);
    if (res.success) {
      router.refresh();
    }
  };

  // Filtered Items (0ms instant client response)
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSupplier =
        selectedSupplierId === "ALL" || item.supplierId === selectedSupplierId;

      if (!matchSupplier) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(query);
      const matchNote = item.note?.toLowerCase().includes(query) ?? false;
      const matchSupplierName =
        item.supplier?.name.toLowerCase().includes(query) ?? false;

      return matchName || matchNote || matchSupplierName;
    });
  }, [items, selectedSupplierId, searchQuery]);

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    if (!searchQuery.trim()) return initialSuppliers;

    const query = searchQuery.toLowerCase().trim();
    return initialSuppliers.filter((s) => {
      const matchName = s.name.toLowerCase().includes(query);
      const matchPhone = s.contactPhone?.toLowerCase().includes(query) ?? false;
      const matchNote = s.note?.toLowerCase().includes(query) ?? false;
      return matchName || matchPhone || matchNote;
    });
  }, [initialSuppliers, searchQuery]);

  const handleAddNew = () => {
    if (activeTab === "items") {
      setEditingItem(null);
      setItemModalOpen(true);
    } else {
      setEditingSupplier(null);
      setSupplierModalOpen(true);
    }
  };

  const handleEditSupplier = (supplier: SupplierItem) => {
    setEditingSupplier(supplier);
    setSupplierModalOpen(true);
  };

  const handleEditItem = (item: MasterItem) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col pb-6 space-y-4">
      {/* Sub-Header: Title and Refresh */}
      <div className="flex items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-snug">
              จัดการข้อมูลหลัก
            </h1>
            <p className="text-xs text-slate-500">
              Master Data (คู่ค้า {initialSuppliers.length} บริษัท / สินค้า {initialItems.length} รายการ)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isPending}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation"
          title="รีเฟรชข้อมูล"
          aria-label="รีเฟรชข้อมูล"
        >
          <RefreshCw
            className={`w-4 h-4 ${isPending ? "animate-spin text-blue-600" : ""}`}
          />
        </button>
      </div>

      {/* Filter and Control Area */}
      <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <MasterFilterBar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setSearchQuery("");
          }}
          itemCount={initialItems.length}
          supplierCount={initialSuppliers.length}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSupplierId={selectedSupplierId}
          onSupplierChange={setSelectedSupplierId}
          suppliers={initialSuppliers.map((s) => ({ id: s.id, name: s.name }))}
          onAddNew={handleAddNew}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {activeTab === "items" ? (
          <ItemList
            items={filteredItems}
            onEdit={handleEditItem}
            onRefresh={handleRefresh}
            onMoveItem={handleMoveItem}
            onSetItemPosition={handleSetItemPosition}
          />
        ) : (
          <SupplierList
            suppliers={filteredSuppliers}
            onEdit={handleEditSupplier}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={supplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSuccess={handleRefresh}
        supplier={editingSupplier}
      />

      {/* Item Modal */}
      <ItemModal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        onSuccess={handleRefresh}
        suppliers={initialSuppliers.map((s) => ({ id: s.id, name: s.name }))}
        defaultSupplierId={
          selectedSupplierId !== "ALL" ? selectedSupplierId : undefined
        }
        item={editingItem}
      />
    </div>
  );
}
