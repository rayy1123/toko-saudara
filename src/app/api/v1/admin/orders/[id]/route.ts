import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { id } = await context.params;

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: true,
            addresses: true,
          },
        },
        items: true,
        payment: true,
        delivery: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    return apiSuccess(order);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat detail pesanan", 500);
  }
}
