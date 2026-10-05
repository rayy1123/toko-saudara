import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const productUnitId = searchParams.get("productUnitId");

    const where: any = {};
    if (productUnitId) {
      where.productUnitId = productUnitId;
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        productUnit: {
          include: {
            product: {
              select: { name: true, sku: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Resolve createdBy usernames if possible
    const userIds = Array.from(new Set(movements.map((m) => m.createdBy).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, profile: { select: { name: true } } },
    });
    const userMap = new Map(users.map((u) => [u.id, u.profile?.name || u.email]));

    const result = movements.map((m) => ({
      id: m.id,
      productUnitId: m.productUnitId,
      productName: m.productUnit.product.name,
      sku: m.productUnit.product.sku,
      unitName: m.productUnit.unitName,
      type: m.type,
      quantityDelta: m.quantityDelta,
      referenceType: m.referenceType,
      referenceId: m.referenceId,
      note: m.note,
      createdAt: m.createdAt,
      createdBy: m.createdBy ? userMap.get(m.createdBy) || "Admin" : "Sistem",
    }));

    return apiSuccess(result);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat log mutasi inventaris", 500);
  }
}
