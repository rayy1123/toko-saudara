import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["COURIER", "ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const orders = await prisma.order.findMany({
      where: {
        orderStatus: {
          in: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"],
        },
        delivery: {
          scheduledDate: date,
        },
      },
      include: {
        delivery: true,
        items: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess({
      date,
      totalOrders: orders.length,
      orders,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil daftar tugas kurir", 500);
  }
}
