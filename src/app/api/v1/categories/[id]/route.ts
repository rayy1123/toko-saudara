import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        isActive: true,
      },
      include: {
        products: {
          where: { isActive: true },
          include: {
            units: {
              where: { isActive: true },
              orderBy: { price: "asc" },
            },
          },
        },
      },
    });

    if (!category) {
      return apiError("CATEGORY_NOT_FOUND", "Kategori tidak ditemukan", 404);
    }

    return apiSuccess(category);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil data kategori", 500);
  }
}
