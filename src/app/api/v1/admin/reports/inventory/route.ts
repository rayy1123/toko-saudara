import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const units = await prisma.productUnit.findMany({
      where: { isActive: true },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    let totalStockUnits = 0;
    let totalValuationRetail = 0;
    let totalValuationCost = 0;
    let lowStockCount = 0;

    const categoryMap = new Map<
      string,
      { categoryName: string; totalItems: number; totalStock: number; valuationRetail: number }
    >();

    for (const u of units) {
      totalStockUnits += u.stockQuantity;
      const retailVal = u.stockQuantity * u.price;
      const costVal = u.stockQuantity * (u.costPrice || u.price * 0.7);

      totalValuationRetail += retailVal;
      totalValuationCost += costVal;

      if (u.stockQuantity <= u.lowStockThreshold) {
        lowStockCount += 1;
      }

      const catName = u.product.category.name;
      const catStat = categoryMap.get(catName) || {
        categoryName: catName,
        totalItems: 0,
        totalStock: 0,
        valuationRetail: 0,
      };

      catStat.totalItems += 1;
      catStat.totalStock += u.stockQuantity;
      catStat.valuationRetail += retailVal;
      categoryMap.set(catName, catStat);
    }

    return apiSuccess({
      summary: {
        totalActiveUnits: units.length,
        totalStockQuantity: Math.round(totalStockUnits * 100) / 100,
        totalValuationRetail: Math.round(totalValuationRetail),
        totalValuationCost: Math.round(totalValuationCost),
        potentialGrossProfit: Math.round(totalValuationRetail - totalValuationCost),
        lowStockCount,
      },
      categoryBreakdown: Array.from(categoryMap.values()),
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat laporan inventaris", 500);
  }
}
