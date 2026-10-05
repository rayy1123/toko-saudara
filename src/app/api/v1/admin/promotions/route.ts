import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";
import {
  ensurePromotionTables,
  getPromotionsList,
} from "@/lib/promotions";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    await ensurePromotionTables();

    // Ensure default promo "LANGGANAN" exists with sample specific items if none
    const existingLangganan = await prisma.promotion.findUnique({
      where: { code: "LANGGANAN" },
    });
    if (!existingLangganan) {
      const createdPromo = await prisma.promotion.create({
        data: {
          name: "Diskon Khusus Pelanggan Langganan Setia",
          code: "LANGGANAN",
          type: "PERCENTAGE",
          value: 15,
          minOrderAmount: 30000,
          maxDiscount: 20000,
          isActive: true,
        },
      });

      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Promotion" SET "scope" = 'SPECIFIC_ITEMS' WHERE "id" = ?`,
          createdPromo.id
        );

        // Assign some popular staple units to LANGGANAN promo by default
        const units = await prisma.productUnit.findMany({ take: 3 });
        for (const u of units) {
          const discountVal = Math.round(u.price * 0.15); // 15% discount
          await prisma.$executeRawUnsafe(
            `INSERT INTO "PromotionItem" ("id", "promotionId", "productUnitId", "discountType", "discountValue", "createdAt")
             VALUES (?, ?, ?, 'FIXED', ?, CURRENT_TIMESTAMP)`,
            `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            createdPromo.id,
            u.id,
            discountVal
          );
        }
      } catch {}
    }

    const promotions = await getPromotionsList();
    return apiSuccess(promotions);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil daftar promosi", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    await ensurePromotionTables();

    const body = await req.json();
    const {
      name,
      code,
      type = "FIXED",
      value = 0,
      minOrderAmount = 0,
      maxDiscount,
      startsAt,
      endsAt,
      isActive = true,
      scope = "SPECIFIC_ITEMS",
      items = [],
    } = body;

    if (!name || !code) {
      return apiError(
        "VALIDATION_ERROR",
        "Nama voucher dan kode kupon wajib diisi",
        400
      );
    }

    const cleanCode = String(code).trim().toUpperCase();

    const existing = await prisma.promotion.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return apiError("CODE_ALREADY_EXISTS", "Kode promo sudah digunakan", 409);
    }

    const promo = await prisma.promotion.create({
      data: {
        name: String(name).trim(),
        code: cleanCode,
        type: type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
        value: Number(value) || 0,
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount:
          maxDiscount !== undefined && maxDiscount !== null && Number(maxDiscount) > 0
            ? Number(maxDiscount)
            : null,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        isActive: Boolean(isActive),
      },
    });

    try {
      await prisma.$executeRawUnsafe(
        `UPDATE "Promotion" SET "scope" = ? WHERE "id" = ?`,
        scope || (items.length > 0 ? "SPECIFIC_ITEMS" : "ALL"),
        promo.id
      );
    } catch {}

    // Insert specific items assigned to this promo
    if (Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        if (!it.productUnitId || Number(it.discountValue) <= 0) continue;
        const itemId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "PromotionItem" ("id", "promotionId", "productUnitId", "discountType", "discountValue", "createdAt")
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          itemId,
          promo.id,
          it.productUnitId,
          it.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
          Number(it.discountValue)
        );
      }
    }

    return apiSuccess({ id: promo.id, code: promo.code }, undefined, 201);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal membuat promosi", 500);
  }
}
