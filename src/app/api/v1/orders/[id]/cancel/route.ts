import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateOrderTransition } from "@/lib/orders";
import { recordInventoryMovement } from "@/lib/inventory";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body?.reason || "Pesanan dibatalkan oleh pengguna";

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    // BOLA check
    if (auth.user.role !== "ADMIN" && order.userId !== auth.user.id) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke pesanan ini", 403);
    }

    // State machine validation
    validateOrderTransition(order.orderStatus, "CANCELLED");

    // Execute cancellation inside transaction
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Restore inventory stock
      for (const item of order.items) {
        await recordInventoryMovement(
          {
            productUnitId: item.productUnitId,
            type: "RETURN",
            quantity: item.quantity,
            referenceType: "ORDER_CANCEL",
            referenceId: order.orderNumber,
            note: `Pengembalian stok dari pembatalan pesanan ${order.orderNumber}`,
            createdBy: auth.user.id,
          },
          tx
        );
      }

      // Update payment status if exists
      if (order.payment) {
        const newPaymentStatus =
          order.payment.status === "COMPLETED" ? "REFUNDED" : "FAILED";
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: newPaymentStatus },
        });
      }

      // Update order status
      const cancelled = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CANCELLED",
          paymentStatus:
            order.paymentStatus === "PAID" ? "REFUNDED" : order.paymentStatus,
          statusHistory: {
            create: {
              fromStatus: order.orderStatus,
              toStatus: "CANCELLED",
              changedBy: auth.user.id,
              note: String(reason).trim(),
            },
          },
        },
        include: {
          items: true,
          payment: true,
          statusHistory: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "ORDER_CANCELLED",
          resourceType: "ORDER",
          resourceId: order.id,
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            previousStatus: order.orderStatus,
            reason,
          }),
        },
      });

      return cancelled;
    });

    return apiSuccess(updatedOrder);
  } catch (error: any) {
    return apiError("CANCELLATION_FAILED", error.message || "Gagal membatalkan pesanan", 400);
  }
}
