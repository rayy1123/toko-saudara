import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
    });

    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan", 404);
    }

    const units = await prisma.productUnit.findMany({
      where: {
        productId: product.id,
        isActive: true,
      },
      orderBy: { price: "asc" },
    });

    return apiSuccess(units);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil unit produk", 500);
  }
}
