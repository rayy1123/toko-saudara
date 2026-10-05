import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const bundles = await prisma.bundle.findMany({
      where: { isActive: true },
      include: {
        items: {
          include: {
            productUnit: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return apiSuccess(bundles);
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Failed to fetch bundles", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { name, description, bundlePrice, imageUrl, items } = body;

    if (!name || bundlePrice === undefined || !items || !Array.isArray(items) || items.length === 0) {
      return apiError("VALIDATION_ERROR", "Name, bundlePrice, and items array are required", 400);
    }

    const bundle = await prisma.bundle.create({
      data: {
        name,
        description,
        bundlePrice: Number(bundlePrice),
        imageUrl,
        items: {
          create: items.map((item: any) => ({
            productUnitId: item.productUnitId,
            quantity: Number(item.quantity) || 1.0,
          })),
        },
      },
      include: {
        items: {
          include: {
            productUnit: true,
          },
        },
      },
    });

    return apiSuccess(bundle, undefined, 201);
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Failed to create bundle", 500);
  }
}
