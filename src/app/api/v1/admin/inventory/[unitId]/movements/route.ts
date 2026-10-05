import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ unitId: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { unitId } = await context.params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const unit = await prisma.productUnit.findUnique({
      where: { id: unitId },
      include: { product: true },
    });

    if (!unit) {
      return apiError("UNIT_NOT_FOUND", "Unit produk tidak ditemukan", 404);
    }

    const [total, movements] = await Promise.all([
      prisma.inventoryMovement.count({
        where: { productUnitId: unitId },
      }),
      prisma.inventoryMovement.findMany({
        where: { productUnitId: unitId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return apiSuccess(
      {
        unit: {
          id: unit.id,
          productName: unit.product.name,
          sku: unit.product.sku,
          unitName: unit.unitName,
          stockQuantity: unit.stockQuantity,
        },
        movements,
      },
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat riwayat mutasi stok", 500);
  }
}
