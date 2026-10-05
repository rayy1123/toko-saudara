import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { recordInventoryMovement, MovementType } from "@/lib/inventory";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { productUnitId, type, quantity, note } = body;

    const allowedTypes: MovementType[] = [
      "PURCHASE",
      "ADJUSTMENT_IN",
      "ADJUSTMENT_OUT",
      "DAMAGE",
      "RETURN",
    ];

    if (!allowedTypes.includes(type as MovementType)) {
      return apiError(
        "INVALID_ADJUSTMENT_TYPE",
        "Tipe penyesuaian harus PURCHASE, ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE, atau RETURN",
        400
      );
    }

    const qty = Number(quantity);
    if (!productUnitId || isNaN(qty) || qty <= 0) {
      return apiError(
        "VALIDATION_ERROR",
        "ID unit produk dan jumlah kuantitas (> 0) wajib diisi",
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const recorded = await recordInventoryMovement(
        {
          productUnitId,
          type: type as MovementType,
          quantity: qty,
          referenceType: "MANUAL_ADJUSTMENT",
          referenceId: null,
          note: note ? String(note).trim() : "Penyesuaian manual oleh admin",
          createdBy: auth.user.id,
        },
        tx
      );

      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "STOCK_ADJUSTMENT",
          resourceType: "PRODUCT_UNIT",
          resourceId: productUnitId,
          metadata: JSON.stringify({
            type,
            quantity: qty,
            previousStock: recorded.previousStock,
            newStock: recorded.newStock,
            note: note || null,
          }),
        },
      });

      return recorded;
    });

    return apiSuccess({
      productUnitId: result.unit.id,
      type,
      quantityDelta: result.movement.quantityDelta,
      previousStock: result.previousStock,
      newStock: result.newStock,
      movementId: result.movement.id,
      note,
    });
  } catch (error: any) {
    return apiError("ADJUSTMENT_FAILED", error.message || "Gagal melakukan penyesuaian stok", 400);
  }
}
