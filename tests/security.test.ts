import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import { requireRole, createToken } from "../src/lib/auth";
import { NextRequest } from "next/server";
import { GET as getOrderById } from "../src/app/api/v1/orders/[id]/route";
import { POST as cancelOrder } from "../src/app/api/v1/orders/[id]/cancel/route";
import { POST as adjustStock } from "../src/app/api/v1/admin/inventory/adjustments/route";
import { POST as updatePrice } from "../src/app/api/v1/admin/prices/route";
import { GET as getAuditLogs } from "../src/app/api/v1/admin/audit-logs/route";

export async function runSecurityTests() {
  console.log("\n--- Menjalankan tests/security.test.ts ---");
  const time = Date.now();

  // Setup Customer A and Customer B
  const customerA = await prisma.user.create({
    data: {
      email: `customerA.${time}@tokosaudara.id`,
      passwordHash: "dummyhash",
      role: "CUSTOMER",
      status: "ACTIVE",
      profile: { create: { name: "Customer A" } },
    },
  });

  const customerB = await prisma.user.create({
    data: {
      email: `customerB.${time}@tokosaudara.id`,
      passwordHash: "dummyhash",
      role: "CUSTOMER",
      status: "ACTIVE",
      profile: { create: { name: "Customer B" } },
    },
  });

  // Create an order belonging exclusively to Customer B
  const sampleUnit = await prisma.productUnit.findFirst({
    where: { isActive: true },
    include: { product: true },
  });
  assert.ok(sampleUnit, "Sample unit harus ada");

  const orderB = await prisma.order.create({
    data: {
      orderNumber: `ORD-SEC-${time}`,
      userId: customerB.id, // Owned by B
      addressSnapshot: JSON.stringify({ recipientName: "Customer B" }),
      subtotal: sampleUnit.price,
      grandTotal: sampleUnit.price,
      paymentStatus: "UNPAID",
      orderStatus: "PENDING_PAYMENT",
      items: {
        create: [
          {
            productId: sampleUnit.productId,
            productUnitId: sampleUnit.id,
            productNameSnapshot: sampleUnit.product.name,
            unitNameSnapshot: sampleUnit.unitName,
            unitPrice: sampleUnit.price,
            quantity: 1,
            subtotal: sampleUnit.price,
          },
        ],
      },
    },
  });

  // Generate tokens
  const tokenA = await createToken({
    userId: customerA.id,
    email: customerA.email,
    role: customerA.role,
  });

  const tokenB = await createToken({
    userId: customerB.id,
    email: customerB.email,
    role: customerB.role,
  });

  // 1. Test BOLA/IDOR Read Protection: Customer A tries to read Customer B's order
  console.log("  [TEST] BOLA/IDOR Read: Customer A membaca pesanan Customer B");
  const reqReadA = new NextRequest(`http://localhost:3000/api/v1/orders/${orderB.id}`, {
    headers: {
      authorization: `Bearer ${tokenA}`,
    },
  });

  const resReadA = await getOrderById(reqReadA, {
    params: Promise.resolve({ id: orderB.id }),
  });
  const jsonReadA = await resReadA.json();

  assert.equal(resReadA.status, 403, "Response harus 403 Forbidden");
  assert.equal(jsonReadA.error?.code, "FORBIDDEN", "Error code harus FORBIDDEN");

  // Verify Customer B can read their own order
  console.log("  [TEST] Authorized Read: Customer B membaca pesanannya sendiri");
  const reqReadB = new NextRequest(`http://localhost:3000/api/v1/orders/${orderB.id}`, {
    headers: {
      authorization: `Bearer ${tokenB}`,
    },
  });
  const resReadB = await getOrderById(reqReadB, {
    params: Promise.resolve({ id: orderB.id }),
  });
  assert.equal(resReadB.status, 200, "Customer B harus sukses membaca pesanannya");

  // 2. Test BOLA/IDOR State Change Protection: Customer A tries to CANCEL Customer B's order
  console.log("  [TEST] BOLA/IDOR Write: Customer A mencoba membatalkan pesanan Customer B");
  const reqCancelA = new NextRequest(
    `http://localhost:3000/api/v1/orders/${orderB.id}/cancel`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenA}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ reason: "Dibatalkan oleh hacker" }),
    }
  );

  const resCancelA = await cancelOrder(reqCancelA, {
    params: Promise.resolve({ id: orderB.id }),
  });
  const jsonCancelA = await resCancelA.json();

  assert.equal(resCancelA.status, 403, "Pembatalan oleh user lain harus 403 Forbidden");
  assert.equal(jsonCancelA.error?.code, "FORBIDDEN");

  // Verify Order B is still in original state
  const orderBCheck = await prisma.order.findUnique({ where: { id: orderB.id } });
  assert.equal(orderBCheck?.orderStatus, "PENDING_PAYMENT", "Status pesanan tidak boleh berubah");

  // 3. Test Privilege Escalation: Customer A tries to execute Admin Actions
  console.log("  [TEST] Privilege Escalation: Customer A mencoba aksi admin (Koreksi Stok)");
  const reqAdjustStock = new NextRequest(
    "http://localhost:3000/api/v1/admin/inventory/adjustments",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenA}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        productUnitId: sampleUnit.id,
        type: "ADJUSTMENT_IN",
        quantity: 100,
      }),
    }
  );

  const resAdjustStock = await adjustStock(reqAdjustStock);
  const jsonAdjustStock = await resAdjustStock.json();
  assert.equal(resAdjustStock.status, 403, "Customer dilarang melakukan aksi admin penyesuaian stok");
  assert.equal(jsonAdjustStock.error?.code, "FORBIDDEN");

  console.log("  [TEST] Privilege Escalation: Customer A mencoba mengubah harga produk");
  const reqUpdatePrice = new NextRequest(
    "http://localhost:3000/api/v1/admin/prices",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenA}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        productUnitId: sampleUnit.id,
        price: 500, // Client tries to lower price to 500
      }),
    }
  );

  const resUpdatePrice = await updatePrice(reqUpdatePrice);
  const jsonUpdatePrice = await resUpdatePrice.json();
  assert.equal(resUpdatePrice.status, 403, "Customer dilarang mengubah harga produk");
  assert.equal(jsonUpdatePrice.error?.code, "FORBIDDEN");

  // 4. Test Cashier Privileges & Audit Trail
  console.log("  [TEST] Otoritas Kasir: Kasir diizinkan mengubah harga & menambah stok");
  const cashierUser = await prisma.user.create({
    data: {
      email: `cashier.${time}@tokosaudara.id`,
      passwordHash: "dummyhash",
      role: "CASHIER",
      status: "ACTIVE",
      profile: { create: { name: "Kasir Uji Coba" } },
    },
  });

  const tokenCashier = await createToken({
    userId: cashierUser.id,
    email: cashierUser.email,
    role: cashierUser.role,
  });

  // Cashier updates price -> Should SUCCEED
  const reqCashierPrice = new NextRequest("http://localhost:3000/api/v1/admin/prices", {
    method: "POST",
    headers: {
      authorization: `Bearer ${tokenCashier}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      productUnitId: sampleUnit.id,
      price: 25000,
      note: "Harga disesuaikan kasir",
    }),
  });

  const resCashierPrice = await updatePrice(reqCashierPrice);
  assert.equal(resCashierPrice.status, 200, "Kasir harus diizinkan mengubah harga");

  // Cashier adjusts stock -> Should SUCCEED
  const reqCashierStock = new NextRequest(
    "http://localhost:3000/api/v1/admin/inventory/adjustments",
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${tokenCashier}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        productUnitId: sampleUnit.id,
        type: "ADJUSTMENT_IN",
        quantity: 10,
        note: "Barang masuk ditambahkan kasir",
      }),
    }
  );
  const resCashierStock = await adjustStock(reqCashierStock);
  assert.equal(resCashierStock.status, 200, "Kasir harus diizinkan menambah/menyesuaikan stok");

  // 5. Test Audit Log Protection & Visibility:
  // Cashier CANNOT view audit logs
  console.log("  [TEST] Log Akses Audit: Kasir dilarang melihat log aktivitas pemilik");
  const reqAuditCashier = new NextRequest("http://localhost:3000/api/v1/admin/audit-logs", {
    headers: { authorization: `Bearer ${tokenCashier}` },
  });
  const resAuditCashier = await getAuditLogs(reqAuditCashier);
  assert.equal(resAuditCashier.status, 403, "Kasir tidak boleh mengakses log audit pemilik");

  // Admin / Owner CAN view audit logs and sees cashier's actions
  console.log("  [TEST] Pemilik dapat memantau log aktivitas kasir");
  const adminOwner = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  assert.ok(adminOwner, "Admin owner harus ada di DB");
  const tokenOwner = await createToken({
    userId: adminOwner!.id,
    email: adminOwner!.email,
    role: adminOwner!.role,
  });

  const reqAuditOwner = new NextRequest("http://localhost:3000/api/v1/admin/audit-logs?actorRole=CASHIER", {
    headers: { authorization: `Bearer ${tokenOwner}` },
  });
  const resAuditOwner = await getAuditLogs(reqAuditOwner);
  const jsonAuditOwner = await resAuditOwner.json();
  assert.equal(resAuditOwner.status, 200, "Pemilik harus dapat melihat log aktivitas");
  assert.ok(Array.isArray(jsonAuditOwner.data), "Data log audit harus berupa array");

  // Verify that cashier's PRICE_CHANGE is recorded in audit trail
  const foundPriceLog = jsonAuditOwner.data.find(
    (l: any) => l.action === "PRICE_CHANGE" && l.actor.id === cashierUser.id
  );
  assert.ok(foundPriceLog, "Perubahan harga oleh kasir harus tercatat di log audit pemilik");

  // Cleanup test records
  await prisma.productUnit.update({
    where: { id: sampleUnit.id },
    data: { price: sampleUnit.price },
  });
  await prisma.auditEvent.deleteMany({ where: { actorUserId: cashierUser.id } });
  await prisma.user.delete({ where: { id: cashierUser.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: orderB.id } });
  await prisma.order.delete({ where: { id: orderB.id } });
  await prisma.user.delete({ where: { id: customerA.id } });
  await prisma.user.delete({ where: { id: customerB.id } });

  console.log("  ✓ Semua pengujian security.test.ts berhasil!");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  runSecurityTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
