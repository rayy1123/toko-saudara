import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { calculateOrderTotals } from "@/lib/pricing";
import { recordInventoryMovement } from "@/lib/inventory";
import { generateOrderNumber } from "@/lib/orders";
import { apiError, apiSuccess } from "@/lib/response";
import { checkRateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const rateLimit = checkRateLimit(`checkout:${auth.user.id}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Terlalu banyak permintaan checkout. Tunggu ${rateLimit.resetInSeconds} detik.`,
        429
      );
    }

    const body = await req.json();
    const {
      deliveryAreaId,
      address,
      addressId,
      paymentMethod = "COD",
      deliveryMethod = "KURIR_TOKO",
      promoCode,
      notes,
      scheduledDate,
      slotStart,
      slotEnd,
    } = body;

    // Validate payment method
    if (!["COD", "BANK_TRANSFER"].includes(paymentMethod)) {
      return apiError(
        "INVALID_PAYMENT_METHOD",
        "Metode pembayaran harus COD atau BANK_TRANSFER",
        400
      );
    }

    // Resolve address snapshot
    let finalAddress: any = null;
    if (addressId) {
      const userAddress = await prisma.address.findFirst({
        where: { id: addressId, userId: auth.user.id },
      });
      if (userAddress) {
        finalAddress = {
          recipientName: userAddress.recipientName,
          phone: userAddress.phone,
          addressLine: userAddress.addressLine,
          district: userAddress.district,
          city: userAddress.city,
          province: userAddress.province,
          postalCode: userAddress.postalCode,
        };
      }
    } else if (address) {
      if (!address.recipientName || !address.phone || !address.addressLine) {
        return apiError(
          "VALIDATION_ERROR",
          "Data alamat pengiriman (nama penerima, no hp, alamat lengkap) tidak lengkap",
          400
        );
      }
      finalAddress = {
        recipientName: address.recipientName,
        phone: address.phone,
        addressLine: address.addressLine,
        district: address.district || "",
        city: address.city || "",
        province: address.province || "",
        postalCode: address.postalCode || "",
      };
    }

    if (!finalAddress) {
      return apiError(
        "VALIDATION_ERROR",
        "Alamat tujuan pengiriman wajib ditentukan",
        400
      );
    }

    // Execute atomic checkout transaction
    const newOrder = await prisma.$transaction(async (tx) => {
      // 1. Fetch user's cart
      const cart = await tx.cart.findUnique({
        where: { userId: auth.user.id },
        include: {
          items: true,
        },
      });

      if (!cart || cart.items.length === 0) {
        throw new Error("Keranjang belanja kosong. Silakan pilih produk terlebih dahulu.");
      }

      // 2. Server authoritative price calculation
      const pricingItems = cart.items.map((i) => ({
        productUnitId: i.productUnitId,
        quantity: i.quantity,
      }));

      const totals = await calculateOrderTotals(
        pricingItems,
        promoCode,
        deliveryAreaId,
        tx
      );

      // 3. Generate unique order number
      const orderNumber = await generateOrderNumber(tx);

      // 4. Check & deduct stock with inventory ledger entry
      for (const item of totals.items) {
        await recordInventoryMovement(
          {
            productUnitId: item.productUnitId,
            type: "SALE",
            quantity: item.quantity,
            referenceType: "ORDER",
            referenceId: orderNumber,
            note: `Penjualan pesanan ${orderNumber}`,
            createdBy: auth.user.id,
          },
          tx
        );
      }

      // 5. Create Order record
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: auth.user.id,
          addressSnapshot: JSON.stringify(finalAddress),
          subtotal: totals.subtotal,
          discountTotal: totals.discountTotal,
          shippingFee: totals.shippingFee,
          grandTotal: totals.grandTotal,
          paymentStatus: "UNPAID",
          orderStatus: "PENDING_PAYMENT",
          notes: notes ? String(notes).trim() : null,
          items: {
            create: totals.items.map((i) => ({
              productId: i.productId,
              productUnitId: i.productUnitId,
              productNameSnapshot: i.productName,
              unitNameSnapshot: i.unitName,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              subtotal: i.subtotal,
            })),
          },
          payment: {
            create: {
              method: paymentMethod,
              status: "PENDING",
              amount: totals.grandTotal,
            },
          },
          delivery: {
            create: {
              method: deliveryMethod,
              status: "PENDING",
              scheduledDate: scheduledDate || null,
              slotStart: slotStart || null,
              slotEnd: slotEnd || null,
            },
          },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: "PENDING_PAYMENT",
              changedBy: auth.user.id,
              note: "Pesanan berhasil dibuat oleh pelanggan",
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

      // 6. Clear user cart
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      // 7. Record audit event
      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "ORDER_CREATED",
          resourceType: "ORDER",
          resourceId: createdOrder.id,
          metadata: JSON.stringify({
            orderNumber: createdOrder.orderNumber,
            grandTotal: createdOrder.grandTotal,
            itemsCount: createdOrder.items.length,
          }),
        },
      });

      return createdOrder;
    });

    return apiSuccess(newOrder, undefined, 201);
  } catch (error: any) {
    return apiError("CHECKOUT_FAILED", error.message || "Gagal memproses pesanan", 400);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));
    const skip = (page - 1) * limit;

    // Strict BOLA/IDOR protection: only return authenticated user's orders
    const where: Prisma.OrderWhereInput = {
      userId: auth.user.id,
      ...(status ? { orderStatus: status } : {}),
    };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        include: {
          items: true,
          payment: true,
          delivery: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ]);

    return apiSuccess(orders, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil daftar pesanan", 500);
  }
}
