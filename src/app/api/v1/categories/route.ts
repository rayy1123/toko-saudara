import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(_req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      imageUrl: cat.imageUrl,
      sortOrder: cat.sortOrder,
      productCount: cat._count.products,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil kategori", 500);
  }
}
