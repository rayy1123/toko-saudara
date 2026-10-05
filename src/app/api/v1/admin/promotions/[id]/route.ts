import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";
import { ensurePromotionTables } from "@/lib/promotions";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    await ensurePromotionTables();

    const { id } = await context.params;
    const body = await req.json();

    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) {
      return apiError("PROMO_NOT_FOUND", "Promosi tidak ditemukan", 404);
    }

    const {
      name,
      code,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      startsAt,
      endsAt,
      isActive,
      scope,
      items,
    } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (code !== undefined) updateData.code = String(code).trim().toUpperCase();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined) updateData.value = Number(value);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
    if (maxDiscount !== undefined) updateData.maxDiscount = maxDiscount !== null && Number(maxDiscount) > 0 ? Number(maxDiscount) : null;
    if (startsAt !== undefined) updateData.startsAt = new Date(startsAt);
    if (endsAt !== undefined) updateData.endsAt = endsAt !== null && endsAt !== "" ? new Date(endsAt) : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.promotion.update({
      where: { id },
      data: updateData,
    });

    if (scope !== undefined) {
      try {
        await prisma.$executeRawUnsafe(
          `UPDATE "Promotion" SET "scope" = ? WHERE "id" = ?`,
          scope,
          id
        );
      } catch {}
    }

    // Update specific items if provided
    if (Array.isArray(items)) {
      try {
        // Delete old items
        await prisma.$executeRawUnsafe(
          `DELETE FROM "PromotionItem" WHERE "promotionId" = ?`,
          id
        );

        // Insert new items
        for (const it of items) {
          if (!it.productUnitId || Number(it.discountValue) <= 0) continue;
          const itemId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          await prisma.$executeRawUnsafe(
            `INSERT INTO "PromotionItem" ("id", "promotionId", "productUnitId", "discountType", "discountValue", "createdAt")
             VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            itemId,
            id,
            it.productUnitId,
            it.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
            Number(it.discountValue)
          );
        }
      } catch (e) {
        console.error("Error updating promotion items:", e);
      }
    }

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui promosi", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    await ensurePromotionTables();

    const { id } = await context.params;

    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) {
      return apiError("PROMO_NOT_FOUND", "Promosi tidak ditemukan", 404);
    }

    // Delete promotion items first
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "PromotionItem" WHERE "promotionId" = ?`,
        id
      );
    } catch {}

    await prisma.promotion.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true, id });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menghapus promosi", 500);
  }
}
