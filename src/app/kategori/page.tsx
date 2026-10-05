import React from "react";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { Search, Layers, Filter } from "lucide-react";

interface KategoriPageProps {
  searchParams: Promise<{ q?: string; sort?: string }>;
}

export const revalidate = 60;

export default async function KategoriIndexPage({ searchParams }: KategoriPageProps) {
  const { q, sort } = await searchParams;
  const allCats = await getCategories();
  const categories = allCats.filter((c) => c.slug !== "paket-hemat");
  const rawProducts = await getProducts({
    query: q,
    sort: sort as any,
  });
  const products = rawProducts.filter((p) => p.category?.slug !== "paket-hemat");

  const categoryEmoji: Record<string, string> = {
    "sayur-segar": "🥬",
    "bumbu-dapur": "🌶️",
    "beras-sembako": "🍚",
    "telur-tahu-tempe": "🥚",
    "buah-buahan": "🍌",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header & Search */}
      <div className="bg-saudara-green-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-saudara-green-800 text-saudara-orange-300 text-xs font-bold mb-3">
            <Layers className="w-3.5 h-3.5" /> Katalog Lengkap Toko Saudara
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Semua Kategori Belanja Pasar
          </h1>
          <p className="text-xs sm:text-sm text-saudara-cream-100/90 mt-2">
            Temukan sayuran hijau segar, bumbu giling & utuh, beras pulen, hingga paket siap masak harian.
          </p>

          {/* Search Bar */}
          <form method="GET" action="/kategori" className="mt-6 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                name="q"
                defaultValue={q || ""}
                placeholder="Cari produk di semua kategori..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-gray-900 rounded-xl text-sm border border-transparent focus:outline-hidden focus:ring-2 focus:ring-saudara-orange-500"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            </div>
            <button
              type="submit"
              className="market-btn-orange text-xs sm:text-sm py-2 px-5 font-bold"
            >
              Cari
            </button>
          </form>
        </div>
      </div>

      {/* Categories Grid Overview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Jelajahi Berdasarkan Kategori
          </h2>
          <span className="text-xs text-gray-500">{categories.length} Kelompok Produk</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className="group p-4 bg-white rounded-2xl border border-saudara-cream-200 hover:border-saudara-green-600/40 hover:shadow-md transition-all text-center flex flex-col items-center justify-between"
            >
              <div className="w-16 h-16 rounded-2xl bg-saudara-cream-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform mb-2">
                {categoryEmoji[cat.slug] || "🛍️"}
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-saudara-green-800 transition-colors">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-gray-500 font-medium">
                  {cat._count?.products || 0} Produk
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product List or Search Results */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-saudara-cream-200">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {q ? `Hasil Pencarian: "${q}"` : "Semua Produk Tersedia"}
            </h2>
            <p className="text-xs text-gray-500">
              Menampilkan {products.length} barang segar kualitas pasar.
            </p>
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Urutkan:
            </span>
            <Link
              href={`/kategori?${q ? `q=${q}&` : ""}sort=newest`}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                sort === "newest"
                  ? "bg-saudara-green-800 text-white border-saudara-green-800"
                  : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
              }`}
            >
              Terbaru
            </Link>
            <Link
              href={`/kategori?${q ? `q=${q}&` : ""}sort=price_asc`}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                sort === "price_asc"
                  ? "bg-saudara-green-800 text-white border-saudara-green-800"
                  : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
              }`}
            >
              Termurah
            </Link>
            <Link
              href={`/kategori?${q ? `q=${q}&` : ""}sort=price_desc`}
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                sort === "price_desc"
                  ? "bg-saudara-green-800 text-white border-saudara-green-800"
                  : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
              }`}
            >
              Termahal
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-saudara-cream-200 space-y-3">
            <Layers className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="font-bold text-gray-800 text-base">Tidak ada produk ditemukan</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Maaf, kata kunci &quot;{q}&quot; tidak cocok dengan produk pasar saat ini. Silakan coba kata kunci lain seperti &quot;cabai&quot;, &quot;bayam&quot;, atau &quot;telur&quot;.
            </p>
            <Link href="/kategori" className="market-btn-primary inline-flex text-xs py-2 px-4 mt-2">
              Reset Pencarian
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product as any} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
