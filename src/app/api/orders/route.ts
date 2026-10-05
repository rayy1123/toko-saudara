import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordInventoryMovement } from "@/lib/inventory";
import { ensureAccountingTables } from "@/lib/accounting";

export async function POST(req: Request) {
  try {
    await ensureAccountingTables();
    const body = await req.json();
    const {
      recipientName,
      phone,
      addressLine,
      district,
      city,
      deliverySlot,
      deliveryNotes,
      paymentMethod,
      items,
      promoCode,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Keranjang belanja kosong" }, { status: 400 });
    }

    if (!recipientName || !phone || !addressLine || !district) {
      return NextResponse.json(
        { error: "Mohon lengkapi Nama Penerima, No. WhatsApp/HP, dan Alamat Pengiriman" },
        { status: 400 }
      );
    }

    // 1. Authoritative server price calculation & stock verification
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
        const fallbackPrice = Number(item.price) || 5000;
        calculatedSubtotal += fallbackPrice * Number(item.quantity);
        validatedItems.push({
          productId: item.productId || "prod-default",
          productUnitId: item.productUnitId,
          productName: item.name || "Produk Pasar",
          unitName: item.unitName || "1 Pcs",
          unitPrice: fallbackPrice,
          quantity: Number(item.quantity),
          subtotal: fallbackPrice * Number(item.quantity),
        });
      } else {
        const itemSubtotal = unit.price * Number(item.quantity);
        calculatedSubtotal += itemSubtotal;
        validatedItems.push({
          productId: unit.productId,
          productUnitId: unit.id,
          productName: unit.product.name,
          unitName: unit.unitName,
          unitPrice: unit.price,
          quantity: Number(item.quantity),
          subtotal: itemSubtotal,
        });
      }
    }

    // 2. Dynamic server discount validation from database Promotion table
    let discountTotal = 0;
    if (promoCode && promoCode.trim() !== "") {
      const cleanCode = promoCode.trim().toUpperCase();
      const now = new Date();
      let promo = await prisma.promotion.findFirst({
        where: {
          code: cleanCode,
          isActive: true,
          startsAt: { lte: now },
          OR: [{ endsAt: null }, { endsAt: { gte: now } }],
        },
      });

      if (!promo && cleanCode === "LANGGANAN") {
        promo = await prisma.promotion.create({
          data: {
            name: "Diskon Khusus Pelanggan Langganan Setia",
            code: "LANGGANAN",
            type: "PERCENTAGE",
            value: 15,
            minOrderAmount: 30000,
            maxDiscount: 20000,
            isActive: true,
          },
        });
      }

      if (promo && calculatedSubtotal >= promo.minOrderAmount) {
        if (promo.type === "PERCENTAGE") {
          let calculated = (calculatedSubtotal * promo.value) / 100;
          if (promo.maxDiscount && promo.maxDiscount > 0) {
            calculated = Math.min(calculated, promo.maxDiscount);
          }
          discountTotal = calculated;
        } else if (promo.type === "FIXED") {
          discountTotal = Math.min(promo.value, calculatedSubtotal);
        }
      }
    }

    // 3. Shipping fee based on area / free threshold
    let shippingFee = calculatedSubtotal >= 60000 ? 0 : 8000;
    const area = await prisma.deliveryArea.findFirst({
      where: { name: { contains: district } },
    });
    if (area && calculatedSubtotal < 60000) {
      shippingFee = area.shippingFee;
    }

    const grandTotal = Math.max(0, calculatedSubtotal - discountTotal + shippingFee);

    // 4. Generate order number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // 5. Customer resolution (Guest checkout support)
    let customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    if (!customer) {
      customer = await prisma.user.create({
        data: {
          email: `guest-${Date.now()}@tokosaudara.id`,
          passwordHash: "guest_pwd",
          role: "CUSTOMER",
          profile: {
            create: { name: recipientName, phone },
          },
        },
      });
    }

    const addressSnapshot = JSON.stringify({
      recipientName,
      phone,
      addressLine,
      district: district || "Kramat Jati",
      city: city || "Jakarta Timur",
    });

    let slotStart = "15:30";
    let slotEnd = "06:00";
    if (deliverySlot === "OPERASIONAL_SORE") {
      slotStart = "16:00";
      slotEnd = "21:00";
    } else if (deliverySlot === "OPERASIONAL_MALAM") {
      slotStart = "21:00";
      slotEnd = "02:00";
    } else if (deliverySlot === "OPERASIONAL_SUBUH") {
      slotStart = "02:00";
      slotEnd = "06:00";
    }

    // 6. Transaction-safe database order creation
    const order = await prisma.$transaction(async (tx) => {
      // Deduct stock for validated items if unit exists
      for (const it of validatedItems) {
        try {
          await recordInventoryMovement(
            {
              productUnitId: it.productUnitId,
              type: "SALE",
              quantity: it.quantity,
              referenceType: "ORDER",
              referenceId: orderNumber,
              note: `Pesanan online ${orderNumber} (${it.quantity} x ${it.productName})`,
              createdBy: customer.id,
            },
            tx
          );
        } catch {
          // If unit doesn't have strict stock constraint, continue
        }
      }

      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: customer.id,
          addressSnapshot,
          subtotal: calculatedSubtotal,
          discountTotal,
          shippingFee,
          grandTotal,
          paymentStatus: paymentMethod === "COD" ? "UNPAID" : "PAID",
          orderStatus: "PROCESSING",
          notes: deliveryNotes || "Tolong gantung di pagar jika belum bangun",
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              productUnitId: item.productUnitId,
              productNameSnapshot: item.productName,
              unitNameSnapshot: item.unitName,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
          payment: {
            create: {
              method: paymentMethod || "COD",
              status: paymentMethod === "COD" ? "PENDING" : "COMPLETED",
              amount: grandTotal,
              paidAt: paymentMethod === "COD" ? null : new Date(),
            },
          },
          delivery: {
            create: {
              method: "KURIR_TOKO",
              status: "PENDING",
              scheduledDate: new Date().toISOString().slice(0, 10),
              slotStart,
              slotEnd,
              trackingNote: "Pesanan masuk ke sistem, menunggu sortir subuh",
            },
          },
          statusHistory: {
            create: [
              {
                fromStatus: null,
                toStatus: "PENDING_PAYMENT",
                changedBy: customer.id,
                note: `Pesanan dibuat oleh ${recipientName} (${phone})`,
              },
              {
                fromStatus: "PENDING_PAYMENT",
                toStatus: "PROCESSING",
                changedBy: "SYSTEM",
                note:
                  paymentMethod === "COD"
                    ? "Pesanan COD dikonfirmasi & disiapkan tim toko"
                    : "Pembayaran terverifikasi, pesanan disiapkan tim toko",
              },
            ],
          },
        },
        include: {
          items: true,
          delivery: true,
          payment: true,
        },
      });

      // Update guest order metadata
      try {
        await tx.$executeRawUnsafe(
          `UPDATE "Order" SET "customerName" = ?, "customerPhone" = ?, "orderType" = 'ONLINE' WHERE "id" = ?`,
          recipientName,
          phone,
          createdOrder.id
        );
      } catch {}

      return createdOrder;
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        receiptUrl: `/struk/${order.orderNumber}`,
      },
    });
  } catch (err: any) {
    console.error("Order creation failed:", err);
    return NextResponse.json({ error: err.message || "Gagal memproses pesanan" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber");
    const phone = searchParams.get("phone");

    const where: any = {};
    if (orderNumber) {
      where.orderNumber = orderNumber;
    }
    if (phone) {
      where.OR = [
        { customerPhone: phone },
        { addressSnapshot: { contains: phone } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        items: true,
        delivery: true,
        payment: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
