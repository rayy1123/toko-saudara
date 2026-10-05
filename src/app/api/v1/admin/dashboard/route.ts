import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      todayPaidOrders,
      newOrdersCount,
      processingOrdersCount,
      lowStockUnits,
      recentOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfToday },
          orderStatus: { notIn: ["CANCELLED"] },
          paymentStatus: "PAID",
        },
        select: { grandTotal: true },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startOfToday },
        },
      }),
      prisma.order.count({
        where: {
          orderStatus: { in: ["PROCESSING", "READY_FOR_PICKUP"] },
        },
      }),
      prisma.productUnit.findMany({
        where: {
          isActive: true,
          stockQuantity: { lte: prisma.productUnit.fields.lowStockThreshold },
        },
        include: {
          product: {
            select: { name: true, sku: true },
          },
        },
        take: 10,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              email: true,
              profile: { select: { name: true, phone: true } },
            },
          },
          items: true,
          payment: true,
        },
      }),
    ]);

    const omzetHariIni = todayPaidOrders.reduce(
      (sum, o) => sum + (o.grandTotal || 0),
      0
    );

    return apiSuccess({
      metrics: {
        omzetHariIni,
        orderBaruHariIni: newOrdersCount,
        orderDiproses: processingOrdersCount,
        stokMenipisCount: lowStockUnits.length,
      },
      lowStockAlerts: lowStockUnits.map((u) => ({
        unitId: u.id,
        productName: u.product.name,
        sku: u.product.sku,
        unitName: u.unitName,
        stockQuantity: u.stockQuantity,
        lowStockThreshold: u.lowStockThreshold,
      })),
      recentOrders,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat dasbor admin", 500);
  }
}
