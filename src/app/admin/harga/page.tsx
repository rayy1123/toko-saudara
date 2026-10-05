"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  History,
  Sparkles,
  Save,
  Check,
} from "lucide-react";

interface PriceUnit {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitName: string;
  price: number;
  costPrice: number | null;
  stockQuantity: number;
}

interface PriceHistoryEntry {
  id: string;
  productUnitId: string;
  productName: string;
  sku: string;
  unitName: string;
  price: number;
  createdAt: string;
  createdBy?: string;
}

export default function AdminHargaPage() {
  const [units, setUnits] = useState<PriceUnit[]>([]);
  const [histories, setHistories] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // In-line price update states
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});
  const [savingUnitId, setSavingUnitId] = useState<string | null>(null);
  const [savedUnitId, setSavedUnitId] = useState<string | null>(null);

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [invRes, histRes] = await Promise.all([
        fetch("/api/v1/admin/inventory?limit=100"),
        fetch("/api/v1/admin/prices/history?limit=30"),
      ]);

      const invJson = await invRes.json();
      const histJson = await histRes.json();

      if (invJson.data) {
        setUnits(invJson.data);
        // Initialize editing prices map
        const priceMap: Record<string, string> = {};
        for (const u of invJson.data) {
          priceMap[u.id] = String(u.price);
        }
        setEditingPrices(priceMap);
      }
      if (histJson.data) {
        setHistories(histJson.data);
      }
    } catch {
      showToast("error", "Gagal memuat data harga dan riwayat perubahan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleUpdatePrice(unit: PriceUnit) {
    const newPriceVal = Number(editingPrices[unit.id]);
    if (isNaN(newPriceVal) || newPriceVal < 0) {
      showToast("error", "Harga tidak valid");
      return;
    }

    if (newPriceVal === unit.price) {
      showToast("error", "Harga baru sama dengan harga saat ini");
      return;
    }

    setSavingUnitId(unit.id);
    try {
      const res = await fetch("/api/v1/admin/prices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUnitId: unit.id,
          price: newPriceVal,
          note: `Update harga harian pasar: ${unit.productName} (${unit.unitName})`,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal memperbarui harga");

      showToast(
        "success",
        `Harga "${unit.productName}" (${unit.unitName}) berhasil diubah menjadi ${formatRupiah(newPriceVal)}`
      );

      setSavedUnitId(unit.id);
      setTimeout(() => setSavedUnitId(null), 2500);
      loadData();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setSavingUnitId(null);
    }
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  // Quick commodity filters (Cabai, Bawang, Sayur, Telur, Beras)
  const COMMODITIES = [
    { id: "ALL", label: "Semua Komoditas" },
    { id: "Cabai", label: "Cabai" },
    { id: "Bawang", label: "Bawang" },
    { id: "Sayur", label: "Sayur Segar" },
    { id: "Telur", label: "Telur" },
    { id: "Beras", label: "Beras" },
  ];

  const filteredUnits = units.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      search === "" ||
      u.productName.toLowerCase().includes(q) ||
      u.sku.toLowerCase().includes(q) ||
      u.unitName.toLowerCase().includes(q);

    let matchCommodity = true;
    if (selectedCategory !== "ALL") {
      matchCommodity =
        u.productName.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        u.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
    }

    return matchSearch && matchCommodity;
  });

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
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-700" />
            Harga Hari Ini (Daily Market Price)
          </h1>
          <p className="text-sm text-stone-500">
            Penyesuaian cepat harga pasar fluktuatif untuk sayur, cabai, bawang, beras &amp; sembako
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl border border-stone-200 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Segarkan Data
        </button>
      </div>

      {/* Commodity Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {COMMODITIES.map((c) => {
          const isActive = selectedCategory === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari komoditas (Cabai Rawit, Bawang Merah, dsb)..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Quick Price Update Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Pembaruan Cepat Harga Komoditas</h2>
            <p className="text-xs text-stone-400">
              Setiap kali harga disimpan, sistem otomatis mencatat ke tabel PriceHistory &amp; AuditEvent
            </p>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {filteredUnits.length} Varian Tersedia
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Komoditas &amp; Varian</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Modal (Ref)</th>
                <th className="py-3 px-4">Harga Jual Aktif</th>
                <th className="py-3 px-4 min-w-[200px]">Ubah Harga Hari Ini (Rp)</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Memuat daftar harga...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400 text-sm">
                    Tidak ada komoditas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((u) => {
                  const isSaving = savingUnitId === u.id;
                  const isSaved = savedUnitId === u.id;
                  const currentVal = editingPrices[u.id] ?? String(u.price);
                  const hasChanged = Number(currentVal) !== u.price && currentVal !== "";

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-stone-900 text-sm">{u.productName}</div>
                        <div className="text-xs text-stone-500">{u.unitName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">SKU: {u.sku}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-medium text-stone-700">
                        <span className="px-2.5 py-1 bg-stone-100 rounded-lg">{u.categoryName}</span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-stone-500">
                        {u.costPrice ? formatRupiah(u.costPrice) : "—"}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-sm font-bold text-stone-900 block">
                          {formatRupiah(u.price)}
                        </span>
                        <span className="text-[10px] text-stone-400">Harga server aktif</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-xs text-stone-400 font-semibold">
                            Rp
                          </span>
                          <input
                            type="number"
                            value={currentVal}
                            onChange={(e) =>
                              setEditingPrices({ ...editingPrices, [u.id]: e.target.value })
                            }
                            placeholder={String(u.price)}
                            className={`w-full pl-9 pr-3 py-1.5 border rounded-xl text-sm font-bold transition focus:outline-none focus:ring-2 ${
                              hasChanged
                                ? "bg-amber-50/80 border-amber-300 text-amber-950 focus:ring-amber-500"
                                : "bg-stone-50 border-stone-200 text-stone-800 focus:ring-emerald-600 focus:bg-white"
                            }`}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-200">
                            <Check className="w-3.5 h-3.5" /> Tersimpan
                          </span>
                        ) : (
                          <button
                            onClick={() => handleUpdatePrice(u)}
                            disabled={isSaving || !hasChanged}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                              hasChanged
                                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs cursor-pointer"
                                : "bg-stone-100 text-stone-400 cursor-not-allowed"
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSaving ? "Menyimpan..." : "Update"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Price Table Preview */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-700" />
              Riwayat Perubahan Harga (Price History Audit Log)
            </h2>
            <p className="text-xs text-stone-400">
              Log riwayat fluktuasi harga komoditas pasar dari waktu ke waktu
            </p>
          </div>
          <span className="text-xs text-stone-400">{histories.length} catatan riwayat</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">Waktu Perubahan</th>
                <th className="py-3 px-4">Komoditas &amp; Varian</th>
                <th className="py-3 px-4">Harga Terpasang</th>
                <th className="py-3 px-4">Diubah Oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                    Memuat riwayat harga...
                  </td>
                </tr>
              ) : histories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                    Belum ada riwayat perubahan harga.
                  </td>
                </tr>
              ) : (
                histories.map((h) => (
                  <tr key={h.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 text-xs text-stone-500 whitespace-nowrap">
                      {new Date(h.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-stone-900 text-xs">{h.productName}</div>
                      <div className="text-[11px] text-stone-400">{h.unitName} ({h.sku})</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-800 text-xs">
                      {formatRupiah(h.price)}
                    </td>
                    <td className="py-3 px-4 text-xs text-stone-500">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-[11px]">
                        {h.createdBy ? "Admin Toko" : "Sistem"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
