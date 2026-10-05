"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Banknote,
  ShoppingBag,
  Boxes,
  Calendar,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
} from "lucide-react";

interface SalesReport {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalDiscount: number;
    totalShipping: number;
  };
  salesByDate: Array<{ date: string; revenue: number; orderCount: number }>;
}

interface TopProduct {
  productId: string;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
}

interface InventoryValuation {
  summary: {
    totalActiveUnits: number;
    totalStockQuantity: number;
    totalValuationRetail: number;
    totalValuationCost: number;
    potentialGrossProfit: number;
    lowStockCount: number;
  };
  categoryBreakdown: Array<{
    categoryName: string;
    totalItems: number;
    totalStock: number;
    valuationRetail: number;
  }>;
}

export default function AdminLaporanPage() {
  const [salesPeriod, setSalesPeriod] = useState<"today" | "7d" | "30d">("30d");
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [valuation, setValuation] = useState<InventoryValuation | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    setLoading(true);

    const now = new Date();
    let startDate: Date;
    if (salesPeriod === "today") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (salesPeriod === "7d") {
      startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    }

    try {
      const [salesRes, prodRes, valRes] = await Promise.all([
        fetch(`/api/v1/admin/reports/sales?startDate=${startDate.toISOString()}&endDate=${now.toISOString()}`),
        fetch("/api/v1/admin/reports/products?limit=8"),
        fetch("/api/v1/admin/reports/inventory"),
      ]);

      const salesJson = await salesRes.json();
      const prodJson = await prodRes.json();
      const valJson = await valRes.json();

      if (salesJson.data) setSales(salesJson.data);
      if (prodJson.data) setTopProducts(prodJson.data.topProducts || []);
      if (valJson.data) setValuation(valJson.data);
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [salesPeriod]);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-700" />
            Laporan Kinerja &amp; Valuasi Toko
          </h1>
          <p className="text-sm text-stone-500">
            Metrik penjualan, komoditas paling diminati pasar, dan nilai aset stok gudang
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector Tabs */}
          <div className="bg-stone-200/80 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setSalesPeriod("today")}
              className={`px-3 py-1.5 rounded-lg transition ${
                salesPeriod === "today"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSalesPeriod("7d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                salesPeriod === "7d"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setSalesPeriod("30d")}
              className={`px-3 py-1.5 rounded-lg transition ${
                salesPeriod === "30d"
                  ? "bg-white text-stone-900 shadow-xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              30 Hari
            </button>
          </div>

          <button
            onClick={loadReports}
            disabled={loading}
            className="p-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards: Sales & Valuation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Omzet */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Omzet Penjualan
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {loading ? "..." : formatRupiah(sales?.summary.totalRevenue || 0)}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {sales?.summary.totalOrders || 0} transaksi berhasil
          </p>
        </div>

        {/* Nilai Rata-rata Pesanan (AOV) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Rata-rata Nilai Belanja
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {loading ? "..." : formatRupiah(sales?.summary.averageOrderValue || 0)}
          </div>
          <p className="text-xs text-stone-400 mt-1">Per keranjang belanja pelanggan</p>
        </div>

        {/* Total Nilai Stok Eceran */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Valuasi Eceran Gudang
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {loading ? "..." : formatRupiah(valuation?.summary.totalValuationRetail || 0)}
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Total {valuation?.summary.totalStockQuantity || 0} unit komoditas aktif
          </p>
        </div>

        {/* Total Modal Stok & Estimasi Margin */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Total Modal Aset Gudang
            </span>
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-stone-900">
            {loading ? "..." : formatRupiah(valuation?.summary.totalValuationCost || 0)}
          </div>
          <p className="text-xs text-emerald-700 font-semibold mt-1">
            Potensi Laba Kotor: {formatRupiah(valuation?.summary.potentialGrossProfit || 0)}
          </p>
        </div>
      </div>

      {/* Grid: Best-selling Products & Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                Komoditas Terlaris (Best-Selling)
              </h2>
              <p className="text-xs text-stone-400">
                Paling banyak dipesan oleh pelanggan berdasarkan jumlah &amp; omzet
              </p>
            </div>
          </div>

          <div className="divide-y divide-stone-100 flex-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-stone-400">Memuat peringkat...</div>
            ) : topProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-stone-400">
                Belum ada data penjualan tercatat untuk produk.
              </div>
            ) : (
              topProducts.map((p, idx) => (
                <div key={p.productId} className="p-4 flex items-center justify-between hover:bg-stone-50 transition">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-100 text-amber-800"
                          : idx === 1
                          ? "bg-stone-200 text-stone-800"
                          : idx === 2
                          ? "bg-amber-50 text-amber-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-stone-900">{p.productName}</p>
                      <p className="text-[11px] text-stone-400">
                        {p.orderCount} transaksi berbeda
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-900">
                      {p.totalQuantitySold} Terjual
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      {formatRupiah(p.totalRevenue)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory Category Breakdown */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-700" />
                Valuasi Per Kategori Komoditas
              </h2>
              <p className="text-xs text-stone-400">
                Distribusi nilai stok fisik di gudang penyimpanan
              </p>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm text-stone-600">
              <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Varian Unit</th>
                  <th className="py-3 px-4">Fisik Stok</th>
                  <th className="py-3 px-4 text-right">Valuasi Eceran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                      Memuat breakdown...
                    </td>
                  </tr>
                ) : !valuation?.categoryBreakdown || valuation.categoryBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">
                      Belum ada data kategori inventaris.
                    </td>
                  </tr>
                ) : (
                  valuation.categoryBreakdown.map((cat) => (
                    <tr key={cat.categoryName} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4 font-bold text-xs text-stone-900">
                        {cat.categoryName}
                      </td>
                      <td className="py-3 px-4 text-xs text-stone-600">
                        {cat.totalItems} Varian
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-stone-800">
                        {cat.totalStock}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-emerald-800 text-right">
                        {formatRupiah(cat.valuationRetail)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
