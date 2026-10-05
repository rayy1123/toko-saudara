import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
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
        payment: true,
        delivery: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            profile: true,
          },
        },
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Pesanan tidak ditemukan", 404);
    }

    // BOLA / IDOR protection
    if (auth.user.role !== "ADMIN" && order.userId !== auth.user.id) {
      return apiError("FORBIDDEN", "Anda tidak memiliki akses ke pesanan ini", 403);
    }

    return apiSuccess(order);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil data pesanan", 500);
  }
}
