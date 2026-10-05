import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    let cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
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

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.user.id },
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
    }

    let subtotal = 0;
    let totalItems = 0;

    const formattedItems = cart.items.map((item) => {
      const unit = item.productUnit;
      const product = unit.product;
      const itemSubtotal = unit.price * item.quantity;
      const isAvailable = unit.isActive && product.isActive && unit.stockQuantity >= item.quantity;

      subtotal += itemSubtotal;
      totalItems += item.quantity;

      return {
        id: item.id,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        isAvailable,
        productUnit: {
          id: unit.id,
          unitName: unit.unitName,
          unitCode: unit.unitCode,
          price: unit.price, // Server authoritative
          stockQuantity: unit.stockQuantity,
          isActive: unit.isActive,
        },
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          imageUrl: product.imageUrl,
          isActive: product.isActive,
        },
      };
    });

    return apiSuccess({
      id: cart.id,
      userId: cart.userId,
      items: formattedItems,
      subtotal,
      totalItems,
      itemCount: formattedItems.length,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat keranjang belanja", 500);
  }
}
