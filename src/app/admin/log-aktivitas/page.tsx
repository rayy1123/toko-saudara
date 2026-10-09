"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  ShieldAlert,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  TrendingUp,
  Boxes,
  Calculator,
  Tag,
  ArrowRight,
  Eye,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: any;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      let url = "/api/v1/admin/audit-logs?limit=80";
      if (selectedAction !== "ALL") url += `&action=${selectedAction}`;
      if (selectedRole !== "ALL") url += `&actorRole=${selectedRole}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [selectedAction, selectedRole]);

  const filteredLogs = logs.filter((item) => {
    const q = searchQuery.toLowerCase();
    const actorName = (item.actor.name || "").toLowerCase();
    const actorEmail = (item.actor.email || "").toLowerCase();
    const metaStr = JSON.stringify(item.metadata || {}).toLowerCase();
    return actorName.includes(q) || actorEmail.includes(q) || metaStr.includes(q);
  });

  const getActionConfig = (action: string) => {
    switch (action) {
      case "PRICE_CHANGE":
        return {
          label: "Ubah Harga Barang",
          color: "bg-amber-100 text-amber-900 border-amber-300",
          icon: TrendingUp,
        };
      case "STOCK_ADJUSTMENT":
      case "STOCK_UPDATE":
        return {
          label: "Masuk Barang / Mutasi Stok",
          color: "bg-blue-100 text-blue-900 border-blue-300",
          icon: Boxes,
        };
      case "POS_SALE":
        return {
          label: "Transaksi Kasir (POS)",
          color: "bg-emerald-100 text-emerald-900 border-emerald-300",
          icon: Calculator,
        };
      case "CREATE_PRODUCT":
        return {
          label: "Input Barang Baru",
          color: "bg-purple-100 text-purple-900 border-purple-300",
          icon: Tag,
        };
      default:
        return {
          label: action,
          color: "bg-stone-100 text-stone-800 border-stone-300",
          icon: ShieldAlert,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Pengawasan &amp; Monitoring Pemilik Toko
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            Log Aktivitas Kasir &amp; Petugas
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Pantau seluruh tindakan yang dilakukan kasir: perubahan harga, barang masuk/tambah stok, penjualan kasir, dan penyesuaian inventori secara real-time.
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Segarkan Log
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama petugas, komoditas, atau nomor transaksi..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Petugas */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-700"
            >
              <option value="ALL">Semua Petugas</option>
              <option value="CASHIER">Khusus Kasir Toko</option>
              <option value="ADMIN">Khusus Pemilik Toko</option>
            </select>

            {/* Filter Aksi */}
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold bg-white text-stone-700"
            >
              <option value="ALL">Semua Jenis Aksi</option>
              <option value="PRICE_CHANGE">Ubah Harga</option>
              <option value="STOCK_ADJUSTMENT">Masuk / Mutasi Stok</option>
              <option value="CREATE_PRODUCT">Input Barang Baru</option>
              <option value="POS_SALE">Penjualan Kasir</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-black text-base text-stone-900">Histori Jejak Audit Toko</h2>
          <span className="text-xs text-stone-500 font-medium">
            {filteredLogs.length} Aktivitas Tercatat
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat jejak audit petugas...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Belum ada aktivitas yang sesuai dengan filter pencarian.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredLogs.map((log) => {
              const cfg = getActionConfig(log.action);
              const Icon = cfg.icon;
              const isCashier = log.actor.role === "CASHIER";

              return (
                <div
                  key={log.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-stone-50 transition"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${cfg.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>

                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            isCashier
                              ? "bg-blue-100 text-blue-900 border border-blue-200"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                          }`}
                        >
                          {isCashier ? "🛒 Kasir Toko" : "👑 Pemilik Toko"}
                        </span>

                        <span className="text-xs font-bold text-stone-900">{log.actor.name}</span>
                        <span className="text-[11px] text-stone-400">({log.actor.email})</span>
                      </div>

                      {/* Detail Deskripsi Aksi */}
                      <div className="text-xs text-stone-700 pt-0.5">
                        {log.action === "PRICE_CHANGE" && (
                          <div className="flex flex-wrap items-center gap-1.5 font-medium">
                            <span>
                              Komoditas: <b>{log.metadata.productName || "Barang"}</b> ({log.metadata.unitName || "Unit"})
                            </span>
                            <span>•</span>
                            <span className="line-through text-stone-400">
                              {formatRupiah(log.metadata.previousPrice || 0)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-emerald-600" />
                            <span className="font-extrabold text-emerald-900">
                              Diubah jadi {formatRupiah(log.metadata.newPrice || 0)}
                            </span>
                          </div>
                        )}

                        {(log.action === "STOCK_ADJUSTMENT" || log.action === "STOCK_UPDATE") && (
                          <div className="flex flex-wrap items-center gap-1.5 font-medium">
                            <span>
                              Stok: <b>{log.metadata.productName || "Barang"}</b> ({log.metadata.unitName || "Unit"})
                            </span>
                            <span>•</span>
                            <span>Stok Lama: {log.metadata.previousStock} Unit</span>
                            <ArrowRight className="w-3 h-3 text-blue-600" />
                            <span className="font-extrabold text-blue-900">
                              Stok Baru: {log.metadata.newStock} Unit
                            </span>
                            {log.metadata.delta && (
                              <span className="text-blue-700 font-bold">
                                ({log.metadata.delta > 0 ? `+${log.metadata.delta}` : log.metadata.delta} unit)
                              </span>
                            )}
                          </div>
                        )}

                        {log.action === "CREATE_PRODUCT" && (
                          <div className="font-medium text-stone-700 flex items-center gap-1.5">
                            <span>Mendaftarkan barang baru: <b>{log.metadata.productName || "Barang Baru"}</b></span>
                            {log.metadata.sku && <span className="text-stone-400 font-mono text-[11px]">({log.metadata.sku})</span>}
                          </div>
                        )}

                        {log.action === "POS_SALE" && (
                          <div className="font-medium text-stone-700">
                            Penjualan Kasir No. Struk <b>{log.metadata.orderNumber}</b> • Total:{" "}
                            <span className="font-bold text-emerald-900">
                              {formatRupiah(log.metadata.grandTotal || 0)}
                            </span>{" "}
                            ({log.metadata.customerName})
                          </div>
                        )}

                        {!["PRICE_CHANGE", "STOCK_ADJUSTMENT", "STOCK_UPDATE", "POS_SALE", "CREATE_PRODUCT"].includes(
                          log.action
                        ) && (
                          <div className="text-stone-600">
                            {JSON.stringify(log.metadata)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="text-right shrink-0 text-xs text-stone-400 font-mono">
                    <div>
                      {new Date(log.createdAt).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="font-bold text-stone-700">
                      {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}{" "}
                      WIB
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
