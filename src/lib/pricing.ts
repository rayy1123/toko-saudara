import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

export interface PricingItemInput {
  productUnitId: string;
  quantity: number;
}

export interface CalculatedItem {
  productUnitId: string;
  productId: string;
  productName: string;
  unitName: string;
  unitCode: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  stockQuantity: number;
}

export interface CalculationResult {
  items: CalculatedItem[];
  subtotal: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  promotion: {
    id: string;
    code: string;
    name: string;
    discount: number;
    itemBreakdowns?: Array<{
      productUnitId: string;
      productName: string;
      unitName: string;
      discountPerUnit: number;
      quantity: number;
      subtotalDiscount: number;
    }>;
  } | null;
  deliveryArea: {
    id: string;
    name: string;
    shippingFee: number;
  } | null;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

export async function calculateOrderTotals(
  itemsInput: PricingItemInput[],
  promoCode?: string | null,
  deliveryAreaId?: string | null,
  db: DbClient = prisma
): Promise<CalculationResult> {
  if (!itemsInput || itemsInput.length === 0) {
    throw new Error("Daftar item belanja tidak boleh kosong");
  }

  // 1. Fetch all product units with product details
  const unitIds = itemsInput.map((i) => i.productUnitId);
  const units = await db.productUnit.findMany({
    where: {
      id: { in: unitIds },
    },
    include: {
      product: true,
    },
  });

  const unitMap = new Map(units.map((u) => [u.id, u]));

  const calculatedItems: CalculatedItem[] = [];
  let subtotal = 0;

  for (const item of itemsInput) {
    if (item.quantity <= 0) {
      throw new Error(`Kuantitas item harus lebih besar dari 0`);
    }

    const unit = unitMap.get(item.productUnitId);
    if (!unit) {
      throw new Error(`Unit produk dengan ID ${item.productUnitId} tidak ditemukan`);
    }
    if (!unit.isActive || !unit.product.isActive) {
      throw new Error(`Produk "${unit.product.name}" (${unit.unitName}) sedang tidak aktif`);
    }

    const itemSubtotal = unit.price * item.quantity;
    subtotal += itemSubtotal;

    calculatedItems.push({
      productUnitId: unit.id,
      productId: unit.product.id,
      productName: unit.product.name,
      unitName: unit.unitName,
      unitCode: unit.unitCode,
      unitPrice: unit.price,
      quantity: item.quantity,
      subtotal: itemSubtotal,
      stockQuantity: unit.stockQuantity,
    });
  }

  // 2. Validate and calculate promotion discount
  let discountTotal = 0;
  let promotionResult: CalculationResult["promotion"] = null;

  if (promoCode && promoCode.trim() !== "") {
    const cleanCode = promoCode.trim().toUpperCase();
    const now = new Date();

    const promo = await db.promotion.findFirst({
      where: {
        code: cleanCode,
        isActive: true,
      },
    });

    if (promo) {
      const isValidDate =
        promo.startsAt <= now && (!promo.endsAt || promo.endsAt >= now);

      if (isValidDate && subtotal >= promo.minOrderAmount) {
        // Check if promo has specific items configured in PromotionItem table
        let specificItems: any[] = [];
        try {
          specificItems = await (db as any).$queryRawUnsafe(
            `SELECT * FROM "PromotionItem" WHERE "promotionId" = ?`,
            promo.id
          );
        } catch {}

        if (specificItems && specificItems.length > 0) {
          const itemMap = new Map(specificItems.map((s: any) => [s.productUnitId, s]));
          let totalItemDiscount = 0;
          const breakdowns: any[] = [];

          for (const calcItem of calculatedItems) {
            const rule = itemMap.get(calcItem.productUnitId);
            if (rule) {
              const dType = rule.discountType || "FIXED";
              const dVal = Number(rule.discountValue) || 0;
              const perUnit =
                dType === "PERCENTAGE"
                  ? (calcItem.unitPrice * dVal) / 100
                  : Math.min(calcItem.unitPrice, dVal);

              const subDiscount = perUnit * calcItem.quantity;
              totalItemDiscount += subDiscount;

              breakdowns.push({
                productUnitId: calcItem.productUnitId,
                productName: calcItem.productName,
                unitName: calcItem.unitName,
                discountPerUnit: perUnit,
                quantity: calcItem.quantity,
                subtotalDiscount: subDiscount,
              });
            }
          }

          if (promo.maxDiscount && promo.maxDiscount > 0) {
            totalItemDiscount = Math.min(totalItemDiscount, promo.maxDiscount);
          }

          discountTotal = totalItemDiscount;

          if (discountTotal > 0) {
            promotionResult = {
              id: promo.id,
              code: promo.code,
              name: promo.name,
              discount: discountTotal,
              itemBreakdowns: breakdowns,
            };
          }
        } else {
          if (promo.type === "PERCENTAGE") {
            let calculatedDiscount = (subtotal * promo.value) / 100;
            if (promo.maxDiscount && promo.maxDiscount > 0) {
              calculatedDiscount = Math.min(calculatedDiscount, promo.maxDiscount);
            }
            discountTotal = calculatedDiscount;
          } else if (promo.type === "FIXED") {
            discountTotal = Math.min(promo.value, subtotal);
          }

          promotionResult = {
            id: promo.id,
            code: promo.code,
            name: promo.name,
            discount: discountTotal,
          };
        }
      }
    }
  }

  // 3. Calculate shipping fee
  let shippingFee = 0;
  let deliveryAreaResult: CalculationResult["deliveryArea"] = null;

  if (deliveryAreaId) {
    const area = await db.deliveryArea.findUnique({
      where: { id: deliveryAreaId },
    });

    if (area && area.isActive) {
      shippingFee = area.shippingFee;
      deliveryAreaResult = {
        id: area.id,
        name: area.name,
        shippingFee: area.shippingFee,
      };
    }
  }

  const grandTotal = Math.max(0, subtotal - discountTotal + shippingFee);

  return {
    items: calculatedItems,
    subtotal,
    discountTotal,
    shippingFee,
    grandTotal,
    promotion: promotionResult,
    deliveryArea: deliveryAreaResult,
  };
}
