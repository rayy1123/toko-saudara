"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  CreditCard,
  Truck,
  User,
  Printer,
} from "lucide-react";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: string;
  user: {
    email: string;
    phone?: string | null;
    profile?: { name: string; phone?: string | null } | null;
  };
  items: OrderItem[];
  payment?: { method: string; status: string } | null;
  delivery?: { method: string; status: string; scheduledDate?: string | null } | null;
}

const STATUS_FILTERS = [
  { id: "ALL", label: "Semua Pesanan" },
  { id: "PENDING_PAYMENT", label: "Menunggu Bayar" },
  { id: "PAID", label: "Sudah Bayar" },
  { id: "PROCESSING", label: "Diproses Toko" },
  { id: "READY_FOR_PICKUP", label: "Siap Kirim" },
  { id: "OUT_FOR_DELIVERY", label: "Diantar Kurir" },
  { id: "DELIVERED", label: "Selesai" },
  { id: "CANCELLED", label: "Dibatalkan" },
];

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Bayar", color: "bg-amber-100 text-amber-800 border-amber-300" },
  PAID: { label: "Sudah Bayar", color: "bg-blue-100 text-blue-800 border-blue-300" },
  PROCESSING: { label: "Diproses Toko", color: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  READY_FOR_PICKUP: { label: "Siap Kirim", color: "bg-purple-100 text-purple-800 border-purple-300" },
  OUT_FOR_DELIVERY: { label: "Diantar Kurir", color: "bg-cyan-100 text-cyan-800 border-cyan-300" },
  DELIVERED: { label: "Selesai Diterima", color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-800 border-red-300" },
};

export default function AdminPesananPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const url =
        selectedStatus === "ALL"
          ? "/api/v1/admin/orders?limit=50"
          : `/api/v1/admin/orders?status=${selectedStatus}&limit=50`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setOrders(json.data);
      }
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, [selectedStatus]);

  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const custName = o.user?.profile?.name?.toLowerCase() || "";
    const email = o.user?.email?.toLowerCase() || "";
    const orderNo = o.orderNumber.toLowerCase();
    return custName.includes(q) || email.includes(q) || orderNo.includes(q);
  });

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Kelola Pesanan Pelanggan</h1>
          <p className="text-sm text-stone-500">
            Daftar pesanan masuk, alur pemenuhan barang belanja, dan konfirmasi pengiriman
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-stone-50 text-stone-700 text-sm font-medium rounded-xl border border-stone-200 shadow-sm transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Segarkan Data
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {STATUS_FILTERS.map((f) => {
          const isActive = selectedStatus === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              {f.label}
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
            placeholder="Cari berdasarkan nomor pesanan (ORD-...), nama pelanggan, atau email..."
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-stone-600">
            <thead className="bg-stone-50 text-[11px] font-semibold uppercase tracking-wider text-stone-500 border-b border-stone-200">
              <tr>
                <th className="py-3 px-4">No. Pesanan &amp; Waktu</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Item Belanja</th>
                <th className="py-3 px-4">Metode Bayar</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status Pesanan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 text-sm">
                    Memuat data pesanan...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400 text-sm">
                    Tidak ada pesanan pada kategori status ini.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = STATUS_BADGES[order.orderStatus] || {
                    label: order.orderStatus,
                    color: "bg-stone-100 text-stone-700 border-stone-200",
                  };

                  return (
                    <tr key={order.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-xs text-stone-900 block">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] text-stone-400">
                          {new Date(order.createdAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-900 text-xs">
                          {order.user?.profile?.name || "Pelanggan"}
                        </div>
                        <div className="text-[11px] text-stone-400">{order.user?.email}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-stone-600">
                        <span className="font-medium text-stone-800">
                          {order.items?.length || 0} Macam Komoditas
                        </span>
                        <div className="text-[11px] text-stone-400 truncate max-w-[200px]">
                          {order.items?.map((i) => i.productNameSnapshot).join(", ")}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-medium text-stone-800 block">
                          {order.payment?.method === "BANK_TRANSFER" ? "Transfer Bank" : "COD (Bayar di Tempat)"}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${
                            order.paymentStatus === "PAID" ? "text-emerald-700" : "text-amber-700"
                          }`}
                        >
                          {order.paymentStatus === "PAID" ? "Lunas" : "Belum Lunas"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-stone-900 text-xs">
                        {formatRupiah(order.grandTotal)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/struk/${order.orderNumber}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition"
                            title="Buka E-Receipt"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Struk
                          </Link>
                          <Link
                            href={`/admin/pesanan/${order.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Detail
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
    </div>
  );
}
