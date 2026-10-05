import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductUnitWhereInput = {
      isActive: true,
      ...(search
        ? {
            product: {
              OR: [
                { name: { contains: search } },
                { sku: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const [totalUnits, units] = await Promise.all([
      prisma.productUnit.count({ where }),
      prisma.productUnit.findMany({
        where,
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ stockQuantity: "asc" }, { unitName: "asc" }],
        skip: lowStockOnly ? 0 : skip,
        take: lowStockOnly ? 500 : limit,
      }),
    ]);

    let result = units.map((u) => ({
      id: u.id,
      productId: u.productId,
      productName: u.product.name,
      sku: u.product.sku,
      categoryName: u.product.category.name,
      unitName: u.unitName,
      unitCode: u.unitCode,
      price: u.price,
      costPrice: u.costPrice,
      stockQuantity: u.stockQuantity,
      lowStockThreshold: u.lowStockThreshold,
      isLowStock: u.stockQuantity <= u.lowStockThreshold,
      valuation: u.stockQuantity * u.price,
    }));

    if (lowStockOnly) {
      result = result.filter((u) => u.isLowStock);
      return apiSuccess(result.slice(skip, skip + limit), {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit),
      });
    }

    return apiSuccess(result, {
      page,
      limit,
      total: totalUnits,
      totalPages: Math.ceil(totalUnits / limit),
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat inventaris", 500);
  }
}
