"use client";

import React from "react";
import Link from "next/link";
import { TrendingDown, TrendingUp, Minus, Tag, Clock, ArrowRight } from "lucide-react";

interface PriceItem {
  name: string;
  marketPrice: string;
  trend: "down" | "up" | "stable";
  trendText: string;
  note: string;
  categorySlug: string;
}

const priceItems: PriceItem[] = [
  {
    name: "Cabai Merah Keriting",
    marketPrice: "Rp 44.000 / kg",
    trend: "down",
    trendText: "-Rp 2.000 (Stabil)",
    note: "Panen Garut melimpah",
    categorySlug: "bumbu-dapur",
  },
  {
    name: "Bawang Merah Brebes",
    marketPrice: "Rp 34.000 / kg",
    trend: "up",
    trendText: "+Rp 1.000 (Pasar Pagi)",
    note: "Kering gantung super",
    categorySlug: "bumbu-dapur",
  },
  {
    name: "Telur Ayam Negeri",
    marketPrice: "Rp 28.500 / kg",
    trend: "stable",
    trendText: "Harga Tetap",
    note: "Stok peternak aman",
    categorySlug: "telur-tahu-tempe",
  },
  {
    name: "Bayam Hijau Segar",
    marketPrice: "Rp 3.500 / ikat",
    trend: "stable",
    trendText: "Segar Subuh",
    note: "Petik Ciwidey",
    categorySlug: "sayur-segar",
  },
  {
    name: "Beras Pandan Wangi",
    marketPrice: "Rp 78.000 / 5kg",
    trend: "stable",
    trendText: "Harga HET Pasar",
    note: "Pulen alami Cianjur",
    categorySlug: "beras-sembako",
  },
];

export function HomePriceTicker() {
  return (
    <section id="harga-hari-ini" className="py-8 bg-white border-b border-saudara-cream-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Title & Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-saudara-orange-100 text-saudara-orange-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Harga Pasar Hari Ini
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-saudara-green-100 text-saudara-green-800">
                  Live Update
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-saudara-orange-500" />
                Pantauan harga komoditas pangan langsung dari pasar subuh hari ini.
              </p>
            </div>
          </div>

          <Link
            href="/kategori"
            className="text-xs font-bold text-saudara-green-800 hover:text-saudara-green-900 flex items-center gap-1"
          >
            Lihat Semua Komoditas <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Highlight Grid Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {priceItems.map((item, idx) => (
            <Link
              key={idx}
              href={`/kategori/${item.categorySlug}`}
              className="group p-3.5 rounded-2xl bg-saudara-cream-50 hover:bg-saudara-cream-100/90 border border-saudara-cream-200 transition-all hover:border-saudara-green-600/40 hover:shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 truncate">
                    {item.note}
                  </span>
                  {item.trend === "down" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-saudara-green-700 bg-saudara-green-100/80 px-1.5 py-0.5 rounded-full">
                      <TrendingDown className="w-2.5 h-2.5" /> Turun
                    </span>
                  )}
                  {item.trend === "up" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-saudara-orange-700 bg-saudara-orange-100/80 px-1.5 py-0.5 rounded-full">
                      <TrendingUp className="w-2.5 h-2.5" /> Naik
                    </span>
                  )}
                  {item.trend === "stable" && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-600 bg-gray-200/80 px-1.5 py-0.5 rounded-full">
                      <Minus className="w-2.5 h-2.5" /> Stabil
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-bold text-gray-900 group-hover:text-saudara-green-800 line-clamp-1">
                  {item.name}
                </h3>
              </div>

              <div className="mt-3 pt-2 border-t border-saudara-cream-200/70">
                <p className="text-sm font-black text-saudara-green-800 tracking-tight">
                  {item.marketPrice}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.trendText}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
