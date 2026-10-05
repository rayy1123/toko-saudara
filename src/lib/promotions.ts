import prisma from "@/lib/db";

export interface PromotionItemRecord {
  id: string;
  promotionId: string;
  productUnitId: string;
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  productName?: string;
  unitName?: string;
  normalPrice?: number;
  promoPrice?: number;
}

export interface PromotionWithItems {
  id: string;
  name: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  scope: "ALL" | "SPECIFIC_ITEMS";
  items: PromotionItemRecord[];
}

let isInitialized = false;

/**
 * Ensure PromotionItem table and scope column on Promotion exist in SQLite database.
 */
export async function ensurePromotionTables() {
  if (isInitialized) return;

  try {
    // 1. Create PromotionItem table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PromotionItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "promotionId" TEXT NOT NULL,
        "productUnitId" TEXT NOT NULL,
        "discountType" TEXT NOT NULL DEFAULT 'FIXED',
        "discountValue" REAL NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Add scope column to Promotion table if not exists
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Promotion" ADD COLUMN "scope" TEXT DEFAULT 'ALL';`);
    } catch {}

    isInitialized = true;
  } catch (err) {
    console.error("Failed to ensure promotion tables:", err);
  }
}

/**
 * Get all promotions with their assigned specific items
 */
export async function getPromotionsList(): Promise<PromotionWithItems[]> {
  await ensurePromotionTables();

  const promos = await prisma.promotion.findMany({
    orderBy: { startsAt: "desc" },
  });

  const result: PromotionWithItems[] = [];

  for (const p of promos) {
    let scope: "ALL" | "SPECIFIC_ITEMS" = "ALL";
    try {
      const row = (await prisma.$queryRawUnsafe(
        `SELECT "scope" FROM "Promotion" WHERE "id" = ?`,
        p.id
      )) as any[];
      if (row && row[0]?.scope) {
        scope = row[0].scope;
      }
    } catch {}

    const itemsRows = (await prisma.$queryRawUnsafe(
      `SELECT pi.*, pu.price as normalPrice, pu.unitName, prod.name as productName
       FROM "PromotionItem" pi
       JOIN "ProductUnit" pu ON pi.productUnitId = pu.id
       JOIN "Product" prod ON pu.productId = prod.id
       WHERE pi.promotionId = ?`,
      p.id
    )) as any[];

    const items: PromotionItemRecord[] = itemsRows.map((it) => {
      const normalPrice = Number(it.normalPrice) || 0;
      const discountType = (it.discountType as "FIXED" | "PERCENTAGE") || "FIXED";
      const discountValue = Number(it.discountValue) || 0;
      const discountPerUnit =
        discountType === "PERCENTAGE"
          ? (normalPrice * discountValue) / 100
          : Math.min(normalPrice, discountValue);
      const promoPrice = Math.max(0, normalPrice - discountPerUnit);

      return {
        id: it.id,
        promotionId: it.promotionId,
        productUnitId: it.productUnitId,
        discountType,
        discountValue,
        productName: it.productName,
        unitName: it.unitName,
        normalPrice,
        promoPrice,
      };
    });

    if (items.length > 0 && scope === "ALL") {
      scope = "SPECIFIC_ITEMS";
    }

    result.push({
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type as "PERCENTAGE" | "FIXED",
      value: p.value,
      minOrderAmount: p.minOrderAmount,
      maxDiscount: p.maxDiscount,
      startsAt: p.startsAt.toISOString(),
      endsAt: p.endsAt ? p.endsAt.toISOString() : null,
      isActive: p.isActive,
      scope,
      items,
    });
  }

  return result;
}

/**
 * Get single promotion by code with items
 */
export async function getPromotionWithItemsByCode(code: string): Promise<PromotionWithItems | null> {
  await ensurePromotionTables();

  const cleanCode = code.trim().toUpperCase();
  const promo = await prisma.promotion.findFirst({
    where: {
      code: cleanCode,
      isActive: true,
    },
  });

  if (!promo) return null;

  let scope: "ALL" | "SPECIFIC_ITEMS" = "ALL";
  try {
    const row = (await prisma.$queryRawUnsafe(
      `SELECT "scope" FROM "Promotion" WHERE "id" = ?`,
      promo.id
    )) as any[];
    if (row && row[0]?.scope) {
      scope = row[0].scope;
    }
  } catch {}

  const itemsRows = (await prisma.$queryRawUnsafe(
    `SELECT pi.*, pu.price as normalPrice, pu.unitName, prod.name as productName
     FROM "PromotionItem" pi
     JOIN "ProductUnit" pu ON pi.productUnitId = pu.id
     JOIN "Product" prod ON pu.productId = prod.id
     WHERE pi.promotionId = ?`,
    promo.id
  )) as any[];

  const items: PromotionItemRecord[] = itemsRows.map((it) => {
    const normalPrice = Number(it.normalPrice) || 0;
    const discountType = (it.discountType as "FIXED" | "PERCENTAGE") || "FIXED";
    const discountValue = Number(it.discountValue) || 0;
    const discountPerUnit =
      discountType === "PERCENTAGE"
        ? (normalPrice * discountValue) / 100
        : Math.min(normalPrice, discountValue);
    const promoPrice = Math.max(0, normalPrice - discountPerUnit);

    return {
      id: it.id,
      promotionId: it.promotionId,
      productUnitId: it.productUnitId,
      discountType,
      discountValue,
      productName: it.productName,
      unitName: it.unitName,
      normalPrice,
      promoPrice,
    };
  });

  if (items.length > 0) {
    scope = "SPECIFIC_ITEMS";
  }

  return {
    id: promo.id,
    name: promo.name,
    code: promo.code,
    type: promo.type as "PERCENTAGE" | "FIXED",
    value: promo.value,
    minOrderAmount: promo.minOrderAmount,
    maxDiscount: promo.maxDiscount,
    startsAt: promo.startsAt.toISOString(),
    endsAt: promo.endsAt ? promo.endsAt.toISOString() : null,
    isActive: promo.isActive,
    scope,
    items,
  };
}

