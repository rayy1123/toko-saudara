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
        OR: [{ id }, { slug: id }, { sku: id }],
        isActive: true,
      },
      include: {
        category: true,
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
        },
      },
    });

    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan", 404);
    }

    return apiSuccess(product);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil data produk", 500);
  }
}
