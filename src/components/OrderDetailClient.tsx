"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  MapPin,
  RotateCcw,
  ArrowLeft,
  AlertTriangle,
  CreditCard,
  Phone,
  ShieldCheck,
  Printer,
} from "lucide-react";

export interface OrderDetailClientProps {
  order: {
    id: string;
    orderNumber: string;
    subtotal: number;
    discountTotal: number;
    shippingFee: number;
    grandTotal: number;
    paymentStatus: string;
    orderStatus: string;
    notes?: string | null;
    addressSnapshot: string;
    createdAt: string;
    items: Array<{
      id: string;
      productId: string;
      productUnitId: string;
      productNameSnapshot: string;
      unitNameSnapshot: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }>;
    delivery?: {
      method: string;
      status: string;
      scheduledDate?: string | null;
      slotStart?: string | null;
      slotEnd?: string | null;
      trackingNote?: string | null;
    } | null;
    payment?: {
      method: string;
      status: string;
      amount: number;
      paidAt?: string | null;
      providerReference?: string | null;
    } | null;
    statusHistory: Array<{
      id: string;
      fromStatus?: string | null;
      toStatus: string;
      note?: string | null;
      createdAt: string;
    }>;
  };
}

export function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const router = useRouter();
  const { addToCart, showToast } = useStore();
  const [order, setOrder] = useState(initialOrder);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);

  let addressData: any = {};
  try {
    addressData = JSON.parse(order.addressSnapshot);
  } catch (e) {
    addressData = {
      recipientName: "Pelanggan",
      phone: "-",
      addressLine: order.addressSnapshot,
      district: "-",
      city: "Kota Bandung",
    };
  }

  // Stepper timeline definition
  const timelineStages = [
    { key: "PENDING_PAYMENT", label: "Pesanan Dibuat", desc: "Menunggu verifikasi pembayaran" },
    { key: "PROCESSING", label: "Diproses Toko", desc: "Sayur subuh disortir & ditimbang" },
    { key: "OUT_FOR_DELIVERY", label: "Diantar Kurir", desc: "Kurir menuju pagar rumah Anda" },
    { key: "DELIVERED", label: "Selesai Diterima", desc: "Sayur segar siap dimasak" },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return 0;
      case "PAID":
      case "PROCESSING":
        return 1;
      case "OUT_FOR_DELIVERY":
        return 2;
      case "DELIVERED":
        return 3;
      case "CANCELLED":
        return -1;
      default:
        return 1;
    }
  };

  const currentStageIndex = getStageIndex(order.orderStatus);

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membatalkan pesanan");
      }

      setOrder((prev) => ({
        ...prev,
        orderStatus: "CANCELLED",
      }));
      setCancelModal(false);
      showToast("Pesanan berhasil dibatalkan", "info");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleRepeatOrder = () => {
    order.items.forEach((item) => {
      addToCart(
        {
          productUnitId: item.productUnitId,
          productId: item.productId,
          name: item.productNameSnapshot,
          unitName: item.unitNameSnapshot,
          unitCode: "item",
          price: item.unitPrice,
          slug: item.productNameSnapshot.toLowerCase().replace(/\s+/g, "-"),
        },
        item.quantity
      );
    });
    showToast(`Semua barang dari ${order.orderNumber} dimasukkan ke keranjang!`);
    router.push("/keranjang");
  };

  const canCancel =
    order.orderStatus === "PENDING_PAYMENT" || order.orderStatus === "PROCESSING";

  return (
    <div className="space-y-6">
      {/* Header & Status Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saudara-cream-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-saudara-cream-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold tracking-wider text-saudara-green-800">
                Lacak Pengiriman Pesanan
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-mono">{order.orderNumber}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight mt-1">
              Status Pengantaran Pasar Subuh
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/struk/${order.orderNumber}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-saudara-green-800 hover:bg-saudara-green-900 text-white font-bold text-xs shadow-2xs transition"
            >
              <Printer className="w-3.5 h-3.5" /> Cetak E-Receipt
            </Link>

            <button
              onClick={handleRepeatOrder}
              className="market-btn-outline text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Pesan Lagi
            </button>

            {canCancel && (
              <button
                onClick={() => setCancelModal(true)}
                className="text-xs py-2 px-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 font-semibold transition-colors"
              >
                Batalkan
              </button>
            )}
          </div>
        </div>

        {/* Timeline Stepper */}
        {order.orderStatus === "CANCELLED" ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-3.5 text-red-800">
            <XCircle className="w-8 h-8 text-red-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Pesanan Ini Telah Dibatalkan</h4>
              <p className="text-xs text-red-600 mt-0.5">
                Pesanan dibatalkan atas permintaan pelanggan. Dana pembayaran jika sudah ditransfer akan direfund ke rekening Anda.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
              {timelineStages.map((stage, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={stage.key}
                    className={`p-4 rounded-2xl border transition-all ${
                      isCurrent
                        ? "bg-saudara-green-50 border-saudara-green-700 ring-2 ring-saudara-green-600/20"
                        : isPassed
                        ? "bg-white border-saudara-green-300"
                        : "bg-saudara-cream-50/70 border-saudara-cream-200 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isPassed
                            ? "bg-saudara-green-800 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          isCurrent
                            ? "text-saudara-green-900"
                            : isPassed
                            ? "text-saudara-green-800"
                            : "text-gray-500"
                        }`}
                      >
                        {stage.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{stage.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courier Driver Tracking Note */}
        {order.delivery?.trackingNote && (
          <div className="bg-saudara-cream-100/70 border border-saudara-cream-200 rounded-2xl p-4 flex items-center gap-3">
            <Truck className="w-6 h-6 text-saudara-orange-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-gray-900 block">Keterangan Kurir Toko:</span>
              <span className="text-gray-700">{order.delivery.trackingNote}</span>
            </div>
          </div>
        )}
      </div>

      {/* Grid: Delivery Info & Item Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Delivery Details & Recipient */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-saudara-cream-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 pb-2 border-b border-saudara-cream-200">
              <MapPin className="w-4 h-4 text-saudara-green-700" />
              Alamat Pengantaran
            </h3>

            <div className="text-xs space-y-2 text-gray-700">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Nama Penerima
                </span>
                <span className="font-bold text-gray-900 text-sm">
                  {addressData.recipientName || "Pelanggan Toko"}
                </span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Kontak WhatsApp
                </span>
                <span className="font-medium text-gray-900">{addressData.phone || "-"}</span>
              </div>

              <div>
                <span className="text-gray-400 block text-[10px] uppercase font-bold">
                  Alamat Lengkap
                </span>
                <p className="mt-0.5 leading-relaxed">
                  {addressData.addressLine}, Kec. {addressData.district}, {addressData.city}
                </p>
              </div>

              {order.notes && (
                <div className="pt-2 border-t border-saudara-cream-100">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">
                    Catatan Khusus Pagar
                  </span>
                  <p className="text-saudara-orange-700 italic font-medium mt-0.5">
                    &quot;{order.notes}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Slot & Payment Card */}
          <div className="bg-white rounded-3xl p-6 border border-saudara-cream-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 pb-2 border-b border-saudara-cream-200">
              <Clock className="w-4 h-4 text-saudara-orange-600" />
              Jadwal & Pembayaran
            </h3>

            <div className="text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Slot Jam Antar:</span>
                <span className="font-bold text-saudara-green-800">
                  {order.delivery?.slotStart || "06:00"} - {order.delivery?.slotEnd || "09:00"} WIB
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Metode Pembayaran:</span>
                <span className="font-bold text-gray-900">
                  {order.payment?.method === "BANK_TRANSFER"
                    ? "Transfer Bank"
                    : "COD (Bayar di Tempat)"}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Status Pembayaran:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    order.paymentStatus === "PAID"
                      ? "bg-saudara-green-100 text-saudara-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.paymentStatus === "PAID" ? "Lunas" : "Belum Dibayar (COD)"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ordered Items & Cost Summary */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-saudara-cream-200 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 pb-2 border-b border-saudara-cream-200">
              <Package className="w-4 h-4 text-saudara-green-700" />
              Daftar Barang Belanja ({order.items.length} item)
            </h3>

            <div className="divide-y divide-saudara-cream-100 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{item.productNameSnapshot}</h4>
                    <p className="text-gray-500">
                      {item.quantity} × {item.unitNameSnapshot} (@ {formatRupiah(item.unitPrice)})
                    </p>
                  </div>
                  <span className="font-black text-gray-900 text-sm">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-4 border-t border-saudara-cream-200 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal Barang</span>
                <span className="font-semibold text-gray-900">{formatRupiah(order.subtotal)}</span>
              </div>

              {order.discountTotal > 0 && (
                <div className="flex justify-between text-saudara-green-700 font-medium">
                  <span>Potongan Promo Voucher</span>
                  <span>-{formatRupiah(order.discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600">
                <span>Ongkos Kirim Kurir Toko</span>
                {order.shippingFee === 0 ? (
                  <span className="text-saudara-green-700 font-bold">GRATIS</span>
                ) : (
                  <span className="font-semibold text-gray-900">
                    {formatRupiah(order.shippingFee)}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-saudara-cream-200 flex justify-between items-baseline font-black text-base sm:text-lg text-saudara-green-900">
                <span>Total Pembayaran</span>
                <span>{formatRupiah(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Need help assistance card */}
          <div className="bg-saudara-cream-50 rounded-2xl p-4 border border-saudara-cream-200 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-saudara-green-700 shrink-0" />
              <span>Butuh bantuan atau pertanyaan pengantaran?</span>
            </div>
            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-saudara-orange-700 font-bold hover:underline"
            >
              Hubungi CS Toko →
            </a>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-gray-900 text-base">Batalkan Pesanan Ini?</h3>
              <p className="text-xs text-gray-500">
                Apakah Anda yakin ingin membatalkan pesanan nomor {order.orderNumber}? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setCancelModal(false)}
                className="market-btn-outline text-xs py-2 font-medium"
              >
                Kembali
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs py-2 font-bold transition-colors"
              >
                {isCancelling ? "Membatalkan..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
