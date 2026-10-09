import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordInventoryMovement } from "@/lib/inventory";

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
    const { action, phone, reason = "Pesanan dibatalkan oleh pelanggan" } = body;

    if (action === "CANCEL") {
      const order = await prisma.order.findFirst({
        where: { OR: [{ id }, { orderNumber: id }] },
        include: {
          items: true,
          payment: true,
        },
      });

      if (!order) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan" }, { status: 404 });
      }

      // Authorization guard: phone verification if provided
      if (phone && order.customerPhone && order.customerPhone !== "-") {
        const cleanReqPhone = String(phone).replace(/[^0-9]/g, "");
        const cleanOrderPhone = String(order.customerPhone).replace(/[^0-9]/g, "");
        if (cleanReqPhone && cleanOrderPhone && !cleanOrderPhone.includes(cleanReqPhone)) {
          return NextResponse.json({ error: "Otorisasi gagal: nomor telepon tidak cocok" }, { status: 403 });
        }
      }

      if (order.orderStatus === "OUT_FOR_DELIVERY" || order.orderStatus === "DELIVERED") {
        return NextResponse.json(
          { error: "Pesanan yang sedang diantar atau sudah selesai tidak dapat dibatalkan" },
          { status: 400 }
        );
      }

      if (order.orderStatus === "CANCELLED") {
        return NextResponse.json({ error: "Pesanan sudah dibatalkan sebelumnya" }, { status: 400 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        // Return stock to inventory ledger
        for (const item of order.items) {
          try {
            await recordInventoryMovement(
              {
                productUnitId: item.productUnitId,
                type: "RETURN",
                quantity: item.quantity,
                referenceType: "ORDER_CANCEL",
                referenceId: order.orderNumber,
                note: `Pengembalian stok dari pembatalan pesanan ${order.orderNumber}`,
              },
              tx
            );
          } catch {}
        }

        return tx.order.update({
          where: { id: order.id },
          data: {
            orderStatus: "CANCELLED",
            statusHistory: {
              create: {
                fromStatus: order.orderStatus,
                toStatus: "CANCELLED",
                changedBy: "CUSTOMER",
                note: String(reason).trim(),
              },
            },
          },
          include: {
            statusHistory: true,
          },
        });
      });

      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
