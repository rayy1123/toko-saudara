import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const body = await req.json();
    const { name, shippingFee, minOrderAmount = 0, isActive = true } = body;

    if (!name || shippingFee === undefined) {
      return apiError("VALIDATION_ERROR", "Nama area dan biaya ongkir wajib diisi", 400);
    }

    const area = await prisma.deliveryArea.create({
      data: {
        name: String(name).trim(),
        shippingFee: Number(shippingFee),
        minOrderAmount: Number(minOrderAmount) || 0,
        isActive: Boolean(isActive),
      },
    });

    return apiSuccess(area, undefined, 201);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal membuat area pengiriman", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const areas = await prisma.deliveryArea.findMany({
      orderBy: { shippingFee: "asc" },
    });

    return apiSuccess(areas);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat area pengiriman", 500);
  }
}
