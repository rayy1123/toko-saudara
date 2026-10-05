import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { validateOrderTransition, OrderStatus } from "@/lib/orders";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["COURIER", "ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();
    const { status, trackingNote } = body;

    if (!["OUT_FOR_DELIVERY", "DELIVERED"].includes(status)) {
      return apiError(
        "INVALID_STATUS",
        "Kurir hanya dapat mengubah status menjadi OUT_FOR_DELIVERY atau DELIVERED",
        400
      );
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        delivery: true,
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    validateOrderTransition(order.orderStatus, status as OrderStatus);

    const updated = await prisma.$transaction(async (tx) => {
      if (order.delivery) {
        await tx.delivery.update({
          where: { id: order.delivery.id },
          data: {
            status: status === "OUT_FOR_DELIVERY" ? "DISPATCHED" : "DELIVERED",
            courierId: auth.user.id,
            trackingNote: trackingNote ? String(trackingNote).trim() : null,
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: status,
          statusHistory: {
            create: {
              fromStatus: order.orderStatus,
              toStatus: status,
              changedBy: auth.user.id,
              note: trackingNote
                ? `Update kurir: ${trackingNote}`
                : `Status diperbarui oleh kurir menjadi ${status}`,
            },
          },
        },
        include: {
          delivery: true,
          statusHistory: true,
        },
      });
    });

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui status pengiriman", 400);
  }
}
