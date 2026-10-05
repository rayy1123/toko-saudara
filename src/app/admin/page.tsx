"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  Banknote,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PackagePlus,
  BarChart3,
  RefreshCw,
  PlusCircle,
  Eye,
  Calculator,
  Receipt,
  Boxes,
  Printer,
  Sparkles,
  DollarSign,
  Building2,
  Tag,
  ShieldAlert,
} from "lucide-react";

interface FinanceData {
  today: {
    revenue: number;
    orderCount: number;
    purchases: number;
    expenses: number;
    netProfit: number;
  };
  currentMonth: {
    monthName: string;
    revenue: number;
    orderCount: number;
    purchasesTotal: number;
    expensesTotal: number;
    netProfit: number;
  };
}

interface DashboardData {
  metrics: {
    omzetHariIni: number;
    orderBaruHariIni: number;
    orderDiproses: number;
    stokMenipisCount: number;
  };
  lowStockAlerts: Array<{
    unitId: string;
    productName: string;
    sku: string;
    unitName: string;
    stockQuantity: number;
    lowStockThreshold: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    grandTotal: number;
    orderStatus: string;
    paymentStatus: string;
    createdAt: string;
    user?: {
      email: string;
      profile?: { name: string; phone?: string };
    };
    items?: Array<{ id: string; productNameSnapshot: string; quantity: number }>;
  }>;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", color: "bg-amber-100 text-amber-800 border-amber-200" },
  PAID: { label: "Sudah Bayar", color: "bg-blue-100 text-blue-800 border-blue-200" },
  PROCESSING: { label: "Diproses", color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
  READY_FOR_PICKUP: { label: "Siap Kirim", color: "bg-purple-100 text-purple-800 border-purple-200" },
  OUT_FOR_DELIVERY: { label: "Diantar Kurir", color: "bg-cyan-100 text-cyan-800 border-cyan-200" },
  DELIVERED: { label: "Selesai", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-800 border-red-200" },
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      const [dashRes, finRes] = await Promise.all([
        fetch("/api/v1/admin/dashboard"),
        fetch("/api/v1/admin/accounting"),
      ]);

      const dashJson = await dashRes.json();
      const finJson = await finRes.json();

      if (!dashRes.ok) throw new Error(dashJson.error?.message || "Gagal memuat data dasbor");

      setData(dashJson.data);
      if (finJson.data) setFinance(finJson.data);
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat memuat data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const todayRevenue = finance?.today.revenue ?? data?.metrics.omzetHariIni ?? 0;
  const monthRevenue = finance?.currentMonth.revenue ?? 0;
  const monthNetProfit = finance?.currentMonth.netProfit ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Portal Pencatat & Penghitung Jualan Toko Saudara
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Ringkasan Penjualan & Toko</h1>
          <p className="text-xs text-stone-500 mt-1">
            Data operasional pasar riil &bull; {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/log-aktivitas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Log Kasir
          </Link>
          <Link
            href="/admin/kasir"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Calculator className="w-4 h-4" /> Buka Kasir / Catat Jual
          </Link>
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="p-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition disabled:opacity-50"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={loadDashboard} className="font-bold underline">
            Coba lagi
          </button>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Omzet Hari Ini</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Banknote className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900">
            {loading ? "..." : formatRupiah(todayRevenue)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {finance?.today.orderCount || data?.metrics.orderBaruHariIni || 0} transaksi berhasil hari ini
          </p>
        </div>

        {/* Akumulasi Omzet Bulan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Omzet Bulan Ini ({finance?.currentMonth.monthName.split(" ")[0] || "Bulan Ini"})
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {loading ? "..." : formatRupiah(monthRevenue)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">
            {finance?.currentMonth.orderCount || 0} pesanan terlayani bulan ini
          </p>
        </div>

        {/* Laba Bersih Bulan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Laba Bersih Riil
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black ${
              monthNetProfit >= 0 ? "text-emerald-800" : "text-red-700"
            }`}
          >
            {loading ? "..." : formatRupiah(monthNetProfit)}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Omzet - Kulakan - Pengeluaran</p>
        </div>

        {/* Stok Menipis Alert */}
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Stok Kritis</span>
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-800 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-stone-900">
            {loading ? "..." : `${data?.metrics.stokMenipisCount || 0} Unit`}
          </div>
          <p className="text-[11px] text-stone-400 mt-1">Perlu kulakan ke petani/pasar induk</p>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/kasir"
          className="group p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-3xl flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">Kasir / Catat Jual</div>
              <div className="text-[11px] text-emerald-700">Penjualan pembeli langsung</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/admin/kelola-barang"
          className="group p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-3xl flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-700 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">Barang, Stok & Harga</div>
              <div className="text-[11px] text-emerald-700">Input cepat harian pasar</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-700 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/admin/promo"
          className="group p-4 bg-saudara-orange-50 hover:bg-saudara-orange-100/80 border border-saudara-orange-200 rounded-3xl flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-saudara-orange-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-saudara-orange-950">Promo & Diskon</div>
              <div className="text-[11px] text-saudara-orange-700">Kupon langganan & diskon</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-saudara-orange-700 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/admin/keuangan"
          className="group p-4 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-3xl flex items-center justify-between transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 text-white rounded-2xl flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">Akumulasi & Laba Rugi</div>
              <div className="text-[11px] text-amber-700">Hitung omzet per hari & bulan</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Tables Row: Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-stone-900">Pesanan Terbaru & E-Receipt</h2>
              <p className="text-xs text-stone-400">Transaksi online dan kasir langsung toko</p>
            </div>
            <Link
              href="/admin/pesanan"
              className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
            >
              Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-500 border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">E-Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 text-xs">
                      Memuat daftar pesanan...
                    </td>
                  </tr>
                ) : !data?.recentOrders || data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-stone-400 text-xs">
                      Belum ada pesanan terbaru.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => {
                    const statusCfg = STATUS_LABELS[order.orderStatus] || {
                      label: order.orderStatus,
                      color: "bg-stone-100 text-stone-700 border-stone-200",
                    };
                    return (
                      <tr key={order.id} className="hover:bg-stone-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">
                          {order.orderNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900 truncate max-w-[140px]">
                            {order.user?.profile?.name || order.user?.email || "Pelanggan Toko"}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                          </div>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-stone-900">
                          {formatRupiah(order.grandTotal)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusCfg.color}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/struk/${order.orderNumber}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold transition border border-emerald-200"
                              title="Buka Struk Digital"
                            >
                              <Printer className="w-3 h-3" /> Struk
                            </Link>
                            <Link
                              href={`/admin/pesanan/${order.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-medium transition"
                              title="Detail Pesanan"
                            >
                              <Eye className="w-3 h-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts (1 Col on lg) */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-stone-900">Stok Kritis</h2>
              <p className="text-xs text-stone-400">Segera kulakan ke petani/pasar</p>
            </div>
            <Link
              href="/admin/pembelian"
              className="text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              + Kulakan
            </Link>
          </div>

          <div className="p-4 flex-1 overflow-y-auto max-h-[360px] space-y-2.5">
            {loading ? (
              <div className="py-8 text-center text-stone-400 text-xs">Memeriksa stok...</div>
            ) : !data?.lowStockAlerts || data.lowStockAlerts.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                Semua stok komoditas aman di atas batas minimal.
              </div>
            ) : (
              data.lowStockAlerts.map((item) => (
                <div
                  key={item.unitId}
                  className="p-3 bg-red-50/60 border border-red-200 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-stone-900">{item.productName}</div>
                    <div className="text-[11px] text-stone-500">
                      {item.unitName} &bull; Batas: {item.lowStockThreshold}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-sm text-red-700 block">
                      {item.stockQuantity} Unit
                    </span>
                    <Link
                      href="/admin/pembelian"
                      className="text-[10px] font-bold text-blue-700 hover:underline"
                    >
                      Beli Stok
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
