import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { productUnitId, quantity = 1 } = body;

    const qty = Number(quantity);
    if (!productUnitId || isNaN(qty) || qty <= 0) {
      return apiError(
        "VALIDATION_ERROR",
        "ID unit produk dan kuantitas valid (> 0) wajib diisi",
        400
      );
    }

    const unit = await prisma.productUnit.findUnique({
      where: { id: productUnitId },
      include: { product: true },
    });

    if (!unit || !unit.isActive || !unit.product.isActive) {
      return apiError(
        "PRODUCT_UNAVAILABLE",
        "Produk tidak tersedia atau sedang dinonaktifkan",
        404
      );
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { userId: auth.user.id },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: auth.user.id },
      });
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productUnitId: {
          cartId: cart.id,
          productUnitId,
        },
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + qty : qty;

    if (targetQuantity > unit.stockQuantity) {
      return apiError(
        "INSUFFICIENT_STOCK",
        `Stok tidak mencukupi. Tersedia: ${unit.stockQuantity}, diminta: ${targetQuantity}`,
        400
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        cartId_productUnitId: {
          cartId: cart.id,
          productUnitId,
        },
      },
      update: {
        quantity: targetQuantity,
      },
      create: {
        cartId: cart.id,
        productUnitId,
        quantity: qty,
      },
      include: {
        productUnit: {
          include: {
            product: true,
          },
        },
      },
    });

    return apiSuccess(
      {
        id: cartItem.id,
        cartId: cartItem.cartId,
        quantity: cartItem.quantity,
        productUnitId: cartItem.productUnitId,
        unitPrice: cartItem.productUnit.price,
        subtotal: cartItem.productUnit.price * cartItem.quantity,
      },
      undefined,
      201
    );
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menambahkan item ke keranjang", 500);
  }
}
