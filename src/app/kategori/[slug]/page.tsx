import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getCategories, getProducts } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, ArrowLeft, Filter, Search } from "lucide-react";

interface KategoriSlugProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; q?: string }>;
}

export const revalidate = 60;

export default async function KategoriSlugPage({ params, searchParams }: KategoriSlugProps) {
  const { slug } = await params;
  const { sort, q } = await searchParams;

  const category = await getCategoryBySlug(slug);
  if (!category) {
    notFound();
  }

  const allCategories = await getCategories();
  const products = await getProducts({
    categorySlug: slug,
    query: q,
    sort: sort as any,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
        <Link href="/" className="hover:text-saudara-green-800 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <Link href="/kategori" className="hover:text-saudara-green-800 transition-colors">
          Kategori
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-saudara-green-900 font-bold">{category.name}</span>
      </nav>

      {/* Category Banner */}
      <div className="bg-saudara-green-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-saudara-orange-300">
            Katalog Pasar Saudara
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            {category.name}
          </h1>
          <p className="text-xs sm:text-sm text-saudara-cream-100/90 mt-1 max-w-xl">
            Pilihan komoditas terbaik di kelompok {category.name.toLowerCase()}, disortir langsung oleh tim pasar untuk menjamin kepuasan belanja Anda.
          </p>
        </div>

        <Link
          href="/kategori"
          className="market-btn-outline border-white/30 text-white hover:bg-white/10 text-xs py-2 px-3 shrink-0 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kategori Lainnya
        </Link>
      </div>

      {/* Category Chips Bar for Quick Switch */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <Link
          href="/kategori"
          className="text-xs font-semibold px-3.5 py-1.5 rounded-full border border-saudara-cream-200 bg-white hover:bg-saudara-cream-50 text-gray-700 shrink-0"
        >
          Semua
        </Link>
        {allCategories.map((cat) => {
          const isActive = cat.slug === slug;
          return (
            <Link
              key={cat.id}
              href={`/kategori/${cat.slug}`}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border shrink-0 transition-colors ${
                isActive
                  ? "bg-saudara-green-800 text-white border-saudara-green-800"
                  : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
              }`}
            >
              {cat.name}
            </Link>
          );
        })}
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="bg-white rounded-2xl p-4 border border-saudara-cream-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-2xs">
        {/* Search inside category */}
        <form method="GET" action={`/kategori/${slug}`} className="relative flex-1 max-w-md">
          <input
            type="text"
            name="q"
            defaultValue={q || ""}
            placeholder={`Cari di ${category.name}...`}
            className="w-full pl-9 pr-14 py-2 bg-saudara-cream-50 border border-saudara-cream-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-saudara-green-700"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <button
            type="submit"
            className="absolute right-1.5 top-1 px-2.5 py-1 bg-saudara-green-700 text-white text-xs font-semibold rounded-lg"
          >
            Cari
          </button>
        </form>

        {/* Sort Links */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <span className="text-gray-500 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Urutan:
          </span>
          <Link
            href={`/kategori/${slug}?${q ? `q=${q}&` : ""}sort=newest`}
            className={`px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
              sort === "newest"
                ? "bg-saudara-green-800 text-white border-saudara-green-800"
                : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
            }`}
          >
            Terbaru
          </Link>
          <Link
            href={`/kategori/${slug}?${q ? `q=${q}&` : ""}sort=price_asc`}
            className={`px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
              sort === "price_asc"
                ? "bg-saudara-green-800 text-white border-saudara-green-800"
                : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
            }`}
          >
            Termurah
          </Link>
          <Link
            href={`/kategori/${slug}?${q ? `q=${q}&` : ""}sort=price_desc`}
            className={`px-3 py-1.5 rounded-lg border shrink-0 transition-colors ${
              sort === "price_desc"
                ? "bg-saudara-green-800 text-white border-saudara-green-800"
                : "bg-white text-gray-700 border-saudara-cream-200 hover:bg-saudara-cream-50"
            }`}
          >
            Termahal
          </Link>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-saudara-cream-200 space-y-3">
          <p className="text-base font-bold text-gray-700">
            Tidak ada produk untuk pencarian &quot;{q}&quot; di kategori ini
          </p>
          <p className="text-xs text-gray-400">
            Silakan reset pencarian atau periksa kategori pasar lainnya.
          </p>
          <Link
            href={`/kategori/${slug}`}
            className="market-btn-primary inline-flex text-xs py-2 px-4 mt-2"
          >
            Lihat Semua Produk {category.name}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </div>
  );
}
