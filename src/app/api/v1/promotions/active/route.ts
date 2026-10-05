import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(_req: NextRequest) {
  try {
    const now = new Date();
    const promotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: "desc" },
    });

    const formatted = promotions.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      type: p.type,
      value: p.value,
      minOrderAmount: p.minOrderAmount,
      maxDiscount: p.maxDiscount,
      startsAt: p.startsAt,
      endsAt: p.endsAt,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil promosi aktif", 500);
  }
}
