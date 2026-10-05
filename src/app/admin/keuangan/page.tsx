"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Boxes,
  Receipt,
  ShoppingBag,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Calculator,
} from "lucide-react";

interface FinanceSummary {
  today: {
    revenue: number;
    orderCount: number;
    purchases: number;
    expenses: number;
    netProfit: number;
  };
  currentMonth: {
    monthKey: string;
    monthName: string;
    revenue: number;
    orderCount: number;
    purchasesTotal: number;
    expensesTotal: number;
    netProfit: number;
  };
  allTime: {
    revenue: number;
    orders: number;
    purchases: number;
    expenses: number;
    netProfit: number;
  };
  dailyList: Array<{
    date: string;
    revenue: number;
    orderCount: number;
    discountTotal: number;
    shippingTotal: number;
    itemCount: number;
    onlineCount: number;
    posCount: number;
  }>;
  monthlyList: Array<{
    monthKey: string;
    monthName: string;
    revenue: number;
    orderCount: number;
    purchasesTotal: number;
    expensesTotal: number;
    netProfit: number;
  }>;
}

export default function AdminKeuanganPage() {
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");

  const loadFinance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/accounting");
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to load finance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 text-center text-xs text-stone-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-700" />
        Menghitung akumulasi penjualan & pembukuan keuangan...
      </div>
    );
  }

  const maxDailyRevenue = Math.max(...data.dailyList.map((d) => d.revenue), 100000);
  const maxMonthlyRevenue = Math.max(...data.monthlyList.map((m) => m.revenue), 500000);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Penghitung & Akumulasi Jualan
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Akumulasi Penjualan & Laba Rugi
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Penghitungan omzet per hari dan per bulan, dikurangi modal pembelian kulakan dan beban pengeluaran operasional.
          </p>
        </div>

        <button
          onClick={loadFinance}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Hitung Ulang Data
        </button>
      </div>

      {/* Primary Financial Overview Cards (Today & This Month) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Hari Ini */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-stone-900">Performa Jualan Hari Ini</span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Total Omzet Penjualan:</span>
              <span className="font-black text-base text-stone-900">{formatRupiah(data.today.revenue)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Jumlah Transaksi:</span>
              <span className="font-bold text-stone-800">{data.today.orderCount} Transaksi</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Pembelian Kulakan Hari Ini:</span>
              <span className="font-bold text-blue-700">-{formatRupiah(data.today.purchases)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Pengeluaran Toko Hari Ini:</span>
              <span className="font-bold text-red-600">-{formatRupiah(data.today.expenses)}</span>
            </div>
            <div className="pt-2 flex justify-between items-baseline font-black">
              <span className="text-stone-900 uppercase">LABA BERSIH HARI INI:</span>
              <span
                className={`text-lg ${
                  data.today.netProfit >= 0 ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {formatRupiah(data.today.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Card Bulan Ini */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-stone-900">
              Akumulasi Bulan Ini ({data.currentMonth.monthName})
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Bulan Berjalan
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Akumulasi Omzet Bulan Ini:</span>
              <span className="font-black text-base text-stone-900">
                {formatRupiah(data.currentMonth.revenue)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Total Transaksi:</span>
              <span className="font-bold text-stone-800">{data.currentMonth.orderCount} Transaksi</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Total Kulakan / HPP:</span>
              <span className="font-bold text-blue-700">
                -{formatRupiah(data.currentMonth.purchasesTotal)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-100">
              <span className="text-stone-600 font-medium">Total Beban Operasional:</span>
              <span className="font-bold text-red-600">
                -{formatRupiah(data.currentMonth.expensesTotal)}
              </span>
            </div>
            <div className="pt-2 flex justify-between items-baseline font-black">
              <span className="text-stone-900 uppercase">LABA BERSIH BULAN INI:</span>
              <span
                className={`text-lg ${
                  data.currentMonth.netProfit >= 0 ? "text-emerald-800" : "text-red-700"
                }`}
              >
                {formatRupiah(data.currentMonth.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Akumulasi Per Hari vs Akumulasi Per Bulan */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("daily")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "daily"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Akumulasi Penjualan Per Hari
            </button>
            <button
              onClick={() => setActiveTab("monthly")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === "monthly"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Akumulasi Penjualan Per Bulan
            </button>
          </div>

          <div className="text-xs text-stone-500 font-medium hidden sm:block">
            {activeTab === "daily" ? "Histori Harian" : "Histori 12 Bulan"}
          </div>
        </div>

        {/* TAB 1: Penjualan Per Hari */}
        {activeTab === "daily" && (
          <div className="p-5 space-y-4">
            {data.dailyList.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                Belum ada transaksi penjualan yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {data.dailyList.map((d) => {
                  const percentage = Math.round((d.revenue / maxDailyRevenue) * 100);
                  const aov = d.orderCount > 0 ? Math.round(d.revenue / d.orderCount) : 0;
                  return (
                    <div key={d.date} className="py-4 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-sm text-stone-900 font-mono">
                            {new Date(d.date).toLocaleDateString("id-ID", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            {d.orderCount} Transaksi
                          </span>
                          {d.posCount > 0 && (
                            <span className="text-[10px] text-stone-400">
                              (Online: {d.onlineCount} • Kasir: {d.posCount})
                            </span>
                          )}
                        </div>

                        <div className="text-right flex items-baseline gap-3">
                          <span className="text-[11px] text-stone-400">
                            Rata-rata: {formatRupiah(aov)}
                          </span>
                          <span className="font-black text-base text-emerald-900">
                            {formatRupiah(d.revenue)}
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar of daily revenue */}
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Penjualan Per Bulan */}
        {activeTab === "monthly" && (
          <div className="p-5 space-y-4">
            {data.monthlyList.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                Belum ada data bulanan.
              </div>
            ) : (
              <div className="space-y-4">
                {data.monthlyList.map((m) => {
                  const percentage = Math.round((m.revenue / maxMonthlyRevenue) * 100);
                  return (
                    <div key={m.monthKey} className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-black text-base text-stone-900">{m.monthName}</span>
                          <span className="text-xs text-stone-500 block mt-0.5">
                            {m.orderCount} Total Pesanan Terlayani
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-stone-500 block">Omzet Kotor:</span>
                          <span className="font-black text-xl text-stone-900">
                            {formatRupiah(m.revenue)}
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-800 h-full rounded-full"
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>

                      {/* Accounting Breakdown per Month */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-200 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[11px]">Pembelian / HPP:</span>
                          <span className="font-bold text-blue-800">{formatRupiah(m.purchasesTotal)}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[11px]">Beban Pengeluaran:</span>
                          <span className="font-bold text-red-600">{formatRupiah(m.expensesTotal)}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[11px]">Laba Bersih Riil:</span>
                          <span
                            className={`font-black ${
                              m.netProfit >= 0 ? "text-emerald-800" : "text-red-700"
                            }`}
                          >
                            {formatRupiah(m.netProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
