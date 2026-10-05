import React from "react";
import Link from "next/link";
import {
  getCategories,
  getProducts,
} from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { HomeRepeatOrder } from "@/components/HomeRepeatOrder";
import {
  Sparkles,
  ArrowRight,
  Scale,
  Clock,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 60; // ISR cache 60s

export default async function HomePage() {
  const [categories, allProducts] = await Promise.all([
    getCategories(),
    getProducts({ limit: 12 }),
  ]);

  // Visual icons for categories
  const categoryIconMap: Record<string, { bg: string; text: string; icon: string }> = {
    "sayur-segar": { bg: "bg-emerald-100", text: "text-emerald-800", icon: "🥬" },
    "bumbu-dapur": { bg: "bg-amber-100", text: "text-amber-800", icon: "🌶️" },
    "beras-sembako": { bg: "bg-orange-100", text: "text-orange-800", icon: "🍚" },
    "telur-tahu-tempe": { bg: "bg-yellow-100", text: "text-yellow-800", icon: "🥚" },
    "buah-buahan": { bg: "bg-lime-100", text: "text-lime-800", icon: "🍌" },
    "makanan-kering": { bg: "bg-stone-100", text: "text-stone-800", icon: "🥫" },
  };

  // Filter out any paket-hemat category if exists
  const activeCategories = categories.filter((c) => c.slug !== "paket-hemat");

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-saudara-green-900 via-saudara-green-800 to-saudara-green-900 text-white py-12 md:py-16">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-saudara-green-700/80 border border-saudara-green-600 text-saudara-orange-300 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                Pasar Tradisional Modern Kramat Jati
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Dari Pasar Ke Rumah — Belanja Sayur &amp; Sembako Kualitas Pasar{" "}
                <span className="text-saudara-orange-400">Tanpa Repot Becek</span>
              </h1>

              <p className="text-sm sm:text-base text-saudara-cream-100/90 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Kios Toko Saudara Pasar Kramat Jati Jakarta Timur. Ditimbang jujur, bahan masakan dapur segar pilihan, siap diantar langsung ke rumah Anda.
              </p>

              {/* Call to action buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  href="/kategori"
                  className="market-btn-orange text-sm font-bold py-3 px-6 shadow-lg shadow-saudara-orange-600/30 active:scale-95"
                >
                  Mulai Belanja Sekarang <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white border border-white/20 text-xs font-semibold">
                  <Clock className="w-3.5 h-3.5 text-saudara-orange-400" /> Jam Buka: 15:30 WIB - 06:00 WIB
                </div>
              </div>

              {/* Badges Bar */}
              <div className="pt-4 grid grid-cols-2 gap-3 sm:gap-4 border-t border-saudara-green-700/80 text-left">
                <div className="flex items-center gap-2 text-xs text-saudara-cream-200">
                  <CheckCircle2 className="w-4 h-4 text-saudara-green-400 shrink-0" />
                  <span>Timbangan Pas &amp; Jujur Digital</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-saudara-cream-200">
                  <MapPin className="w-4 h-4 text-saudara-green-400 shrink-0" />
                  <span>Area Kramat Jati Jakarta Timur</span>
                </div>
              </div>
            </div>

            {/* Right Hero Video Card (Tanpa teks animasi & tanpa badge voucher lama) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xs p-3 rounded-3xl border border-white/20 shadow-2xl">
                <div className="relative rounded-2xl overflow-hidden shadow-md bg-saudara-green-950">
                  <video
                    src="/video-toko-saudara.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/logo.png"
                    className="w-full h-64 sm:h-80 object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Quick Category Icons Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Kategori Belanja Pilihan
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Pilih kebutuhan dapur harian Anda sesuai kelompok barang.
            </p>
          </div>
          <Link
            href="/kategori"
            className="text-xs font-bold text-saudara-green-800 hover:text-saudara-green-900 flex items-center gap-1"
          >
            Semua Kategori <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {activeCategories.map((cat) => {
            const visual = categoryIconMap[cat.slug] || {
              bg: "bg-emerald-100",
              text: "text-emerald-800",
              icon: "🛍️",
            };
            return (
              <Link
                key={cat.id}
                href={`/kategori/${cat.slug}`}
                className="group p-3.5 sm:p-4 rounded-2xl bg-white border border-saudara-cream-200 hover:border-saudara-green-600/50 hover:shadow-md transition-all text-center flex flex-col items-center justify-center gap-2"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${visual.bg} ${visual.text} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-2xs`}
                >
                  {visual.icon}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-saudara-green-800 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    {cat._count?.products || 0} produk
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Daftar Produk Belanja */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Katalog Produk Toko Saudara
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Sayur mayur, cabai, bumbu dapur, telur, dan sembako pilihan Pasar Kramat Jati.
            </p>
          </div>

          <Link
            href="/kategori"
            className="text-xs sm:text-sm font-bold text-saudara-green-800 hover:text-saudara-green-900 flex items-center gap-1"
          >
            Lihat Semua Produk <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      </section>

      {/* 4. "Belanja Lagi" (Quick Repeat Order Section) */}
      <HomeRepeatOrder />

      {/* 5. Keunggulan Toko Saudara */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-saudara-green-900 tracking-tight">
            Kenapa Belanja di Toko Saudara?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Kios Toko Saudara Pasar Kramat Jati Jakarta Timur.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-2xl border border-saudara-cream-200 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-saudara-green-100 text-saudara-green-800 flex items-center justify-center text-2xl mb-4">
              <Scale className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">Timbangan Pas &amp; Jujur</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Kami menggunakan timbangan digital tera resmi. Berat pesanan Anda dijamin pas dan jujur.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-saudara-cream-200 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-saudara-orange-100 text-saudara-orange-600 flex items-center justify-center text-2xl mb-4">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-base text-gray-900 mb-2">Pengantaran Saat Jam Operasional</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Layanan buka &amp; pengantaran dilakukan pada jam operasional toko: pk 15:30 WIB s/d 06:00 WIB langsung ke alamat Anda di area Kramat Jati Jakarta Timur.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
