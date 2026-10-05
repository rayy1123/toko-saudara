import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    if (auth.user.role !== "ADMIN" && order.userId !== auth.user.id) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke pesanan ini", 403);
    }

    // Get or create active user cart
    let cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.user.id },
      });
    }

    const addedItems: Array<{ productUnitId: string; quantity: number }> = [];
    const unavailableItems: Array<{ productName: string }> = [];

    for (const item of order.items) {
      const unit = await prisma.productUnit.findUnique({
        where: { id: item.productUnitId },
        include: { product: true },
      });

      if (!unit || !unit.isActive || !unit.product.isActive || unit.stockQuantity <= 0) {
        unavailableItems.push({ productName: item.productNameSnapshot });
        continue;
      }

      // Add to cart with available stock capped
      const qtyToAdd = Math.min(item.quantity, unit.stockQuantity);

      await prisma.cartItem.upsert({
        where: {
          cartId_productUnitId: {
            cartId: cart.id,
            productUnitId: unit.id,
          },
        },
        update: {
          quantity: {
            increment: qtyToAdd,
          },
        },
        create: {
          cartId: cart.id,
          productUnitId: unit.id,
          quantity: qtyToAdd,
        },
      });

      addedItems.push({
        productUnitId: unit.id,
        quantity: qtyToAdd,
      });
    }

    return apiSuccess({
      message: "Item dari pesanan sebelumnya berhasil ditambahkan ke keranjang",
      addedItemsCount: addedItems.length,
      unavailableItems,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengulang pesanan", 500);
  }
}
