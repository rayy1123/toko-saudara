import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ unitId: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { unitId } = await context.params;
    const body = await req.json();

    const unit = await prisma.productUnit.findUnique({
      where: { id: unitId },
      include: { product: true },
    });

    if (!unit) {
      return apiError("UNIT_NOT_FOUND", "Unit produk tidak ditemukan", 404);
    }

    const {
      unitName,
      unitCode,
      quantityValue,
      quantityUnit,
      price,
      costPrice,
      stockQuantity,
      lowStockThreshold,
      isActive,
    } = body;

    const updatedUnit = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (unitName !== undefined) updateData.unitName = String(unitName).trim();
      if (unitCode !== undefined) updateData.unitCode = String(unitCode).trim();
      if (quantityValue !== undefined) updateData.quantityValue = Number(quantityValue);
      if (quantityUnit !== undefined) updateData.quantityUnit = String(quantityUnit).trim();
      if (costPrice !== undefined) updateData.costPrice = costPrice !== null ? Number(costPrice) : null;
      if (lowStockThreshold !== undefined) updateData.lowStockThreshold = Number(lowStockThreshold);
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      // Handle price change
      if (price !== undefined) {
        const newPrice = Number(price);
        if (newPrice !== unit.price) {
          updateData.price = newPrice;
          await tx.priceHistory.create({
            data: {
              productUnitId: unit.id,
              price: newPrice,
              createdBy: auth.user.id,
            },
          });

          // Log to AuditEvent for owner monitoring
          await tx.auditEvent.create({
            data: {
              actorUserId: auth.user.id,
              action: "PRICE_CHANGE",
              resourceType: "PRODUCT_UNIT",
              resourceId: unit.id,
              metadata: JSON.stringify({
                productName: unit.product.name,
                unitName: unit.unitName,
                previousPrice: unit.price,
                newPrice,
                actorRole: auth.user.role,
                actorEmail: auth.user.email,
                actorName: auth.user.profile?.name || auth.user.email,
              }),
            },
          });
        }
      }

      // Handle direct stock update with movement ledger
      if (stockQuantity !== undefined) {
        const newStock = Number(stockQuantity);
        if (newStock < 0) {
          throw new Error("Stok tidak boleh bernilai negatif");
        }
        const delta = newStock - unit.stockQuantity;
        if (delta !== 0) {
          updateData.stockQuantity = newStock;
          await tx.inventoryMovement.create({
            data: {
              productUnitId: unit.id,
              type: delta > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
              quantityDelta: delta,
              referenceType: "DIRECT_STOCK_UPDATE",
              note: `Penyesuaian stok langsung dari ${unit.stockQuantity} menjadi ${newStock} (${auth.user.role})`,
              createdBy: auth.user.id,
            },
          });

          // Log to AuditEvent for owner monitoring
          await tx.auditEvent.create({
            data: {
              actorUserId: auth.user.id,
              action: "STOCK_ADJUSTMENT",
              resourceType: "PRODUCT_UNIT",
              resourceId: unit.id,
              metadata: JSON.stringify({
                productName: unit.product.name,
                unitName: unit.unitName,
                previousStock: unit.stockQuantity,
                newStock,
                delta,
                actorRole: auth.user.role,
                actorEmail: auth.user.email,
                actorName: auth.user.profile?.name || auth.user.email,
              }),
            },
          });
        }
      }

      return tx.productUnit.update({
        where: { id: unitId },
        data: updateData,
      });
    });

    return apiSuccess(updatedUnit);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui unit produk", 500);
  }
}
