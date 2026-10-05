"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import { ShoppingBag, Sparkles, Check, ChevronDown } from "lucide-react";

export interface ProductUnitData {
  id: string;
  unitName: string;
  unitCode: string;
  price: number;
  stockQuantity: number;
  lowStockThreshold?: number;
}

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    imageUrl?: string | null;
    isFresh?: boolean;
    harvestInfo?: string | null;
    category?: {
      name: string;
      slug: string;
    };
    units: ProductUnitData[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useStore();
  const [selectedUnitIndex, setSelectedUnitIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  const units = product.units || [];
  const activeUnit = units[selectedUnitIndex] || {
    id: "default",
    unitName: "1 Pcs",
    unitCode: "pcs",
    price: 0,
    stockQuantity: 10,
  };

  const isLowStock = activeUnit.stockQuantity <= (activeUnit.lowStockThreshold || 5);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

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
      1
    );

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1200);
  };

  return (
    <div className="group market-card flex flex-col overflow-hidden relative">
      {/* Product Image & Badges */}
      <div className="relative aspect-4/3 overflow-hidden bg-saudara-cream-100">
        <Link href={`/produk/${product.slug}`} className="block w-full h-full">
          <img
            src={
              product.imageUrl ||
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop"
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>

        {/* Freshness Badge */}
        {product.isFresh && (
          <div className="absolute top-2 left-2 z-10">
            <span className="market-badge bg-saudara-green-700 text-white shadow-xs">
              <Sparkles className="w-3 h-3 text-saudara-orange-300" />
              Segar Subuh
            </span>
          </div>
        )}

        {/* Stock Alert Badge */}
        {isLowStock && activeUnit.stockQuantity > 0 && (
          <div className="absolute top-2 right-2 z-10">
            <span className="market-badge bg-saudara-orange-600 text-white shadow-xs">
              Sisa {activeUnit.stockQuantity}
            </span>
          </div>
        )}
      </div>

      {/* Product Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Harvest Info */}
          <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
            <span className="font-medium text-saudara-green-700 uppercase tracking-wider">
              {product.category?.name || "Pasar Segar"}
            </span>
            {product.harvestInfo && (
              <span className="truncate max-w-[130px] text-gray-400" title={product.harvestInfo}>
                {product.harvestInfo}
              </span>
            )}
          </div>

          {/* Title */}
          <Link href={`/produk/${product.slug}`}>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-saudara-green-800 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Unit Selector & Price */}
        <div className="mt-3 pt-3 border-t border-saudara-cream-200/70 space-y-2.5">
          {/* Unit selection pills or dropdown */}
          {units.length > 1 ? (
            <div className="relative">
              <select
                value={selectedUnitIndex}
                onChange={(e) => setSelectedUnitIndex(Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-full text-xs font-medium py-1.5 px-2.5 pr-7 bg-saudara-cream-50 hover:bg-saudara-cream-100 border border-saudara-cream-200 rounded-lg text-gray-700 appearance-none focus:outline-hidden focus:ring-1 focus:ring-saudara-green-600 cursor-pointer"
              >
                {units.map((unit, idx) => (
                  <option key={unit.id} value={idx}>
                    {unit.unitName} ({formatRupiah(unit.price)})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          ) : (
            <p className="text-xs text-gray-500 font-medium">{activeUnit.unitName}</p>
          )}

          {/* Price & Add Button */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-gray-400 block leading-tight">Harga</span>
              <span className="text-base sm:text-lg font-extrabold text-saudara-green-800">
                {formatRupiah(activeUnit.price)}
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                isAdded
                  ? "bg-saudara-green-800 text-white"
                  : "bg-saudara-green-700 hover:bg-saudara-green-800 text-white active:scale-95"
              }`}
              title="Tambah ke Keranjang"
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 text-saudara-green-200" />
                  <span className="hidden sm:inline">Ditambah</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">+ Beli</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
