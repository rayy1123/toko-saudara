import prisma from "@/lib/db";
import { CalculatedItem } from "@/lib/pricing";
import { Prisma } from "@prisma/client";

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "PROCESSING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function isValidTransition(
  currentStatus: string,
  targetStatus: string
): boolean {
  const allowed = ALLOWED_TRANSITIONS[currentStatus as OrderStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus as OrderStatus);
}

export function validateOrderTransition(
  currentStatus: string,
  targetStatus: string
): void {
  if (!isValidTransition(currentStatus, targetStatus)) {
    throw new Error(
      `Perubahan status pesanan tidak valid: dari "${currentStatus}" ke "${targetStatus}"`
    );
  }
}

export function createOrderItemSnapshots(items: CalculatedItem[]) {
  return items.map((item) => ({
    productId: item.productId,
    productUnitId: item.productUnitId,
    productNameSnapshot: item.productName,
    unitNameSnapshot: item.unitName,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
  }));
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function generateOrderNumber(db: DbClient = prisma): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const prefix = `ORD-${dateStr}-`;
  const countToday = await db.order.count({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
  });

  const nextSeq = String(countToday + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}
