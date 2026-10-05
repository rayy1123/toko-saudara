"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import {
  ShoppingBag,
  Sparkles,
  Scale,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Check,
  Zap,
} from "lucide-react";

export interface ProductDetailProps {
  product: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    isFresh?: boolean;
    harvestInfo?: string | null;
    category: {
      name: string;
      slug: string;
    };
    units: Array<{
      id: string;
      unitName: string;
      unitCode: string;
      price: number;
      stockQuantity: number;
      lowStockThreshold?: number;
    }>;
  };
}

export function ProductDetailClient({ product }: ProductDetailProps) {
  const router = useRouter();
  const { addToCart, setIsCartOpen } = useStore();
  const units = product.units || [];

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    units[0]?.id || "default"
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdded, setIsAdded] = useState(false);

  const activeUnit = units.find((u) => u.id === selectedUnitId) || units[0] || {
    id: "default",
    unitName: "1 Pcs",
    unitCode: "pcs",
    price: 0,
    stockQuantity: 10,
  };

  const isLowStock = activeUnit.stockQuantity <= (activeUnit.lowStockThreshold || 5);
  const totalPrice = activeUnit.price * quantity;

  const handleAddToCart = () => {
    addToCart(
      {
        productUnitId: activeUnit.id,
        productId: product.id,
        name: product.name,
        unitName: activeUnit.unitName,
        unitCode: activeUnit.unitCode,
        price: activeUnit.price,
        imageUrl: product.imageUrl,
        slug: product.slug,
        stockQuantity: activeUnit.stockQuantity,
      },
      quantity
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        productUnitId: activeUnit.id,
        productId: product.id,
        name: product.name,
        unitName: activeUnit.unitName,
        unitCode: activeUnit.unitCode,
        price: activeUnit.price,
        imageUrl: product.imageUrl,
        slug: product.slug,
        stockQuantity: activeUnit.stockQuantity,
      },
      quantity
    );
    router.push("/checkout");
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
      {/* Left: Product Image & Freshness Badge */}
      <div className="space-y-4">
        <div className="relative aspect-square rounded-3xl overflow-hidden bg-saudara-cream-100 border border-saudara-cream-200 shadow-sm">
          <img
            src={
              product.imageUrl ||
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop"
            }
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Freshness Badge */}
          {product.isFresh && (
            <div className="absolute top-4 left-4">
              <span className="market-badge bg-saudara-green-800 text-white shadow-md text-xs py-1 px-3">
                <Sparkles className="w-3.5 h-3.5 text-saudara-orange-300" />
                Segar Subuh Hari Ini
              </span>
            </div>
          )}

          {/* Harvest Info Note */}
          {product.harvestInfo && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-xs text-white p-3 rounded-2xl text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-saudara-green-400 shrink-0 animate-ping" />
              <span>{product.harvestInfo}</span>
            </div>
          )}
        </div>

        {/* Store Location Info Box */}
        <div className="bg-saudara-green-50/70 border border-saudara-green-200 rounded-2xl p-4 flex items-start gap-3">
          <Truck className="w-5 h-5 text-saudara-green-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h5 className="font-bold text-saudara-green-900">Kios Toko Saudara Pasar Kramat Jati</h5>
            <p className="text-gray-600 mt-0.5 leading-relaxed">
              Jam operasional buka &amp; pengantaran: 15:30 WIB - 06:00 WIB ke seluruh area Kramat Jati Jakarta Timur dan sekitarnya.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Product Info & Interactive Buying */}
      <div className="flex flex-col justify-between space-y-6">
        <div className="space-y-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-saudara-green-700">
              {product.category.name} • SKU: {product.sku}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-1">
              {product.name}
            </h1>
          </div>

          {/* Price display with unit */}
          <div className="p-4 rounded-2xl bg-saudara-cream-50 border border-saudara-cream-200 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-gray-400 block font-medium">Harga Toko Saudara</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-saudara-green-800">
                {formatRupiah(activeUnit.price)}
              </span>
              <span className="text-xs text-gray-500 ml-1">/ {activeUnit.unitName}</span>
            </div>

            {/* Stock indicator */}
            <div className="text-right">
              <span
                className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                  isLowStock
                    ? "bg-saudara-orange-100 text-saudara-orange-700"
                    : "bg-saudara-green-100 text-saudara-green-800"
                }`}
              >
                {isLowStock
                  ? `Tersisa ${activeUnit.stockQuantity} ${activeUnit.unitCode}`
                  : `Stok Tersedia: ${activeUnit.stockQuantity} ${activeUnit.unitCode}`}
              </span>
            </div>
          </div>

          {/* Unit Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center justify-between">
              <span>Pilihan Satuan / Timbangan:</span>
              <span className="text-gray-400 font-normal normal-case">
                Timbangan digital pas & jujur
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {units.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                return (
                  <button
                    key={unit.id}
                    type="button"
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-saudara-green-800 text-white border-saudara-green-800 shadow-sm"
                        : "bg-white text-gray-800 border-saudara-cream-200 hover:border-saudara-green-600/40 hover:bg-saudara-cream-50"
                    }`}
                  >
                    <span className="block text-xs font-bold">{unit.unitName}</span>
                    <span
                      className={`block text-xs mt-1 font-semibold ${
                        isSelected ? "text-saudara-cream-100" : "text-saudara-green-700"
                      }`}
                    >
                      {formatRupiah(unit.price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1.5 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Deskripsi & Info Kesegaran
              </h4>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
              Jumlah Pesanan:
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-saudara-cream-200 bg-white rounded-xl shadow-2xs">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  className="p-2.5 hover:bg-saudara-cream-50 rounded-l-xl text-gray-700 transition-colors"
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-sm font-bold text-gray-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((prev) =>
                      Math.min(activeUnit.stockQuantity, prev + 1)
                    )
                  }
                  className="p-2.5 hover:bg-saudara-cream-50 rounded-r-xl text-gray-700 transition-colors"
                  aria-label="Tambah jumlah"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-xs text-gray-500">
                Total: <b className="text-gray-900">{formatRupiah(totalPrice)}</b>
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-4 border-t border-saudara-cream-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className={`market-btn-primary py-3 px-4 text-sm font-bold w-full transition-all ${
                isAdded ? "bg-saudara-green-900" : ""
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-saudara-green-200" />
                  Berhasil Ditambahkan!
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  + Masukkan Keranjang
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              className="market-btn-orange py-3 px-4 text-sm font-bold w-full shadow-md shadow-saudara-orange-600/20 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              Beli Langsung
            </button>
          </div>

          {/* Delivery Note */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 pt-1">
            <Truck className="w-3.5 h-3.5 text-saudara-green-700" />
            <span>Pengantaran pagi mulai 06:00 WIB • Langsung gantung di pagar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
