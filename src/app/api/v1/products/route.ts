import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId")?.trim();
    const isFresh = searchParams.get("isFresh");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      units: {
        some: {
          isActive: true,
        },
      },
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (categoryId) {
      where.category = {
        OR: [{ id: categoryId }, { slug: categoryId }],
      };
    }

    if (isFresh !== null && isFresh !== undefined) {
      where.isFresh = isFresh === "true" || isFresh === "1";
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
    if (sort === "name_asc") {
      orderBy = { name: "asc" };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          units: {
            where: { isActive: true },
            orderBy: { price: "asc" },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    // Handle price sorting in memory if requested
    if (sort === "price_asc") {
      products.sort((a, b) => {
        const minA = a.units[0]?.price ?? 0;
        const minB = b.units[0]?.price ?? 0;
        return minA - minB;
      });
    } else if (sort === "price_desc") {
      products.sort((a, b) => {
        const minA = a.units[0]?.price ?? 0;
        const minB = b.units[0]?.price ?? 0;
        return minB - minA;
      });
    }

    return apiSuccess(products, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil daftar produk", 500);
  }
}
