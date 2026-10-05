"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Boxes,
  PlusCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
} from "lucide-react";

interface InventoryUnit {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitName: string;
  unitCode: string;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  valuation: number;
}

interface InventoryMovementLog {
  id: string;
  productUnitId: string;
  productName: string;
  sku: string;
  unitName: string;
  type: string;
  quantityDelta: number;
  referenceType: string | null;
  referenceId: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string;
}

const MOVEMENT_TYPES = [
  { value: "PURCHASE", label: "PURCHASE — Pembelian dari Petani/Supplier (Tambah Stok)", sign: "+" },
  { value: "ADJUSTMENT_IN", label: "ADJUSTMENT_IN — Koreksi Tambah Fisik Gudang", sign: "+" },
  { value: "ADJUSTMENT_OUT", label: "ADJUSTMENT_OUT — Koreksi Kurang (Selisih Hitung)", sign: "-" },
  { value: "DAMAGE", label: "DAMAGE — Barang Rusak / Busuk / Sortiran Sore", sign: "-" },
  { value: "RETURN", label: "RETURN — Retur Pelanggan / Pengembalian", sign: "+" },
];

function InventoryContent() {
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get("unitId");

  const [units, setUnits] = useState<InventoryUnit[]>([]);
  const [movements, setMovements] = useState<InventoryMovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    productUnitId: "",
    type: "PURCHASE",
    quantity: "",
    note: "",
  });
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadInventoryData() {
    setLoading(true);
    try {
      const [invRes, movRes] = await Promise.all([
        fetch("/api/v1/admin/inventory?limit=100"),
        fetch("/api/v1/admin/inventory/movements?limit=30"),
      ]);

      const invJson = await invRes.json();
      const movJson = await movRes.json();

      if (invJson.data) setUnits(invJson.data);
      if (movJson.data) setMovements(movJson.data);
    } catch {
      showToast("error", "Gagal memuat data inventaris & pergerakan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventoryData();
  }, []);

  // Handle preselected unitId from query param
  useEffect(() => {
    if (preselectedUnitId && units.length > 0) {
      setAdjustForm((prev) => ({
        ...prev,
        productUnitId: preselectedUnitId,
      }));
      setIsDialogOpen(true);
    }
  }, [preselectedUnitId, units]);

  async function handleRecordMovement(e: React.FormEvent) {
    e.preventDefault();
    setAdjustLoading(true);

    try {
      const res = await fetch("/api/v1/admin/inventory/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUnitId: adjustForm.productUnitId,
          type: adjustForm.type,
          quantity: Number(adjustForm.quantity),
          note: adjustForm.note || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal mencatat mutasi stok");
      }

      showToast("success", `Mutasi stok berhasil! Stok baru: ${json.data.newStock}`);
      setIsDialogOpen(false);
      setAdjustForm({
        productUnitId: "",
        type: "PURCHASE",
        quantity: "",
        note: "",
      });
      loadInventoryData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setAdjustLoading(false);
    }
  }

  const filteredUnits = units.filter((u) => {
    const matchSearch =
      search === "" ||
      u.productName.toLowerCase().includes(search.toLowerCase()) ||
      u.sku.toLowerCase().includes(search.toLowerCase()) ||
      u.unitName.toLowerCase().includes(search.toLowerCase());
    const matchLow = !lowStockFilter || u.isLowStock;
    return matchSearch && matchLow;
  });

  const lowStockCount = units.filter((u) => u.isLowStock).length;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-sm shadow-sm ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Stok &amp; Inventori Pasar</h1>
          <p className="text-sm text-stone-500">
            Monitoring fisik gudang, mutasi pembelian supplier, dan audit ledger pergerakan stok
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadInventoryData}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 shadow-sm transition disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setAdjustForm({
                productUnitId: units[0]?.id || "",
                type: "PURCHASE",
                quantity: "",
                note: "",
              });
              setIsDialogOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Catat Mutasi Stok
          </button>
        </div>
      </div>

      {/* Low Stock Banner Warning */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Ada {lowStockCount} varian produk di bawah batas aman stok!</p>
              <p className="text-xs text-amber-800/80">
                Segera catat pembelian dari supplier atau petani lokal agar tidak kehabisan barang saat pasar ramai.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition shrink-0 ${
              lowStockFilter
                ? "bg-amber-600 text-white border-amber-700"
                : "bg-white text-amber-800 border-amber-300 hover:bg-amber-100"
            }`}
          >
            {lowStockFilter ? "Tampilkan Semua" : "Filter Stok Menipis"}
          </button>
        </div>
      )}

      {/* Stock Levels Table Card */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari komoditas, SKU, varian..."
              className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="text-xs text-stone-500 font-medium">
            Total Varian Terpantau: <span className="font-bold text-stone-900">{units.length} Unit</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Produk &amp; Kategori</th>
                <th className="py-3 px-4">Satuan / Varian</th>
                <th className="py-3 px-4">Tingkat Stok Saat Ini</th>
                <th className="py-3 px-4">Ambang Batas</th>
                <th className="py-3 px-4">Status Stok</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Memuat inventori gudang...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Tidak ada produk yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const isLow = u.isLowStock;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-stone-50/70 transition ${
                        isLow ? "bg-amber-50/30" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 text-sm">{u.productName}</div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {u.sku} &bull; {u.categoryName}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 text-xs">{u.unitName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-base font-bold ${
                              isLow ? "text-amber-700" : "text-stone-900"
                            }`}
                          >
                            {u.stockQuantity}
                          </span>
                          <span className="text-xs text-stone-400">{u.unitCode}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-500">
                        Min. {u.lowStockThreshold} {u.unitCode}
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Stok Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAdjustForm({
                              productUnitId: u.id,
                              type: "PURCHASE",
                              quantity: "",
                              note: "",
                            });
                            setIsDialogOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 rounded-lg text-xs font-semibold border border-stone-200 transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          Sesuaikan
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Trail Table: Recent Inventory Movements */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700" />
              Buku Kas Mutasi Stok (Inventory Ledger)
            </h2>
            <p className="text-xs text-stone-400">
              Riwayat lengkap pencatatan keluar-masuk stok dengan user pencatat &amp; alasan audit
            </p>
          </div>
          <span className="text-xs text-stone-400">{movements.length} mutasi terakhir</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Komoditas &amp; Varian</th>
                <th className="py-3 px-4">Tipe Mutasi</th>
                <th className="py-3 px-4">Jumlah Delta</th>
                <th className="py-3 px-4">Catatan / Referensi</th>
                <th className="py-3 px-4">Pencatat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Memuat log mutasi...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Belum ada riwayat mutasi stok tercatat.
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const isAddition = m.quantityDelta > 0;
                  return (
                    <tr key={m.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 text-xs">{m.productName}</div>
                        <div className="text-[11px] text-stone-400">{m.unitName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            m.type === "PURCHASE"
                              ? "bg-emerald-100 text-emerald-800"
                              : m.type === "SALE"
                              ? "bg-blue-100 text-blue-800"
                              : m.type === "DAMAGE"
                              ? "bg-red-100 text-red-800"
                              : m.type === "RETURN"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-stone-100 text-stone-800"
                          }`}
                        >
                          {m.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold text-xs ${
                            isAddition ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {isAddition ? (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5" />
                          )}
                          {isAddition ? `+${m.quantityDelta}` : m.quantityDelta}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600 max-w-xs">
                        <div>{m.note || "—"}</div>
                        {m.referenceId && (
                          <div className="text-[10px] text-stone-400 font-mono">
                            Ref: {m.referenceId} ({m.referenceType})
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-700 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px] font-medium">
                          {m.createdBy}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-700" />
                Catat Pergerakan &amp; Koreksi Stok
              </h3>
              <button onClick={() => setIsDialogOpen(false)} className="text-stone-400 hover:text-stone-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Pilih Produk &amp; Satuan
                </label>
                <select
                  required
                  value={adjustForm.productUnitId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, productUnitId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="">Pilih varian...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.productName} — {u.unitName} (Stok Saat Ini: {u.stockQuantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Tipe Pergerakan Stok
                </label>
                <select
                  required
                  value={adjustForm.type}
                  onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600"
                >
                  {MOVEMENT_TYPES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Jumlah Kuantitas
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  placeholder="e.g. 15 (selalu bernilai positif)"
                  value={adjustForm.quantity}
                  onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Sistem otomatis mengalikan tanda minus jika tipe pengurangan (ADJUSTMENT_OUT / DAMAGE).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Catatan Audit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sayur layu sortiran sore / Pasokan segar petani Lembang"
                  value={adjustForm.note}
                  onChange={(e) => setAdjustForm({ ...adjustForm, note: e.target.value })}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-sm font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition shadow-sm disabled:opacity-50"
                >
                  {adjustLoading ? "Mencatat..." : "Simpan ke Ledger"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInventoriPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Memuat inventori...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
