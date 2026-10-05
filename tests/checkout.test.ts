import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import {
  isValidTransition,
  validateOrderTransition,
  generateOrderNumber,
} from "../src/lib/orders";
import { calculateOrderTotals } from "../src/lib/pricing";
import { recordInventoryMovement } from "../src/lib/inventory";

export async function runCheckoutTests() {
  console.log("\n--- Menjalankan tests/checkout.test.ts ---");

  // 1. Test Order State Machine Transitions
  console.log("  [TEST] Validasi State Machine Status Pesanan");

  // Valid transitions
  assert.equal(isValidTransition("PENDING_PAYMENT", "PAID"), true);
  assert.equal(isValidTransition("PENDING_PAYMENT", "CANCELLED"), true);
  assert.equal(isValidTransition("PAID", "PROCESSING"), true);
  assert.equal(isValidTransition("PROCESSING", "READY_FOR_PICKUP"), true);
  assert.equal(isValidTransition("READY_FOR_PICKUP", "OUT_FOR_DELIVERY"), true);
  assert.equal(isValidTransition("OUT_FOR_DELIVERY", "DELIVERED"), true);

  // Invalid transitions
  assert.equal(isValidTransition("PENDING_PAYMENT", "DELIVERED"), false, "Tidak boleh langsung lompat ke DELIVERED");
  assert.equal(isValidTransition("DELIVERED", "PROCESSING"), false, "DELIVERED adalah status terminal");
  assert.equal(isValidTransition("CANCELLED", "PAID"), false, "CANCELLED adalah status terminal");
  assert.equal(isValidTransition("OUT_FOR_DELIVERY", "PAID"), false, "Tidak boleh mundur ke PAID");

  assert.throws(
    () => validateOrderTransition("PENDING_PAYMENT", "DELIVERED"),
    /tidak valid/i,
    "Transisi ilegal harus melempar error"
  );

  // 2. Test Transaction-Safe Checkout Flow with Snapshots & Cart Clearing
  console.log("  [TEST] Alur transaksi checkout atomic (Snapshots & Pembersihan Keranjang)");

  // Setup test customer & cart
  const testUser = await prisma.user.create({
    data: {
      email: `checkout.test.${Date.now()}@tokosaudara.id`,
      passwordHash: "dummyhash",
      role: "CUSTOMER",
      profile: {
        create: { name: "Pelanggan Uji Checkout", phone: "081233334444" },
      },
    },
  });

  const unitCabai = await prisma.productUnit.findFirst({
    where: { unitName: { contains: "250 Gram" } },
    include: { product: true },
  });
  assert.ok(unitCabai, "Unit cabai harus ada di DB");

  const initialStock = unitCabai.stockQuantity;

  // Create user cart with 2 units of cabai
  const cart = await prisma.cart.create({
    data: {
      userId: testUser.id,
      items: {
        create: [
          {
            productUnitId: unitCabai.id,
            quantity: 2,
          },
        ],
      },
    },
    include: { items: true },
  });

  assert.equal(cart.items.length, 1, "Keranjang belanja harus memiliki 1 item");

  // Execute Atomic Checkout in Transaction
  const orderNumber = await generateOrderNumber(prisma);
  assert.ok(orderNumber.startsWith("ORD-"), "Nomor pesanan harus diawali ORD-");

  const addressSnapshot = JSON.stringify({
    recipientName: "Pelanggan Uji Checkout",
    phone: "081233334444",
    addressLine: "Jl. Dago No. 100",
    city: "Kota Bandung",
  });

  const createdOrder = await prisma.$transaction(async (tx) => {
    // 1. Calculate authoritative totals
    const totals = await calculateOrderTotals(
      [{ productUnitId: unitCabai.id, quantity: 2 }],
      null,
      null,
      tx
    );

    // 2. Deduct inventory
    for (const item of totals.items) {
      await recordInventoryMovement(
        {
          productUnitId: item.productUnitId,
          type: "SALE",
          quantity: item.quantity,
          referenceType: "ORDER",
          referenceId: orderNumber,
        },
        tx
      );
    }

    // 3. Create Order & Item Snapshots
    const order = await tx.order.create({
      data: {
        orderNumber,
        userId: testUser.id,
        addressSnapshot,
        subtotal: totals.subtotal,
        discountTotal: 0,
        shippingFee: 0,
        grandTotal: totals.grandTotal,
        paymentStatus: "UNPAID",
        orderStatus: "PENDING_PAYMENT",
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
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "PENDING_PAYMENT",
            changedBy: testUser.id,
            note: "Pesanan dibuat",
          },
        },
      },
      include: { items: true, statusHistory: true },
    });

    // 4. Clear user cart
    await tx.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return order;
  });

  // Assertions for Checkout
  console.log("  [TEST] Verifikasi Order Item Snapshots");
  assert.equal(createdOrder.items.length, 1);
  const orderItem = createdOrder.items[0];
  assert.equal(orderItem.productNameSnapshot, unitCabai.product.name, "Nama produk harus disnapshot");
  assert.equal(orderItem.unitNameSnapshot, unitCabai.unitName, "Nama unit harus disnapshot");
  assert.equal(orderItem.unitPrice, unitCabai.price, "Harga satuan harus disnapshot");
  assert.equal(orderItem.quantity, 2);
  assert.equal(orderItem.subtotal, unitCabai.price * 2);

  console.log("  [TEST] Verifikasi Pengosongan Keranjang (Cart Clearing)");
  const remainingCartItems = await prisma.cartItem.count({ where: { cartId: cart.id } });
  assert.equal(remainingCartItems, 0, "Keranjang belanja harus kosong setelah checkout sukses");

  console.log("  [TEST] Verifikasi Pengurangan Stok Fisik");
  const unitAfterOrder = await prisma.productUnit.findUnique({ where: { id: unitCabai.id } });
  assert.equal(
    unitAfterOrder?.stockQuantity,
    initialStock - 2,
    "Stok harus berkurang sesuai kuantitas order (2)"
  );

  // Cleanup test order and test customer
  await prisma.inventoryMovement.deleteMany({ where: { referenceId: orderNumber } });
  await prisma.orderStatusHistory.deleteMany({ where: { orderId: createdOrder.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: createdOrder.id } });
  await prisma.order.delete({ where: { id: createdOrder.id } });
  await prisma.cart.delete({ where: { id: cart.id } });
  await prisma.user.delete({ where: { id: testUser.id } });

  // Restore unit stock
  await prisma.productUnit.update({
    where: { id: unitCabai.id },
    data: { stockQuantity: initialStock },
  });

  console.log("  ✓ Semua pengujian checkout.test.ts berhasil!");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  runCheckoutTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
