"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  User,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  History,
  FileText,
  PackageCheck,
  Send,
  Ban,
  Printer,
} from "lucide-react";

interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  addressSnapshot: string;
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  paymentStatus: string;
  orderStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    phone: string | null;
    profile?: { name: string; phone: string | null } | null;
  };
  items: Array<{
    id: string;
    productNameSnapshot: string;
    unitNameSnapshot: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  payment?: {
    id: string;
    method: string;
    status: string;
    amount: number;
    providerReference: string | null;
    paidAt: string | null;
  } | null;
  delivery?: {
    id: string;
    method: string;
    status: string;
    scheduledDate: string | null;
    slotStart: string | null;
    slotEnd: string | null;
    trackingNote: string | null;
  } | null;
  statusHistory: Array<{
    id: string;
    fromStatus: string | null;
    toStatus: string;
    changedBy: string | null;
    note: string | null;
    createdAt: string;
  }>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; description: string }
> = {
  PENDING_PAYMENT: {
    label: "Menunggu Pembayaran",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    description: "Pelanggan belum menyelesaikan pembayaran.",
  },
  PAID: {
    label: "Pembayaran Diterima",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    description: "Dana sudah terverifikasi di kasir toko.",
  },
  PROCESSING: {
    label: "Sedang Disiapkan",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    description: "Tim toko sedang memilih sayur segar dan mengemas pesanan.",
  },
  READY_FOR_PICKUP: {
    label: "Siap Kirim / Diambil",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    description: "Pesanan sudah rapi di kotak kirim, menunggu kurir toko.",
  },
  OUT_FOR_DELIVERY: {
    label: "Sedang Diantar Kurir",
    color: "bg-cyan-100 text-cyan-800 border-cyan-300",
    description: "Kurir Toko Saudara sedang dalam perjalanan ke alamat.",
  },
  DELIVERED: {
    label: "Selesai Diterima",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    description: "Pesanan telah diterima oleh pelanggan dengan baik.",
  },
  CANCELLED: {
    label: "Pesanan Dibatalkan",
    color: "bg-red-100 text-red-800 border-red-300",
    description: "Pesanan dibatalkan dan stok telah dikembalikan ke inventori.",
  },
};

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [transitionNote, setTransitionNote] = useState("");
  const [trackingNote, setTrackingNote] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  function showToast(type: "success" | "error", message: string) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  async function loadOrder() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/orders/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Pesanan tidak ditemukan");
      setOrder(json.data);
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  async function handleStatusTransition(targetStatus: string, defaultNote: string) {
    if (!order) return;
    setActionLoading(true);

    try {
      const noteToSend = transitionNote.trim() || defaultNote;
      const res = await fetch(`/api/v1/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          note: noteToSend,
          trackingNote: trackingNote.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Gagal mengubah status pesanan");

      showToast("success", `Status pesanan berhasil diperbarui ke "${targetStatus}"`);
      setTransitionNote("");
      setTrackingNote("");
      loadOrder();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  }

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500">
        Memuat detail pesanan {id}...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-600 font-semibold">Pesanan tidak ditemukan</p>
        <Link
          href="/admin/pesanan"
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-xl text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Pesanan
        </Link>
      </div>
    );
  }

  // Parse address snapshot JSON safely
  let parsedAddress: any = {};
  try {
    parsedAddress = JSON.parse(order.addressSnapshot);
  } catch {
    parsedAddress = { addressLine: order.addressSnapshot };
  }

  const statusCfg = STATUS_CONFIG[order.orderStatus] || {
    label: order.orderStatus,
    color: "bg-stone-100 text-stone-800 border-stone-200",
    description: "",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pesanan"
            className="p-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl border border-stone-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-stone-900 font-mono">
                {order.orderNumber}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold border ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Dibuat pada {new Date(order.createdAt).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })} WIB
            </p>
          </div>
        </div>

        <Link
          href={`/struk/${order.orderNumber}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Printer className="w-4 h-4" /> Cetak E-Receipt / Struk
        </Link>
      </div>

      {/* State Machine Transition Action Panel */}
      <div className="bg-emerald-950 text-white p-5 rounded-2xl shadow-md border border-emerald-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-800/80 pb-3">
          <div>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider block">
              Alur Status Pesanan (State Machine)
            </span>
            <p className="text-sm font-medium text-emerald-100">
              Status Saat Ini: <strong className="text-white underline">{statusCfg.label}</strong>
            </p>
          </div>
          <span className="text-xs text-emerald-300/80">{statusCfg.description}</span>
        </div>

        {/* Transition Options according to state machine */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                Catatan Perubahan Status (Opsional)
              </label>
              <input
                type="text"
                value={transitionNote}
                onChange={(e) => setTransitionNote(e.target.value)}
                placeholder="e.g. Pembayaran dicek rekening BCA / Barang siap di pickup point"
                className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700 rounded-xl text-xs text-white placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {order.orderStatus === "READY_FOR_PICKUP" && (
              <div>
                <label className="block text-[11px] font-semibold text-emerald-200 mb-1">
                  Catatan Pengiriman Kurir
                </label>
                <input
                  type="text"
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  placeholder="e.g. Dibawa Mas Budi - Motor Revo Hitam"
                  className="w-full px-3 py-2 bg-emerald-900/60 border border-emerald-700 rounded-xl text-xs text-white placeholder-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {order.orderStatus === "PENDING_PAYMENT" && (
              <>
                <button
                  onClick={() => handleStatusTransition("PAID", "Pembayaran terverifikasi oleh kasir")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Terima Pembayaran (Tandai Lunas)
                </button>
                <button
                  onClick={() => handleStatusTransition("CANCELLED", "Pesanan dibatalkan admin (belum bayar)")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-800/80 hover:bg-red-700 text-red-100 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Batalkan Pesanan
                </button>
              </>
            )}

            {order.orderStatus === "PAID" && (
              <>
                <button
                  onClick={() => handleStatusTransition("PROCESSING", "Pesanan sedang disiapkan tim toko")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <PackageCheck className="w-4 h-4" />
                  Siapkan Barang Belanja
                </button>
                <button
                  onClick={() => handleStatusTransition("CANCELLED", "Pesanan dibatalkan atas permintaan pembeli")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-800/80 hover:bg-red-700 text-red-100 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Batalkan &amp; Retur Stok
                </button>
              </>
            )}

            {order.orderStatus === "PROCESSING" && (
              <>
                <button
                  onClick={() => handleStatusTransition("READY_FOR_PICKUP", "Pesanan selesai dikemas, siap diserahkan ke kurir")}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Barang Selesai Dikemas (Siap Kirim)
                </button>
                <button
                  onClick={() => handleStatusTransition("CANCELLED", "Pesanan dibatalkan saat proses")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 bg-red-800/80 hover:bg-red-700 text-red-100 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Batalkan &amp; Retur Stok
                </button>
              </>
            )}

            {order.orderStatus === "READY_FOR_PICKUP" && (
              <button
                onClick={() => handleStatusTransition("OUT_FOR_DELIVERY", "Kurir Toko Saudara berangkat mengantar pesanan")}
                disabled={actionLoading}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Truck className="w-4 h-4" />
                Serahkan ke Kurir (Mulai Pengantaran)
              </button>
            )}

            {order.orderStatus === "OUT_FOR_DELIVERY" && (
              <button
                onClick={() => handleStatusTransition("DELIVERED", "Pesanan telah sampai di tangan pelanggan dengan sukses")}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Konfirmasi Selesai Diterima
              </button>
            )}

            {(order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") && (
              <span className="text-xs text-emerald-300 font-medium italic">
                Status pesanan sudah final ({statusCfg.label}). Tidak ada aksi lanjutan.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Items Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-700" />
                  Rincian Komoditas (Snapshot Saat Pesanan Dibuat)
                </h2>
                <p className="text-xs text-stone-400">
                  Nama produk &amp; harga terkunci dari fluktuasi pasar saat checkout
                </p>
              </div>
              <span className="text-xs font-bold text-stone-700">
                {order.items.length} Item
              </span>
            </div>

            <div className="divide-y divide-stone-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm text-stone-900">
                      {item.productNameSnapshot}
                    </p>
                    <p className="text-xs text-stone-500">
                      Varian: <span className="font-medium text-stone-700">{item.unitNameSnapshot}</span> &bull; {formatRupiah(item.unitPrice)} / unit
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-stone-500">
                      Jumlah: <strong className="text-stone-900">{item.quantity}</strong>
                    </p>
                    <p className="text-sm font-bold text-emerald-800">
                      {formatRupiah(item.subtotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-stone-50 p-5 border-t border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal Produk:</span>
                <span className="font-medium">{formatRupiah(order.subtotal)}</span>
              </div>
              {order.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Potongan Promo Toko:</span>
                  <span>-{formatRupiah(order.discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span>Biaya Kirim (Kurir Toko):</span>
                <span className="font-medium">{formatRupiah(order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Grand Total:</span>
                <span className="text-emerald-800">{formatRupiah(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {order.notes && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl text-xs text-amber-900">
              <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                <FileText className="w-4 h-4 text-amber-600" />
                Catatan Khusus dari Pelanggan:
              </div>
              <p className="italic">{order.notes}</p>
            </div>
          )}

          {/* Status History Trail */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-3">
              <History className="w-4 h-4 text-emerald-700" />
              Jejak Riwayat Status Pesanan (Audit Trail)
            </h3>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
              {order.statusHistory.map((h) => (
                <div key={h.id} className="relative">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900">
                        {STATUS_CONFIG[h.toStatus]?.label || h.toStatus}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(h.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {h.note && (
                      <p className="text-stone-600 text-[11px] mt-0.5">{h.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer, Delivery, Payment Cards */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700" />
              Data Pelanggan
            </h3>
            <div className="text-xs space-y-1">
              <p className="font-bold text-stone-900 text-sm">
                {order.user?.profile?.name || "Pelanggan Toko"}
              </p>
              <p className="text-stone-600">{order.user?.email}</p>
              <p className="text-stone-600">{order.user?.phone || order.user?.profile?.phone || "No HP tidak dicantumkan"}</p>
            </div>
          </div>

          {/* Delivery & Address Snapshot */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700" />
              Alamat &amp; Jadwal Pengiriman
            </h3>
            <div className="text-xs space-y-2 text-stone-700">
              <div>
                <span className="text-stone-400 text-[11px] block">Penerima:</span>
                <span className="font-semibold text-stone-900">{parsedAddress.recipientName || order.user?.profile?.name}</span>
                <span className="block text-stone-500">{parsedAddress.phone}</span>
              </div>
              <div>
                <span className="text-stone-400 text-[11px] block">Alamat Tujuan:</span>
                <p className="leading-relaxed">
                  {parsedAddress.addressLine}
                  {parsedAddress.district && `, Kec. ${parsedAddress.district}`}
                  {parsedAddress.city && `, ${parsedAddress.city}`}
                  {parsedAddress.postalCode && ` ${parsedAddress.postalCode}`}
                </p>
              </div>

              {order.delivery && (
                <div className="pt-2 border-t border-stone-100 space-y-1">
                  <div className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Metode: {order.delivery.method}</span>
                  </div>
                  {order.delivery.scheduledDate && (
                    <div className="flex items-center gap-1 text-stone-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        Jadwal: {order.delivery.scheduledDate}{" "}
                        {order.delivery.slotStart && `(${order.delivery.slotStart} - ${order.delivery.slotEnd})`}
                      </span>
                    </div>
                  )}
                  {order.delivery.trackingNote && (
                    <p className="text-[11px] bg-stone-50 p-2 rounded-lg text-stone-600">
                      Info Kurir: {order.delivery.trackingNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              Informasi Pembayaran
            </h3>
            <div className="text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Metode:</span>
                <span className="font-semibold text-stone-900">
                  {order.payment?.method === "BANK_TRANSFER" ? "Transfer Bank" : "COD (Bayar di Tempat)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Status Pembayaran:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    order.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.payment?.providerReference && (
                <div className="flex justify-between items-center text-stone-500">
                  <span>Nomor Referensi:</span>
                  <span className="font-mono text-[11px]">{order.payment.providerReference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
