"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Truck,
  CheckCircle,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

export default function KeranjangPage() {
  const {
    cart,
    totalItems,
    subtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
    appliedPromo,
    discountAmount,
    applyPromo,
    removePromo,
  } = useStore();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);

  // Standard shipping estimation: 8000 for Sukasari, free if subtotal >= 60000
  const estimatedShipping = subtotal >= 60000 || subtotal === 0 ? 0 : 8000;
  const grandTotal = Math.max(0, subtotal - discountAmount + estimatedShipping);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    if (!promoInput.trim()) return;

    const result = await applyPromo(promoInput.trim());
    if (!result.success) {
      setPromoError(result.message);
    } else {
      setPromoInput("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/" className="hover:text-saudara-green-800 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-saudara-green-900 font-bold">Keranjang Belanja</span>
      </nav>

      {/* Page Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-saudara-cream-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-saudara-green-900 tracking-tight">
            Keranjang Belanja Pasar
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Periksa belanjaan Anda sebelum melanjutkan ke pengiriman & jadwal antar pagi.
          </p>
        </div>

        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-800 font-semibold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Kosongkan Keranjang
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        /* Empty Cart State */
        <div className="bg-white rounded-3xl p-12 text-center border border-saudara-cream-200 max-w-lg mx-auto space-y-4 my-8 shadow-xs">
          <div className="w-20 h-20 rounded-full bg-saudara-cream-100 flex items-center justify-center mx-auto text-gray-400">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Keranjang Belanja Anda Kosong</h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Belum ada sayur atau sembako yang dipilih. Yuk isi dapur dengan sayuran segar kualitas pasar langsung dari petani!
            </p>
          </div>
          <div className="pt-2">
            <Link href="/kategori" className="market-btn-primary inline-flex text-sm py-2.5 px-6 font-bold">
              Mulai Belanja Sayur Segar
            </Link>
          </div>
        </div>
      ) : (
        /* Active Cart Table & Summary */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Shipping Progress Indicator */}
            <div className="bg-saudara-green-50 border border-saudara-green-200 rounded-2xl p-4 flex items-center gap-3">
              <Truck className="w-6 h-6 text-saudara-green-700 shrink-0" />
              <div className="flex-1 text-xs">
                {subtotal >= 60000 ? (
                  <p className="font-bold text-saudara-green-800 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-saudara-green-600 inline" />
                    Selamat! Anda mendapatkan <b>GRATIS ONGKIR</b> pengantaran subuh.
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-700">
                      Tambah belanja <b>{formatRupiah(60000 - subtotal)}</b> lagi untuk mendapatkan{" "}
                      <b className="text-saudara-green-800">GRATIS ONGKIR</b>!
                    </p>
                    <div className="w-full bg-saudara-cream-200 h-2 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-saudara-green-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (subtotal / 60000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-3xl border border-saudara-cream-200 divide-y divide-saudara-cream-200 shadow-xs overflow-hidden">
              {cart.map((item) => (
                <div
                  key={item.productUnitId}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-saudara-cream-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={
                        item.imageUrl ||
                        "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300"
                      }
                      alt={item.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-saudara-cream-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/produk/${item.slug}`}
                        className="text-sm sm:text-base font-bold text-gray-900 hover:text-saudara-green-800 transition-colors line-clamp-1"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        Satuan: {item.unitName}
                      </p>
                      <p className="text-xs font-semibold text-saudara-green-700 mt-1">
                        {formatRupiah(item.price)} <span className="text-gray-400 font-normal">/ item</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity Stepper & Subtotal */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-saudara-cream-100">
                    {/* Stepper */}
                    <div className="flex items-center border border-saudara-cream-200 rounded-xl bg-saudara-cream-50 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.productUnitId, item.quantity - 1)}
                        className="p-2 hover:bg-white rounded-l-xl text-gray-700 transition-colors"
                        aria-label="Kurangi"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productUnitId, item.quantity + 1)}
                        className="p-2 hover:bg-white rounded-r-xl text-gray-700 transition-colors"
                        aria-label="Tambah"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line item subtotal */}
                    <div className="text-right min-w-[90px]">
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.productUnitId)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 px-2">
              <Link href="/kategori" className="hover:text-saudara-green-800 font-bold flex items-center gap-1">
                ← Lanjut Belanja Sayur & Bumbu Lain
              </Link>
              <span>{totalItems} total barang di keranjang</span>
            </div>
          </div>

          {/* Right Column: Order Summary & Promo Voucher */}
          <div className="lg:col-span-4 space-y-4">
            {/* Promo Voucher Box */}
            <div className="bg-white rounded-3xl p-5 border border-saudara-cream-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-saudara-orange-600" />
                <h3 className="font-bold text-sm text-gray-900">Punya Kode Voucher?</h3>
              </div>

              {appliedPromo ? (
                <div className="bg-saudara-green-50 border border-saudara-green-300 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-saudara-green-800 uppercase block">
                        {appliedPromo.code} Aktif
                      </span>
                      <span className="text-saudara-green-700">{appliedPromo.name}</span>
                    </div>
                    <button
                      onClick={removePromo}
                      className="p-1 hover:bg-saudara-green-200 rounded-lg text-saudara-green-800"
                      title="Hapus voucher"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {appliedPromo.itemBreakdowns && appliedPromo.itemBreakdowns.length > 0 && (
                    <div className="pt-2 border-t border-saudara-green-200 text-[11px] space-y-1">
                      <span className="text-stone-600 font-bold block">Potongan Barang yang Ditentukan Admin:</span>
                      {appliedPromo.itemBreakdowns.map((b) => (
                        <div key={b.productUnitId} className="flex justify-between text-saudara-green-900">
                          <span className="truncate pr-2">
                            • {b.productName} ({b.unitName}) x{b.quantity}
                          </span>
                          <span className="font-black shrink-0">-{formatRupiah(b.subtotalDiscount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleApplyPromo} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Ketik: LANGGANAN"
                      className="flex-1 px-3 py-2 text-xs bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl uppercase tracking-wider focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
                    />
                    <button
                      type="submit"
                      className="market-btn-primary text-xs py-2 px-3.5 font-bold"
                    >
                      Pakai
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-red-600 font-medium">{promoError}</p>
                  )}
                  <p className="text-[11px] text-gray-400">
                    Kupon langganan: <b>LANGGANAN</b> (Potongan 15% Pelanggan Setia)
                  </p>
                </form>
              )}
            </div>

            {/* Order Price Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-saudara-cream-200 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-gray-900 pb-2 border-b border-saudara-cream-200">
                Ringkasan Belanja
              </h3>

              <div className="space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({totalItems} barang)</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(subtotal)}</span>
                </div>

                {appliedPromo && (
                  <div className="flex justify-between text-saudara-green-700 font-medium">
                    <span>Diskon Voucher ({appliedPromo.code})</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Estimasi Ongkos Kirim Pagi</span>
                  {estimatedShipping === 0 ? (
                    <span className="text-saudara-green-700 font-bold">GRATIS</span>
                  ) : (
                    <span className="font-semibold text-gray-900">
                      {formatRupiah(estimatedShipping)}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-saudara-cream-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-base font-black text-gray-900 block">Total Pembayaran</span>
                    <span className="text-[11px] text-gray-400 font-normal">Sudah termasuk PPN & kemasan</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-saudara-green-800">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="market-btn-orange w-full py-3.5 px-4 text-center font-bold text-sm shadow-md shadow-saudara-orange-600/20 active:scale-95 flex items-center justify-center gap-2"
              >
                <span>Lanjut ke Pembayaran</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              {/* Guarantee text */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-saudara-green-700" />
                <span>Transaksi aman & garansi ganti 100% jika layu</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
