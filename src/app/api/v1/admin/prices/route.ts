import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { productUnitId, price, note } = body;

    const numPrice = Number(price);
    if (!productUnitId || isNaN(numPrice) || numPrice < 0) {
      return apiError(
        "VALIDATION_ERROR",
        "ID unit produk dan harga valid wajib diisi",
        400
      );
    }

    const unit = await prisma.productUnit.findUnique({
      where: { id: productUnitId },
      include: { product: true },
    });

    if (!unit) {
      return apiError("UNIT_NOT_FOUND", "Unit produk tidak ditemukan", 404);
    }

    const previousPrice = unit.price;

    const result = await prisma.$transaction(async (tx) => {
      const updatedUnit = await tx.productUnit.update({
        where: { id: productUnitId },
        data: { price: numPrice },
      });

      const history = await tx.priceHistory.create({
        data: {
          productUnitId,
          price: numPrice,
          createdBy: auth.user.id,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "PRICE_CHANGE",
          resourceType: "PRODUCT_UNIT",
          resourceId: productUnitId,
          metadata: JSON.stringify({
            productName: unit.product.name,
            unitName: unit.unitName,
            previousPrice,
            newPrice: numPrice,
            note: note || null,
          }),
        },
      });

      return { unit: updatedUnit, history, previousPrice };
    });

    return apiSuccess({
      productUnitId: result.unit.id,
      productName: unit.product.name,
      unitName: unit.unitName,
      previousPrice: result.previousPrice,
      newPrice: result.unit.price,
      historyId: result.history.id,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengubah harga produk", 500);
  }
}
