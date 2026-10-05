"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { formatRupiah } from "@/lib/utils";
import { RotateCcw, ShoppingBag, Sparkles } from "lucide-react";

interface RepeatItem {
  id: string;
  name: string;
  unitName: string;
  unitCode: string;
  price: number;
  imageUrl: string;
  slug: string;
  lastPurchased: string;
}

const defaultRepeatItems: RepeatItem[] = [
  {
    id: "rep-1",
    name: "Bayam Hijau Segar",
    unitName: "1 Ikat (±250g)",
    unitCode: "ikat",
    price: 3500,
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=600&auto=format&fit=crop",
    slug: "bayam-hijau-segar",
    lastPurchased: "3 hari yang lalu",
  },
  {
    id: "rep-2",
    name: "Cabai Merah Keriting",
    unitName: "250 Gram (1/4 kg)",
    unitCode: "g",
    price: 12000,
    imageUrl: "https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop",
    slug: "cabai-merah-keriting",
    lastPurchased: "Minggu lalu",
  },
  {
    id: "rep-3",
    name: "Minyak Goreng Sawit Pouch 2L",
    unitName: "Pouch 2 Liter",
    unitCode: "liter",
    price: 34500,
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop",
    slug: "minyak-goreng-sawit-2l",
    lastPurchased: "2 minggu lalu",
  },
  {
    id: "rep-4",
    name: "Telur Ayam Negeri Segar",
    unitName: "1 Kilogram (±16 butir)",
    unitCode: "kg",
    price: 28500,
    imageUrl: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&auto=format&fit=crop",
    slug: "telur-ayam-negeri-segar",
    lastPurchased: "5 hari yang lalu",
  },
];

export function HomeRepeatOrder() {
  const { user, addToCart, showToast } = useStore();

  const handleReorder = (item: RepeatItem) => {
    addToCart({
      productUnitId: `unit-${item.id}`,
      productId: item.id,
      name: item.name,
      unitName: item.unitName,
      unitCode: item.unitCode,
      price: item.price,
      imageUrl: item.imageUrl,
      slug: item.slug,
    });
  };

  const handleReorderAll = () => {
    defaultRepeatItems.forEach((item) => {
      addToCart({
        productUnitId: `unit-${item.id}`,
        productId: item.id,
        name: item.name,
        unitName: item.unitName,
        unitCode: item.unitCode,
        price: item.price,
        imageUrl: item.imageUrl,
        slug: item.slug,
      });
    });
    showToast("Semua 4 barang langganan berhasil dimasukkan ke keranjang!");
  };

  return (
    <section className="py-8 bg-saudara-cream-100/70 border-y border-saudara-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-saudara-orange-100 text-saudara-orange-700 rounded-full text-xs font-bold mb-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Belanja Langganan Cepat
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-saudara-green-900 tracking-tight">
              {user ? `Belanja Lagi, ${user.name.split(" ")[0]}?` : "Belanja Ulang Kebutuhan Dapur"}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
              Bahan masakan yang paling sering Anda beli untuk dapur keluarga.
            </p>
          </div>

          <button
            onClick={handleReorderAll}
            className="market-btn-outline text-xs py-2 px-3.5 font-bold flex items-center gap-1.5 bg-white hover:bg-saudara-green-50 shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-saudara-orange-600" />
            + Masukkan Semua ke Keranjang
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {defaultRepeatItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3 border border-saudara-cream-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-14 h-14 object-cover rounded-xl border border-saudara-cream-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 block truncate">{item.lastPurchased}</span>
                  <Link href={`/produk/${item.slug}`}>
                    <h4 className="text-xs font-bold text-gray-900 truncate hover:text-saudara-green-700">
                      {item.name}
                    </h4>
                  </Link>
                  <p className="text-[11px] text-gray-500">{item.unitName}</p>
                  <p className="text-xs font-extrabold text-saudara-green-800 mt-0.5">
                    {formatRupiah(item.price)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleReorder(item)}
                className="mt-3 w-full py-1.5 px-2 bg-saudara-green-50 hover:bg-saudara-green-700 text-saudara-green-800 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border border-saudara-green-200 hover:border-saudara-green-700"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Beli Lagi</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
