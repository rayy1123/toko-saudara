import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/data";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { ProductCard } from "@/components/ProductCard";
import { ChevronRight, Sparkles } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 60;

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch related products from the same category
  const related = await getProducts({
    categorySlug: product.category.slug,
    limit: 4,
  });

  const filteredRelated = related.filter((p) => p.id !== product.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12">
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
        <Link
          href={`/kategori/${product.category.slug}`}
          className="hover:text-saudara-green-800 transition-colors"
        >
          {product.category.name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-saudara-green-900 font-bold truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Main Interactive Product Detail Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-saudara-cream-200 shadow-xs">
        <ProductDetailClient product={product as any} />
      </div>

      {/* Related Products Section */}
      {filteredRelated.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1 text-xs font-bold text-saudara-green-700">
                <Sparkles className="w-3.5 h-3.5" /> Rekomendasi Dapur
              </div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight mt-0.5">
                Produk Terkait di Kategori {product.category.name}
              </h2>
            </div>
            <Link
              href={`/kategori/${product.category.slug}`}
              className="text-xs font-bold text-saudara-green-800 hover:text-saudara-green-900"
            >
              Lihat Kategori Ini →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredRelated.map((item) => (
              <ProductCard key={item.id} product={item as any} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