/**
 * Calculate promotion discount specifically for given cart items
 */
export function calculateItemSpecificDiscount(
  promo: PromotionWithItems,
  cartItems: Array<{
    productUnitId: string;
    unitPrice: number;
    quantity: number;
    productName?: string;
    unitName?: string;
  }>,
  subtotal: number
): {
  eligible: boolean;
  message?: string;
  discountTotal: number;
  itemBreakdowns: Array<{
    productUnitId: string;
    productName: string;
    unitName: string;
    discountPerUnit: number;
    quantity: number;
    subtotalDiscount: number;
  }>;
} {
  const now = new Date();
  const startsAt = new Date(promo.startsAt);
  const endsAt = promo.endsAt ? new Date(promo.endsAt) : null;

  if (startsAt > now || (endsAt && endsAt < now)) {
    return {
      eligible: false,
      message: `Kode promo "${promo.code}" sudah kedaluwarsa atau belum berlaku`,
      discountTotal: 0,
      itemBreakdowns: [],
    };
  }

  if (subtotal < promo.minOrderAmount) {
    return {
      eligible: false,
      message: `Minimal belanja Rp ${promo.minOrderAmount.toLocaleString(
        "id-ID"
      )} untuk menggunakan voucher ${promo.code}`,
      discountTotal: 0,
      itemBreakdowns: [],
    };
  }

  // 1. If promo is targeted to SPECIFIC ITEMS (or has items defined)
  if (promo.scope === "SPECIFIC_ITEMS" || (promo.items && promo.items.length > 0)) {
    const promoItemMap = new Map<string, PromotionItemRecord>();
    for (const it of promo.items) {
      promoItemMap.set(it.productUnitId, it);
    }

    let discountTotal = 0;
    const itemBreakdowns: any[] = [];

    for (const cartItem of cartItems) {
      const match = promoItemMap.get(cartItem.productUnitId);
      if (match) {
        let discountPerUnit = 0;
        if (match.discountType === "PERCENTAGE") {
          discountPerUnit = (cartItem.unitPrice * match.discountValue) / 100;
        } else {
          discountPerUnit = Math.min(cartItem.unitPrice, match.discountValue);
        }

        const subtotalDiscount = discountPerUnit * cartItem.quantity;
        discountTotal += subtotalDiscount;

        itemBreakdowns.push({
          productUnitId: cartItem.productUnitId,
          productName: cartItem.productName || match.productName || "Produk",
          unitName: cartItem.unitName || match.unitName || "Unit",
          discountPerUnit,
          quantity: cartItem.quantity,
          subtotalDiscount,
        });
      }
    }

    if (itemBreakdowns.length === 0) {
      const targetNames = promo.items.map((i) => i.productName).filter(Boolean).join(", ");
      return {
        eligible: false,
        message: `Voucher "${promo.code}" hanya berlaku untuk barang tertentu: ${targetNames || "produk pilihan admin"}. Masukkan barang tersebut ke keranjang untuk dapat potongan.`,
        discountTotal: 0,
        itemBreakdowns: [],
      };
    }

    if (promo.maxDiscount && promo.maxDiscount > 0) {
      discountTotal = Math.min(discountTotal, promo.maxDiscount);
    }

    return {
      eligible: true,
      discountTotal,
      itemBreakdowns,
    };
  }

  // 2. Global promo on all items
  let discountTotal = 0;
  if (promo.type === "PERCENTAGE") {
    discountTotal = (subtotal * promo.value) / 100;
    if (promo.maxDiscount && promo.maxDiscount > 0) {
      discountTotal = Math.min(discountTotal, promo.maxDiscount);
    }
  } else {
    discountTotal = Math.min(promo.value, subtotal);
  }

  return {
    eligible: true,
    discountTotal,
    itemBreakdowns: [],
  };
}
