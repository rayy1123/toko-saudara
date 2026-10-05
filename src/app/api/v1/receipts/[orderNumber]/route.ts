import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        payment: true,
        delivery: true,
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Struk belanja tidak ditemukan", 404);
    }

    let addressData: any = {};
    try {
      addressData = JSON.parse(order.addressSnapshot);
    } catch {
      addressData = { recipientName: "Pelanggan Toko" };
    }

    // Read POS fields if available
    let posData: any = {};
    try {
      const rows = (await prisma.$queryRawUnsafe(
        `SELECT "orderType", "customerName", "customerPhone", "cashTendered", "changeReturned" FROM "Order" WHERE "id" = ?`,
        order.id
      )) as any[];
      if (rows && rows[0]) {
        posData = rows[0];
      }
    } catch {}

    const receipt = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: posData.orderType || "ONLINE",
      createdAt: order.createdAt,
      customer: {
        name: posData.customerName || addressData.recipientName || "Pelanggan Toko Saudara",
        phone: posData.customerPhone || addressData.phone || "-",
        address: addressData.addressLine || "Kios Toko Saudara Pasar Kramat Jati",
        district: addressData.district || "Kramat Jati",
        city: addressData.city || "Jakarta Timur",
      },
      items: order.items.map((it) => ({
        id: it.id,
        name: it.productNameSnapshot,
        unit: it.unitNameSnapshot,
        price: it.unitPrice,
        quantity: it.quantity,
        subtotal: it.subtotal,
      })),
      pricing: {
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        shippingFee: order.shippingFee,
        grandTotal: order.grandTotal,
        cashTendered: posData.cashTendered || null,
        changeReturned: posData.changeReturned || null,
      },
      payment: {
        method: order.payment?.method || "TUNAI",
        status: order.paymentStatus,
        paidAt: order.payment?.paidAt || order.createdAt,
      },
      delivery: order.delivery
        ? {
            method: order.delivery.method,
            status: order.delivery.status,
            slot: `${order.delivery.slotStart || "06:00"} - ${order.delivery.slotEnd || "09:00"}`,
            scheduledDate: order.delivery.scheduledDate,
            trackingNote: order.delivery.trackingNote,
          }
        : null,
      notes: order.notes,
      orderStatus: order.orderStatus,
    };

    return apiSuccess(receipt);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal memuat struk belanja", 500);
  }
}
