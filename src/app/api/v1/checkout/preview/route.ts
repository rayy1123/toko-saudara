import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateOrderTotals, PricingItemInput } from "@/lib/pricing";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const { promoCode, deliveryAreaId, items: rawItems } = body;

    let itemsToCalculate: PricingItemInput[] = [];

    if (Array.isArray(rawItems) && rawItems.length > 0) {
      itemsToCalculate = rawItems.map((i: any) => ({
        productUnitId: i.productUnitId,
        quantity: Number(i.quantity),
      }));
    } else {
      // Load user's cart items
      const cart = await prisma.cart.findUnique({
        where: { userId: auth.user.id },
        include: {
          items: true,
        },
      });

      if (!cart || cart.items.length === 0) {
        return apiError("CART_EMPTY", "Keranjang belanja masih kosong", 400);
      }

      itemsToCalculate = cart.items.map((i) => ({
        productUnitId: i.productUnitId,
        quantity: i.quantity,
      }));
    }

    const calculation = await calculateOrderTotals(
      itemsToCalculate,
      promoCode,
      deliveryAreaId
    );

    return apiSuccess({
      items: calculation.items,
      subtotal: calculation.subtotal,
      discountTotal: calculation.discountTotal,
      shippingFee: calculation.shippingFee,
      grandTotal: calculation.grandTotal,
      promotion: calculation.promotion,
      deliveryArea: calculation.deliveryArea,
    });
  } catch (error: any) {
    return apiError("CALCULATION_ERROR", error.message || "Gagal menghitung pratinjau pesanan", 400);
  }
}
