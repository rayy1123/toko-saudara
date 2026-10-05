import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export type MovementType =
  | "PURCHASE"
  | "SALE"
  | "RESERVATION"
  | "RELEASE"
  | "ADJUSTMENT_IN"
  | "ADJUSTMENT_OUT"
  | "DAMAGE"
  | "RETURN";

export interface RecordMovementParams {
  productUnitId: string;
  type: MovementType;
  quantity: number; // Positive quantity amount
  referenceType?: string | null;
  referenceId?: string | null;
  note?: string | null;
  createdBy?: string | null;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function recordInventoryMovement(
  params: RecordMovementParams,
  db: DbClient = prisma
) {
  const { productUnitId, type, quantity, referenceType, referenceId, note, createdBy } =
    params;

  if (quantity <= 0) {
    throw new Error("Kuantitas pergerakan inventaris harus lebih besar dari 0");
  }

  // Determine sign of delta based on movement type
  const isDeduction = [
    "SALE",
    "RESERVATION",
    "ADJUSTMENT_OUT",
    "DAMAGE",
  ].includes(type);

  const delta = isDeduction ? -quantity : quantity;

  // Fetch current unit stock with lock or direct read
  const unit = await db.productUnit.findUnique({
    where: { id: productUnitId },
    include: { product: true },
  });

  if (!unit) {
    throw new Error(`Unit produk dengan ID ${productUnitId} tidak ditemukan`);
  }

  const newStock = unit.stockQuantity + delta;

  // Prevent negative stock
  if (newStock < 0) {
    throw new Error(
      `Stok tidak mencukupi untuk produk "${unit.product.name}" (${unit.unitName}). Stok tersedia: ${unit.stockQuantity}, diminta: ${quantity}`
    );
  }

  // Update stock quantity on product unit
  const updatedUnit = await db.productUnit.update({
    where: { id: productUnitId },
    data: { stockQuantity: newStock },
  });

  // Record movement in audit ledger
  const movement = await db.inventoryMovement.create({
    data: {
      productUnitId,
      type,
      quantityDelta: delta,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      note: note ?? null,
      createdBy: createdBy ?? null,
    },
  });

  return {
    unit: updatedUnit,
    movement,
    previousStock: unit.stockQuantity,
    newStock,
  };
}
