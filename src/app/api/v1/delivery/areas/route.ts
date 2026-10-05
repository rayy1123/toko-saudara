import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(_req: NextRequest) {
  try {
    const areas = await prisma.deliveryArea.findMany({
      where: { isActive: true },
      orderBy: { shippingFee: "asc" },
    });

    return apiSuccess(areas);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil area pengiriman", 500);
  }
}
