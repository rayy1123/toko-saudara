import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateOrderTransition, OrderStatus } from "@/lib/orders";
import { recordInventoryMovement } from "@/lib/inventory";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();
    const { status, note, trackingNote, courierId } = body;

    if (!status) {
      return apiError("VALIDATION_ERROR", "Status baru pesanan wajib diisi", 400);
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        payment: true,
        delivery: true,
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    // Validate state machine transition
    validateOrderTransition(order.orderStatus, status as OrderStatus);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      // If cancelled, restore stock
      if (status === "CANCELLED") {
        for (const item of order.items) {
          await recordInventoryMovement(
            {
              productUnitId: item.productUnitId,
              type: "RETURN",
              quantity: item.quantity,
              referenceType: "ORDER_CANCEL",
              referenceId: order.orderNumber,
              note: `Pengembalian stok pembatalan pesanan ${order.orderNumber} oleh admin`,
              createdBy: auth.user.id,
            },
            tx
          );
        }
      }

      // Update payment status if marked PAID
      let updatedPaymentStatus = order.paymentStatus;
      if (status === "PAID" && order.payment) {
        updatedPaymentStatus = "PAID";
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: "COMPLETED",
            paidAt: new Date(),
          },
        });
      } else if (status === "CANCELLED" && order.payment) {
        const nextPaymentStatus =
          order.payment.status === "COMPLETED" ? "REFUNDED" : "FAILED";
        updatedPaymentStatus = nextPaymentStatus;
        await tx.payment.update({
          where: { id: order.payment.id },
          data: { status: nextPaymentStatus },
        });
      }

      // Update delivery if relevant
      if (order.delivery) {
        const deliveryUpdate: any = {};
        if (status === "OUT_FOR_DELIVERY") {
          deliveryUpdate.status = "DISPATCHED";
        } else if (status === "DELIVERED") {
          deliveryUpdate.status = "DELIVERED";
        }
        if (trackingNote) deliveryUpdate.trackingNote = String(trackingNote).trim();
        if (courierId) deliveryUpdate.courierId = String(courierId).trim();

        if (Object.keys(deliveryUpdate).length > 0) {
          await tx.delivery.update({
            where: { id: order.delivery.id },
            data: deliveryUpdate,
          });
        }
      }

      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: status,
          paymentStatus: updatedPaymentStatus,
          statusHistory: {
            create: {
              fromStatus: order.orderStatus,
              toStatus: status,
              changedBy: auth.user.id,
              note: note ? String(note).trim() : `Status diubah menjadi ${status}`,
            },
          },
        },
        include: {
          items: true,
          payment: true,
          delivery: true,
          statusHistory: true,
        },
      });

      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "ORDER_STATUS_UPDATE",
          resourceType: "ORDER",
          resourceId: order.id,
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            fromStatus: order.orderStatus,
            toStatus: status,
            note,
          }),
        },
      });

      return updated;
    });

    return apiSuccess(updatedOrder);
  } catch (error: any) {
    return apiError("STATUS_UPDATE_FAILED", error.message || "Gagal memperbarui status pesanan", 400);
  }
}
