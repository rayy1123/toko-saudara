"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ChevronRight,
  RotateCcw,
  ShoppingBag,
  AlertCircle,
  Printer,
  Search,
} from "lucide-react";

interface OrderItem {
  id: string;
  productNameSnapshot: string;
  unitNameSnapshot: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  productId: string;
  productUnitId: string;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  grandTotal: number;
  createdAt: string;
  items: OrderItem[];
  delivery?: {
    slotStart?: string;
    slotEnd?: string;
    trackingNote?: string;
  } | null;
  payment?: {
    method: string;
  } | null;
}

export default function PesananIndexPage() {
  const { user, addToCart, showToast } = useStore();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    async function loadOrders() {
      try {
        let queryUrl = "";

        if (user?.phone) {
          queryUrl = `/api/orders?phone=${encodeURIComponent(user.phone)}`;
        } else {
          // Check local storage for guest orders
          let guestOrders: string[] = [];
          try {
            const raw = localStorage.getItem("saudara_my_orders");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                guestOrders = parsed.map((item: any) => item.orderNumber).filter(Boolean);
              }
            }
          } catch {}

          let guestPhone = "";
          try {
            const profileRaw = localStorage.getItem("saudara_guest_profile");
            if (profileRaw) {
              const parsedProfile = JSON.parse(profileRaw);
              if (parsedProfile.phone) guestPhone = parsedProfile.phone;
            }
          } catch {}

          if (guestOrders.length > 0) {
            queryUrl = `/api/orders?orderNumbers=${encodeURIComponent(guestOrders.slice(0, 20).join(","))}`;
          } else if (guestPhone) {
            queryUrl = `/api/orders?phone=${encodeURIComponent(guestPhone)}`;
          }
        }

        if (!queryUrl) {
          setOrders([]);
          setLoading(false);
          return;
        }

        const res = await fetch(queryUrl);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="market-badge bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> Menunggu Pembayaran
          </span>
        );
      case "PAID":
      case "PROCESSING":
        return (
          <span className="market-badge bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-3 h-3" /> Sedang Diproses Toko
          </span>
        );
      case "OUT_FOR_DELIVERY":
        return (
          <span className="market-badge bg-saudara-orange-100 text-saudara-orange-800 border border-saudara-orange-300">
            <Truck className="w-3 h-3" /> Sedang Diantar Kurir
          </span>
        );
      case "DELIVERED":
        return (
          <span className="market-badge bg-saudara-green-100 text-saudara-green-800 border border-saudara-green-300">
            <CheckCircle className="w-3 h-3" /> Pesanan Selesai
          </span>
        );
      case "CANCELLED":
        return (
          <span className="market-badge bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3" /> Dibatalkan
          </span>
        );
      default:
        return (
          <span className="market-badge bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const handleRepeatOrder = (order: OrderRecord) => {
    order.items.forEach((item) => {
      addToCart({
        productUnitId: item.productUnitId,
        productId: item.productId,
        name: item.productNameSnapshot,
        unitName: item.unitNameSnapshot,
        unitCode: "item",
        price: item.unitPrice,
        slug: item.productNameSnapshot.toLowerCase().replace(/\s+/g, "-"),
      }, item.quantity);
    });
    showToast(`Semua ${order.items.length} barang dari ${order.orderNumber} dimasukkan ke keranjang!`);
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "ACTIVE") {
      return ["PENDING_PAYMENT", "PAID", "PROCESSING", "OUT_FOR_DELIVERY"].includes(
        o.orderStatus
      );
    }
    if (activeTab === "COMPLETED") {
      return ["DELIVERED", "CANCELLED"].includes(o.orderStatus);
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-saudara-cream-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-saudara-green-900 tracking-tight">
            Pesanan Saya
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Pantau status belanja sayur pasar subuh dan riwayat pesanan dapur Anda.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 p-1 bg-saudara-cream-100 rounded-xl border border-saudara-cream-200 text-xs">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "ALL"
                ? "bg-white text-saudara-green-900 shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "ACTIVE"
                ? "bg-white text-saudara-green-900 shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Berjalan
          </button>
          <button
            onClick={() => setActiveTab("COMPLETED")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === "COMPLETED"
                ? "bg-white text-saudara-green-900 shadow-2xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="w-8 h-8 border-4 border-saudara-green-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs">Memuat daftar pesanan Anda...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-saudara-cream-200 space-y-3">
          <Package className="w-14 h-14 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">Belum Ada Pesanan di Tab Ini</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Yuk belanja sayuran subuh dan kebutuhan dapur berkualitas langsung dari Pasar Saudara!
          </p>
          <Link href="/kategori" className="market-btn-primary inline-flex text-xs py-2 px-5 mt-2 font-bold">
            Mulai Belanja
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-saudara-cream-200 shadow-xs hover:border-saudara-green-600/30 transition-all space-y-4"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-saudara-cream-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-saudara-green-100 text-saudara-green-800 flex items-center justify-center font-bold">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-gray-900 block">
                      {order.orderNumber}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      Dipesan: {new Date(order.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(order.orderStatus)}
                </div>
              </div>

              {/* Items Snapshot */}
              <div className="space-y-2">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-800 font-medium">
                      {item.quantity} × {item.productNameSnapshot}{" "}
                      <span className="text-gray-400">({item.unitNameSnapshot})</span>
                    </span>
                    <span className="text-gray-600 font-semibold">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-[11px] text-gray-400 italic">
                    +{order.items.length - 3} produk lainnya...
                  </p>
                )}
              </div>

              {/* Tracking Note if any */}
              {order.delivery?.trackingNote && (
                <div className="bg-saudara-cream-50 p-2.5 rounded-xl border border-saudara-cream-200 text-xs flex items-center gap-2 text-gray-700">
                  <Truck className="w-4 h-4 text-saudara-orange-600 shrink-0" />
                  <span className="truncate">
                    <b>Catatan Kurir:</b> {order.delivery.trackingNote}
                  </span>
                </div>
              )}

              {/* Order Footer & Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-saudara-cream-100">
                <div>
                  <span className="text-[11px] text-gray-400 block">Total Tagihan:</span>
                  <span className="text-base sm:text-lg font-black text-saudara-green-800">
                    {formatRupiah(order.grandTotal)}
                  </span>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Link
                    href={`/struk/${order.orderNumber}`}
                    target="_blank"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 shadow-2xs transition"
                    title="Buka Struk Digital"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Struk
                  </Link>

                  <button
                    onClick={() => handleRepeatOrder(order)}
                    className="market-btn-outline text-xs py-2 px-3 font-semibold flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                    title="Masukkan semua barang ke keranjang"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Pesan Lagi
                  </button>

                  <Link
                    href={`/pesanan/${order.id}`}
                    className="market-btn-primary text-xs py-2 px-4 font-bold flex items-center justify-center gap-1 flex-1 sm:flex-none shadow-xs"
                  >
                    Lacak Detail <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
