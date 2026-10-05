import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();

    const area = await prisma.deliveryArea.findUnique({ where: { id } });
    if (!area) {
      return apiError("AREA_NOT_FOUND", "Area pengiriman tidak ditemukan", 404);
    }

    const { name, shippingFee, minOrderAmount, isActive } = body;
    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (shippingFee !== undefined) updateData.shippingFee = Number(shippingFee);
    if (minOrderAmount !== undefined) updateData.minOrderAmount = Number(minOrderAmount);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.deliveryArea.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui area pengiriman", 500);
  }
}
