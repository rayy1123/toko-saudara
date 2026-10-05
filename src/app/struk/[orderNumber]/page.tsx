"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";
import {
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  MessageCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";

interface ReceiptData {
  orderId: string;
  orderNumber: string;
  orderType: string;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    address: string;
    district: string;
    city: string;
  };
  items: Array<{
    id: string;
    name: string;
    unit: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
  pricing: {
    subtotal: number;
    discountTotal: number;
    shippingFee: number;
    grandTotal: number;
    cashTendered?: number | null;
    changeReturned?: number | null;
  };
  payment: {
    method: string;
    status: string;
    paidAt?: string | null;
  };
  delivery?: {
    method: string;
    status: string;
    slot: string;
    scheduledDate?: string | null;
    trackingNote?: string | null;
  } | null;
  notes?: string | null;
  orderStatus: string;
}

export default function EReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderNumber = params?.orderNumber as string;

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderNumber) return;

    fetch(`/api/v1/receipts/${orderNumber}`)
      .then((res) => {
        if (!res.ok) throw new Error("Struk tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        if (data.data) {
          setReceipt(data.data);
        } else {
          throw new Error(data.error?.message || "Gagal memuat struk");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!receipt) return;
    const phone = receipt.customer.phone.replace(/[^0-9]/g, "");
    const targetPhone = phone.startsWith("0") ? "62" + phone.slice(1) : phone;

    const itemListText = receipt.items
      .map((it, idx) => `${idx + 1}. ${it.name} (${it.unit}) x${it.quantity} = Rp ${it.subtotal.toLocaleString("id-ID")}`)
      .join("\n");

    const message = `*STRUK DIGITAL — TOKO SAUDARA*\n` +
      `_Dari Pasar Ke Rumah_\n\n` +
      `No. Pesanan: *${receipt.orderNumber}*\n` +
      `Tanggal: ${new Date(receipt.createdAt).toLocaleString("id-ID")}\n` +
      `Penerima: ${receipt.customer.name}\n` +
      `Alamat: ${receipt.customer.address}, ${receipt.customer.district}\n\n` +
      `*Daftar Belanja:*\n${itemListText}\n\n` +
      `Subtotal: Rp ${receipt.pricing.subtotal.toLocaleString("id-ID")}\n` +
      (receipt.pricing.discountTotal > 0 ? `Diskon: -Rp ${receipt.pricing.discountTotal.toLocaleString("id-ID")}\n` : "") +
      `Ongkir: Rp ${receipt.pricing.shippingFee.toLocaleString("id-ID")}\n` +
      `*TOTAL: Rp ${receipt.pricing.grandTotal.toLocaleString("id-ID")}*\n` +
      `Metode: ${receipt.payment.method} (${receipt.payment.status === "PAID" ? "Lunas" : "Bayar di Tempat"})\n\n` +
      `Lihat struk lengkap & lacak belanjaan:\n${window.location.href}\n\n` +
      `_Terima kasih telah berbelanja di Toko Saudara Pasar Kramat Jati Jakarta Timur!_`;

    window.open(`https://wa.me/6282246193969?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-sm font-medium text-stone-600">Menyiapkan struk belanja digital...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h1 className="text-lg font-bold text-stone-900">Struk Tidak Ditemukan</h1>
          <p className="text-xs text-stone-500">{error || "Nomor pesanan tidak valid atau belum tercatat."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const isPos = receipt.orderType === "POS_OFFLINE";
  const formattedDate = new Date(receipt.createdAt).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = new Date(receipt.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-stone-100 py-6 sm:py-10 px-4">
      {/* Top Action Bar (Hidden during print) */}
      <div className="max-w-md mx-auto mb-6 flex items-center justify-between gap-2 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-800 bg-white px-3 py-2 rounded-xl shadow-xs border border-stone-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Beranda Toko
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1 text-xs font-medium bg-white hover:bg-stone-50 text-stone-700 px-3 py-2 rounded-xl border border-stone-200 shadow-xs"
            title="Salin Link Struk"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? "Tersalin" : "Salin Link"}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl shadow-xs"
            title="Kirim ke WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white px-3.5 py-2 rounded-xl shadow-xs"
            title="Cetak Struk"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>

      {/* Main E-Receipt Box (Printable) */}
      <div
        id="receipt-container"
        className="max-w-md mx-auto bg-white rounded-3xl shadow-md border border-stone-200 overflow-hidden font-mono text-stone-800 print:shadow-none print:border-none print:m-0 print:max-w-none print:w-full"
      >
        {/* Decorative receipt header banner */}
        <div className="bg-emerald-800 text-white p-5 text-center relative print:bg-white print:text-black print:p-2 print:border-b">
          <div className="flex justify-center mb-2">
            <img
              src="/logo.png"
              alt="Toko Saudara"
              className="w-14 h-14 object-contain bg-white rounded-2xl p-1 shadow-xs print:w-10 print:h-10"
            />
          </div>
          <h1 className="text-xl font-black tracking-wider uppercase font-sans">TOKO SAUDARA</h1>
          <p className="text-xs text-emerald-200 print:text-stone-600 font-sans mt-0.5 font-bold">
            Dari Pasar Ke Rumah
          </p>
          <p className="text-[11px] text-emerald-300 print:text-stone-500 mt-1 font-sans">
            Kios Toko Saudara, Pasar Kramat Jati, Jakarta Timur
          </p>
          <p className="text-[11px] text-emerald-300 print:text-stone-500 font-sans">
            Jam Buka: 15:30 WIB - 06:00 WIB • WhatsApp: 082246193969
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/80 print:border print:bg-white print:text-black text-[11px] font-sans font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 print:text-black" />
            <span>STRUK RESMI PEMBELIAN</span>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Metadata */}
          <div className="border-b border-dashed border-stone-300 pb-3 space-y-1">
            <div className="flex justify-between">
              <span className="text-stone-500">No. Nota / Struk:</span>
              <span className="font-bold text-stone-900">{receipt.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Waktu Transaksi:</span>
              <span>{formattedDate}, {formattedTime} WIB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Jenis Layanan:</span>
              <span className="font-semibold text-emerald-800">
                {isPos ? "Kasir Toko (Offline)" : "Pesanan Diantar (Online)"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Nama Pelanggan:</span>
              <span className="font-bold">{receipt.customer.name}</span>
            </div>
            {receipt.customer.phone && receipt.customer.phone !== "-" && (
              <div className="flex justify-between">
                <span className="text-stone-500">No. WhatsApp:</span>
                <span>{receipt.customer.phone}</span>
              </div>
            )}
            {!isPos && (
              <div className="pt-1 text-[11px] text-stone-600">
                <span className="text-stone-400 block">Alamat Pengantaran:</span>
                <span className="font-sans block mt-0.5 leading-snug">
                  {receipt.customer.address}, Kec. {receipt.customer.district}, {receipt.customer.city}
                </span>
                {receipt.delivery?.slot && (
                  <span className="text-emerald-700 font-semibold block mt-0.5">
                    Antar: {receipt.delivery.slot} WIB
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <div className="flex justify-between font-bold text-stone-700 border-b border-stone-200 pb-1.5 mb-2">
              <span>Item Belanjaan</span>
              <span>Subtotal</span>
            </div>

            <div className="space-y-2.5">
              {receipt.items.map((item, idx) => (
                <div key={item.id || idx} className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <div className="font-bold text-stone-900 leading-tight">
                      {idx + 1}. {item.name}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      {item.quantity} {item.unit} x Rp {item.price.toLocaleString("id-ID")}
                    </div>
                  </div>
                  <div className="font-bold text-stone-900 whitespace-nowrap">
                    Rp {item.subtotal.toLocaleString("id-ID")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-dashed border-stone-300 pt-3 space-y-1.5">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal Produk:</span>
              <span>Rp {receipt.pricing.subtotal.toLocaleString("id-ID")}</span>
            </div>

            {receipt.pricing.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Potongan Promo:</span>
                <span>-Rp {receipt.pricing.discountTotal.toLocaleString("id-ID")}</span>
              </div>
            )}

            {!isPos && (
              <div className="flex justify-between text-stone-600">
                <span>Biaya Pengantaran Toko:</span>
                <span>
                  {receipt.pricing.shippingFee === 0
                    ? "GRATIS"
                    : `Rp ${receipt.pricing.shippingFee.toLocaleString("id-ID")}`}
                </span>
              </div>
            )}

            <div className="border-t-2 border-stone-900 pt-2 mt-2 flex justify-between items-baseline text-sm font-black">
              <span className="uppercase">TOTAL TAGIHAN:</span>
              <span className="text-base text-emerald-900">
                Rp {receipt.pricing.grandTotal.toLocaleString("id-ID")}
              </span>
            </div>

            <div className="flex justify-between text-stone-600 pt-1">
              <span>Metode Pembayaran:</span>
              <span className="font-bold uppercase">{receipt.payment.method}</span>
            </div>

            {receipt.pricing.cashTendered && receipt.pricing.cashTendered > 0 && (
              <>
                <div className="flex justify-between text-stone-600">
                  <span>Uang Diterima (Tunai):</span>
                  <span>Rp {receipt.pricing.cashTendered.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between text-stone-600 font-bold">
                  <span>Kembalian:</span>
                  <span>Rp {(receipt.pricing.changeReturned || 0).toLocaleString("id-ID")}</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center pt-1.5">
              <span>Status Pembayaran:</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  receipt.payment.status === "PAID" || receipt.payment.status === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {receipt.payment.status === "PAID" || receipt.payment.status === "COMPLETED"
                  ? "LUNAS / BERHASIL"
                  : "BELUM DIBAYAR (COD)"}
              </span>
            </div>
          </div>

          {/* Notes if any */}
          {receipt.notes && (
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 text-[11px] text-stone-600">
              <span className="font-bold block text-stone-700">Catatan Pesanan:</span>
              <span className="font-sans italic">{receipt.notes}</span>
            </div>
          )}

          {/* Footer Receipt Notice */}
          <div className="border-t border-dashed border-stone-300 pt-4 text-center space-y-2">
            <p className="font-sans font-bold text-stone-800">
              Terima Kasih Telah Berbelanja di Toko Saudara!
            </p>
            <p className="font-sans text-[11px] text-stone-500 leading-relaxed">
              Kios Toko Saudara, Pasar Kramat Jati Jakarta Timur. Timbangan pas &amp; jujur digital.
            </p>

            <div className="pt-2 text-[9px] text-stone-400">
              Simpan struk ini sebagai bukti transaksi resmi Toko Saudara • {receipt.orderNumber}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Navigation (Mobile) */}
      <div className="max-w-md mx-auto mt-6 text-center print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 hover:text-emerald-900 underline"
        >
          <ShoppingBag className="w-4 h-4" /> Belanja kebutuhan dapur lainnya
        </Link>
      </div>
    </div>
  );
}
