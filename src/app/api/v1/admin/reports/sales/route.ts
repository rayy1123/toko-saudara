import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const now = new Date();
    const startDate = startDateParam
      ? new Date(startDateParam)
      : new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const endDate = endDateParam ? new Date(endDateParam) : now;

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        orderStatus: { notIn: ["CANCELLED"] },
      },
      select: {
        id: true,
        grandTotal: true,
        subtotal: true,
        shippingFee: true,
        discountTotal: true,
        paymentStatus: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const dateMap = new Map<string, { date: string; revenue: number; orderCount: number }>();

    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalShipping = 0;

    for (const o of orders) {
      const dateKey = o.createdAt.toISOString().split("T")[0];
      const rev = o.grandTotal || 0;
      totalRevenue += rev;
      totalDiscount += o.discountTotal || 0;
      totalShipping += o.shippingFee || 0;

      const current = dateMap.get(dateKey) || { date: dateKey, revenue: 0, orderCount: 0 };
      current.revenue += rev;
      current.orderCount += 1;
      dateMap.set(dateKey, current);
    }

    const salesByDate = Array.from(dateMap.values());
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return apiSuccess({
      period: {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      },
      summary: {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalDiscount,
        totalShipping,
      },
      salesByDate,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal membuat laporan penjualan", 500);
  }
}
