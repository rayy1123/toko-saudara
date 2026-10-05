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
    const productUnitId = searchParams.get("productUnitId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.PriceHistoryWhereInput = {
      ...(productUnitId ? { productUnitId } : {}),
    };

    const [total, histories] = await Promise.all([
      prisma.priceHistory.count({ where }),
      prisma.priceHistory.findMany({
        where,
        include: {
          productUnit: {
            include: {
              product: {
                select: { name: true, sku: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    const formatted = histories.map((h) => ({
      id: h.id,
      productUnitId: h.productUnitId,
      productName: h.productUnit.product.name,
      sku: h.productUnit.product.sku,
      unitName: h.productUnit.unitName,
      price: h.price,
      createdAt: h.createdAt,
      createdBy: h.createdBy,
    }));

    return apiSuccess(formatted, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat riwayat harga", 500);
  }
}
