import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(_req: NextRequest) {
  try {
    const freshProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        isFresh: true,
        units: {
          some: { isActive: true },
        },
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        units: {
          where: { isActive: true },
          orderBy: { price: "asc" },
          include: {
            priceHistories: {
              orderBy: { createdAt: "desc" },
              take: 2,
            },
          },
        },
      },
      take: 12,
    });

    const highlights = freshProducts.map((p) => {
      const primaryUnit = p.units[0];
      const previousPrice =
        primaryUnit && primaryUnit.priceHistories.length > 1
          ? primaryUnit.priceHistories[1].price
          : null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        category: p.category.name,
        imageUrl: p.imageUrl,
        harvestInfo: p.harvestInfo,
        primaryUnit: primaryUnit
          ? {
              id: primaryUnit.id,
              unitName: primaryUnit.unitName,
              price: primaryUnit.price,
              previousPrice,
              stockQuantity: primaryUnit.stockQuantity,
            }
          : null,
        units: p.units.map((u) => ({
          id: u.id,
          unitName: u.unitName,
          price: u.price,
          stockQuantity: u.stockQuantity,
        })),
      };
    });

    return apiSuccess({
      date: new Date().toISOString().split("T")[0],
      title: "Harga Pasar Hari Ini",
      description: "Harga komoditas dan sayur segar terkini langsung dari pasar",
      items: highlights,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil data harga hari ini", 500);
  }
}
