import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          orderStatus: { notIn: ["CANCELLED"] },
        },
      },
      include: {
        order: {
          select: { orderStatus: true, createdAt: true },
        },
      },
    });

    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        totalQuantitySold: number;
        totalRevenue: number;
        orderCount: number;
      }
    >();

    for (const item of orderItems) {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productNameSnapshot,
        totalQuantitySold: 0,
        totalRevenue: 0,
        orderCount: 0,
      };

      existing.totalQuantitySold += item.quantity;
      existing.totalRevenue += item.subtotal;
      existing.orderCount += 1;

      productMap.set(item.productId, existing);
    }

    const sorted = Array.from(productMap.values())
      .sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
      .slice(0, limit);

    return apiSuccess({
      totalProductsWithSales: productMap.size,
      topProducts: sorted,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat laporan produk terlaris", 500);
  }
}
