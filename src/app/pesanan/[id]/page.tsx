import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById } from "@/lib/data";
import { OrderDetailClient } from "@/components/OrderDetailClient";
import { ChevronRight, ArrowLeft } from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Breadcrumb & Back button */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
          <Link href="/" className="hover:text-saudara-green-800">
            Beranda
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <Link href="/pesanan" className="hover:text-saudara-green-800">
            Pesanan Saya
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-saudara-green-900 font-bold truncate max-w-[150px]">
            {order.orderNumber}
          </span>
        </nav>

        <Link
          href="/pesanan"
          className="text-xs text-saudara-green-800 hover:text-saudara-green-900 font-bold flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar
        </Link>
      </div>

      <OrderDetailClient order={order as any} />
    </div>
  );
}
