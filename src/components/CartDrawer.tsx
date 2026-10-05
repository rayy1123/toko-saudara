"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";

export function CartDrawer() {
  const { cart, totalItems, subtotal, updateQuantity, removeFromCart, isCartOpen, setIsCartOpen } = useStore();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-saudara-green-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-saudara-green-200" />
              <h2 className="font-semibold text-lg">Keranjang Belanja</h2>
              <span className="text-xs bg-saudara-green-900 text-saudara-green-100 px-2 py-0.5 rounded-full font-bold">
                {totalItems} item
              </span>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Tutup keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto p-4 divide-y divide-saudara-cream-200">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <ShoppingBag className="w-16 h-16 text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700 text-base">Keranjang Anda masih kosong</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Yuk isi dengan sayur petik subuh dan sembako berkualitas dari Pasar Saudara!
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 market-btn-primary text-sm py-2 px-4"
                >
                  Mulai Belanja Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3 py-2">
                {cart.map((item) => (
                  <div key={item.productUnitId} className="flex gap-3 py-2">
                    <img
                      src={item.imageUrl || "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300"}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-xl border border-saudara-cream-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-xs text-gray-500">{item.unitName}</p>
                      <p className="text-sm font-bold text-saudara-green-700 mt-1">
                        {formatRupiah(item.price)}
                      </p>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center border border-gray-200 rounded-lg bg-saudara-cream-50">
                          <button
                            onClick={() => updateQuantity(item.productUnitId, item.quantity - 1)}
                            className="p-1 hover:bg-white rounded-l-lg transition-colors text-gray-600"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productUnitId, item.quantity + 1)}
                            className="p-1 hover:bg-white rounded-r-lg transition-colors text-gray-600"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productUnitId)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                          aria-label="Hapus item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {cart.length > 0 && (
            <div className="p-4 bg-saudara-cream-50 border-t border-saudara-cream-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Subtotal Belanja</span>
                <span className="text-base font-bold text-saudara-green-800">{formatRupiah(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Ongkir & diskon dihitung di halaman pembayaran.</p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/keranjang"
                  onClick={() => setIsCartOpen(false)}
                  className="market-btn-outline text-center text-sm py-2"
                >
                  Lihat Keranjang
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="market-btn-orange text-center text-sm py-2"
                >
                  Checkout <ArrowRight className="w-4 h-4 inline" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
