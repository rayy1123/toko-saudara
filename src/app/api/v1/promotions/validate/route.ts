import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/response";
import {
  getPromotionWithItemsByCode,
  calculateItemSpecificDiscount,
  ensurePromotionTables,
} from "@/lib/promotions";

export async function GET(req: NextRequest) {
  try {
    await ensurePromotionTables();

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const subtotal = Number(searchParams.get("subtotal")) || 0;
    const itemsRaw = searchParams.get("items");

    if (!code || code.trim() === "") {
      return apiError("VALIDATION_ERROR", "Kode promo wajib diisi", 400);
    }

    const promo = await getPromotionWithItemsByCode(code);
    if (!promo) {
      return apiError("PROMO_NOT_FOUND", `Kode promo "${code.toUpperCase()}" tidak ditemukan atau sudah tidak aktif`, 404);
    }

    let parsedItems: any[] = [];
    if (itemsRaw) {
      try {
        parsedItems = JSON.parse(itemsRaw);
      } catch {}
    }

    const calc = calculateItemSpecificDiscount(promo, parsedItems, subtotal);
    if (!calc.eligible) {
      return apiError("PROMO_NOT_ELIGIBLE", calc.message || "Syarat promo tidak terpenuhi", 400);
    }

    return apiSuccess({
      id: promo.id,
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: promo.value,
      scope: promo.scope,
      discount: calc.discountTotal,
      minOrderAmount: promo.minOrderAmount,
      maxDiscount: promo.maxDiscount,
      itemBreakdowns: calc.itemBreakdowns,
    });
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Gagal memvalidasi kode promo", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensurePromotionTables();

    const body = await req.json();
    const { code, subtotal = 0, items = [] } = body;

    if (!code || String(code).trim() === "") {
      return apiError("VALIDATION_ERROR", "Kode promo wajib diisi", 400);
    }

    const promo = await getPromotionWithItemsByCode(String(code));
    if (!promo) {
      return apiError("PROMO_NOT_FOUND", `Kode promo "${String(code).toUpperCase()}" tidak ditemukan atau sudah tidak aktif`, 404);
    }

    const calc = calculateItemSpecificDiscount(promo, items, Number(subtotal) || 0);
    if (!calc.eligible) {
      return apiError("PROMO_NOT_ELIGIBLE", calc.message || "Syarat promo tidak terpenuhi", 400);
    }

    return apiSuccess({
      id: promo.id,
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: promo.value,
      scope: promo.scope,
      discount: calc.discountTotal,
      minOrderAmount: promo.minOrderAmount,
      maxDiscount: promo.maxDiscount,
      itemBreakdowns: calc.itemBreakdowns,
    });
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Gagal memvalidasi kode promo", 500);
  }
}
