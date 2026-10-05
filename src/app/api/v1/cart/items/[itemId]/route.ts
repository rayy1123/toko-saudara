import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { itemId } = await context.params;
    const body = await req.json();
    const { quantity } = body;

    const qty = Number(quantity);
    if (isNaN(qty)) {
      return apiError("VALIDATION_ERROR", "Kuantitas tidak valid", 400);
    }

    // Verify item belongs to user's cart
    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        productUnit: true,
      },
    });

    if (!item || item.cart.userId !== auth.user.id) {
      return apiError("ITEM_NOT_FOUND", "Item keranjang tidak ditemukan", 404);
    }

    // If quantity is 0 or negative, remove item
    if (qty <= 0) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
      return apiSuccess({ message: "Item berhasil dihapus dari keranjang" });
    }

    if (qty > item.productUnit.stockQuantity) {
      return apiError(
        "INSUFFICIENT_STOCK",
        `Stok tidak mencukupi. Tersedia: ${item.productUnit.stockQuantity}, diminta: ${qty}`,
        400
      );
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: qty },
      include: {
        productUnit: true,
      },
    });

    return apiSuccess({
      id: updated.id,
      quantity: updated.quantity,
      unitPrice: updated.productUnit.price,
      subtotal: updated.productUnit.price * updated.quantity,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui item keranjang", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { itemId } = await context.params;

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
      },
    });

    if (!item || item.cart.userId !== auth.user.id) {
      return apiError("ITEM_NOT_FOUND", "Item keranjang tidak ditemukan", 404);
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return apiSuccess({ message: "Item berhasil dihapus dari keranjang" });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menghapus item dari keranjang", 500);
  }
}
