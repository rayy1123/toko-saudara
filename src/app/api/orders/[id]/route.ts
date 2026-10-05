import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        items: true,
        delivery: true,
        payment: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    if (action === "CANCEL") {
      const order = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
      });

      if (!order) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
      }

      if (order.orderStatus === "OUT_FOR_DELIVERY" || order.orderStatus === "DELIVERED") {
        return NextResponse.json(
          { error: "Pesanan yang sedang diantar atau sudah selesai tidak dapat dibatalkan" },
          { status: 400 }
        );
      }

      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          orderStatus: "CANCELLED",
          statusHistory: {
            create: {
              fromStatus: order.orderStatus,
              toStatus: "CANCELLED",
              changedBy: "CUSTOMER",
              note: "Pesanan dibatalkan oleh pelanggan",
            },
          },
        },
        include: {
          statusHistory: true,
        },
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
