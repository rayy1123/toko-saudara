import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";
import { recordInventoryMovement } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/orders";
import { ensureAccountingTables } from "@/lib/accounting";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    await ensureAccountingTables();

    const body = await req.json();
    const {
      customerName = "Pelanggan Toko",
      customerPhone = "-",
      paymentMethod = "CASH",
      cashTendered = 0,
      notes = "Penjualan langsung di kios pasar",
      items,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return apiError("VALIDATION_ERROR", "Daftar belanjaan kasir wajib diisi", 400);
    }

    // 1. Validate items and fetch prices
    let calculatedSubtotal = 0;
    const validatedItems: Array<{
      productId: string;
      productUnitId: string;
      productName: string;
      unitName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const unit = await prisma.productUnit.findUnique({
        where: { id: item.productUnitId },
        include: { product: true },
      });

      if (!unit || !unit.isActive) {
        return apiError("PRODUCT_NOT_FOUND", `Produk/satuan tidak ditemukan atau tidak aktif`, 404);
      }

      if (unit.stockQuantity < item.quantity) {
        return apiError(
          "INSUFFICIENT_STOCK",
          `Stok ${unit.product.name} (${unit.unitName}) tidak mencukupi (tersedia: ${unit.stockQuantity})`,
          400
        );
      }

      const price = item.customPrice !== undefined ? Number(item.customPrice) : unit.price;
      const sub = price * Number(item.quantity);
      calculatedSubtotal += sub;

      validatedItems.push({
        productId: unit.productId,
        productUnitId: unit.id,
        productName: unit.product.name,
        unitName: unit.unitName,
        unitPrice: price,
        quantity: Number(item.quantity),
        subtotal: sub,
      });
    }

    const grandTotal = calculatedSubtotal;
    const tendered = Number(cashTendered) || grandTotal;
    const change = Math.max(0, tendered - grandTotal);

    // 2. Atomic transaction to create completed POS order
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderNumber(tx);

      // Check / get an admin or pos user ID
      const posUser =
        (await tx.user.findFirst({ where: { role: "ADMIN" } })) ||
        (await tx.user.findFirst());

      if (!posUser) {
        throw new Error("User sistem tidak ditemukan");
      }

      const addressSnapshot = JSON.stringify({
        recipientName: customerName,
        phone: customerPhone,
        addressLine: "Beli langsung di Toko Saudara (Pasar Kramat Jati)",
        district: "Kramat Jati",
        city: "Jakarta Timur",
      });

      // Deduct inventory
      for (const it of validatedItems) {
        await recordInventoryMovement(
          {
            productUnitId: it.productUnitId,
            type: "SALE",
            quantity: it.quantity,
            referenceType: "POS_ORDER",
            referenceId: orderNumber,
            note: `Penjualan kasir langsung (${it.quantity} x ${it.productName})`,
            createdBy: auth.user.id,
          },
          tx
        );
      }

      // Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: posUser.id,
          addressSnapshot,
          subtotal: calculatedSubtotal,
          discountTotal: 0,
          shippingFee: 0,
          grandTotal,
          paymentStatus: "PAID",
          orderStatus: "DELIVERED",
          notes,
          items: {
            create: validatedItems.map((it) => ({
              productId: it.productId,
              productUnitId: it.productUnitId,
              productNameSnapshot: it.productName,
              unitNameSnapshot: it.unitName,
              unitPrice: it.unitPrice,
              quantity: it.quantity,
              subtotal: it.subtotal,
            })),
          },
          payment: {
            create: {
              method: paymentMethod,
              status: "COMPLETED",
              amount: grandTotal,
              paidAt: new Date(),
            },
          },
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: "DELIVERED",
                changedBy: auth.user.id,
                note: `Transaksi kasir langsung toko (Kasir: ${auth.user.email})`,
              },
            ],
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      // Update custom fields via raw query to ensure compatibility
      try {
        await tx.$executeRawUnsafe(
          `UPDATE "Order" SET "orderType" = 'POS_OFFLINE', "customerName" = ?, "customerPhone" = ?, "cashTendered" = ?, "changeReturned" = ? WHERE "id" = ?`,
          customerName,
          customerPhone,
          tendered,
          change,
          newOrder.id
        );
      } catch {}

      // Log to AuditEvent for owner live monitoring
      try {
        await tx.auditEvent.create({
          data: {
            actorUserId: auth.user.id,
            action: "POS_SALE",
            resourceType: "ORDER",
            resourceId: newOrder.id,
            metadata: JSON.stringify({
              orderNumber,
              customerName,
              customerPhone,
              grandTotal,
              paymentMethod,
              itemsCount: validatedItems.length,
              actorRole: auth.user.role,
              actorEmail: auth.user.email,
              actorName: auth.user.profile?.name || auth.user.email,
            }),
          },
        });
      } catch {}

      return newOrder;
    });

    return apiSuccess({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName,
      grandTotal,
      cashTendered: tendered,
      changeReturned: change,
      itemsCount: validatedItems.length,
      receiptUrl: `/struk/${order.orderNumber}`,
    });
  } catch (err: any) {
    console.error("POS transaction error:", err);
    return apiError("SERVER_ERROR", err.message || "Gagal mencatat transaksi kasir", 500);
  }
}
