import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan", 404);
    }

    const {
      unitName,
      unitCode = "pcs",
      quantityValue = 1.0,
      quantityUnit = "pcs",
      price,
      costPrice,
      stockQuantity = 0,
      lowStockThreshold = 5.0,
    } = body;

    const numPrice = Number(price);
    if (!unitName || isNaN(numPrice) || numPrice < 0) {
      return apiError(
        "VALIDATION_ERROR",
        "Nama unit dan harga yang valid wajib diisi",
        400
      );
    }

    const stock = Number(stockQuantity) || 0;

    const newUnit = await prisma.$transaction(async (tx) => {
      const unit = await tx.productUnit.create({
        data: {
          productId: product.id,
          unitName: String(unitName).trim(),
          unitCode: String(unitCode).trim(),
          quantityValue: Number(quantityValue) || 1.0,
          quantityUnit: String(quantityUnit).trim(),
          price: numPrice,
          costPrice: costPrice !== undefined ? Number(costPrice) : null,
          stockQuantity: stock,
          lowStockThreshold: Number(lowStockThreshold) || 5.0,
          isActive: true,
        },
      });

      await tx.priceHistory.create({
        data: {
          productUnitId: unit.id,
          price: numPrice,
          createdBy: auth.user.id,
        },
      });

      if (stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            productUnitId: unit.id,
            type: "PURCHASE",
            quantityDelta: stock,
            referenceType: "INITIAL_UNIT_STOCK",
            note: "Stok awal penambahan unit produk",
            createdBy: auth.user.id,
          },
        });
      }

      return unit;
    });

    return apiSuccess(newUnit, undefined, 201);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menambahkan unit produk", 500);
  }
}
