import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import { recordInventoryMovement } from "../src/lib/inventory";

export async function runInventoryTests() {
  console.log("\n--- Menjalankan tests/inventory.test.ts ---");

  // Create temporary test product & unit for safe testing
  const category = await prisma.category.findFirst();
  assert.ok(category, "Kategori harus ada di DB");

  const testProduct = await prisma.product.create({
    data: {
      categoryId: category.id,
      sku: `TEST-INV-${Date.now().toString().slice(-6)}`,
      name: "Uji Coba Inventori Bayam",
      slug: `uji-coba-inventori-${Date.now()}`,
      isActive: true,
      units: {
        create: {
          unitName: "1 Ikat Uji Coba",
          unitCode: "ikat",
          price: 4000,
          costPrice: 2500,
          stockQuantity: 10,
          lowStockThreshold: 5,
          isActive: true,
        },
      },
    },
    include: { units: true },
  });

  const unit = testProduct.units[0];
  assert.ok(unit, "Unit produk uji coba harus terbuat");
  assert.equal(unit.stockQuantity, 10, "Stok awal harus 10");

  // 1. Test PURCHASE (Supplier/Petani Restock -> Stock Increases)
  console.log("  [TEST] Pencatatan mutasi PURCHASE (+ stok)");
  const purchaseRes = await recordInventoryMovement({
    productUnitId: unit.id,
    type: "PURCHASE",
    quantity: 15,
    referenceType: "PETANI_LEMBANG",
    note: "Pasokan subuh dari petani Lembang",
    createdBy: "test_admin",
  });

  assert.equal(purchaseRes.previousStock, 10);
  assert.equal(purchaseRes.newStock, 25, "Stok setelah PURCHASE 15 harus 25 (10 + 15)");
  assert.equal(purchaseRes.movement.type, "PURCHASE");
  assert.equal(purchaseRes.movement.quantityDelta, 15);

  // 2. Test SALE (Order Fulfillment -> Stock Decreases)
  console.log("  [TEST] Pencatatan mutasi SALE (- stok)");
  const saleRes = await recordInventoryMovement({
    productUnitId: unit.id,
    type: "SALE",
    quantity: 5,
    referenceType: "ORDER",
    referenceId: "ORD-TEST-001",
    note: "Penjualan pesanan pelanggan",
  });

  assert.equal(saleRes.previousStock, 25);
  assert.equal(saleRes.newStock, 20, "Stok setelah SALE 5 harus 20 (25 - 5)");
  assert.equal(saleRes.movement.quantityDelta, -5);

  // 3. Test ADJUSTMENT_IN (Koreksi Tambah Opname Fisik)
  console.log("  [TEST] Pencatatan mutasi ADJUSTMENT_IN (+ stok)");
  const adjInRes = await recordInventoryMovement({
    productUnitId: unit.id,
    type: "ADJUSTMENT_IN",
    quantity: 2,
    note: "Koreksi lebih hitung stok pagi",
  });

  assert.equal(adjInRes.newStock, 22, "Stok setelah koreksi tambah 2 harus 22 (20 + 2)");
  assert.equal(adjInRes.movement.quantityDelta, 2);

  // 4. Test DAMAGE (Sayur Busuk / Sortiran Sore -> Stock Decreases)
  console.log("  [TEST] Pencatatan mutasi DAMAGE (- stok)");
  const damageRes = await recordInventoryMovement({
    productUnitId: unit.id,
    type: "DAMAGE",
    quantity: 3,
    note: "Sayur layu sortiran sore hari",
  });

  assert.equal(damageRes.newStock, 19, "Stok setelah barang rusak 3 harus 19 (22 - 3)");
  assert.equal(damageRes.movement.quantityDelta, -3);

  // 5. Test Negative Stock Prevention
  console.log("  [TEST] Pencegahan stok negatif (deduct lebih dari stok tersedia)");
  await assert.rejects(
    async () => {
      // Current stock is 19. Trying to deduct 30
      await recordInventoryMovement({
        productUnitId: unit.id,
        type: "DAMAGE",
        quantity: 30,
        note: "Percobaan pengurangan melebihi sisa stok",
      });
    },
    (err: any) => {
      return /Stok tidak mencukupi/i.test(err.message);
    },
    "Pengurangan melebihi stok harus melempar error 'Stok tidak mencukupi'"
  );

  // Verify stock was not changed after failed deduction
  const unitAfterFailed = await prisma.productUnit.findUnique({ where: { id: unit.id } });
  assert.equal(unitAfterFailed?.stockQuantity, 19, "Stok tidak boleh berubah setelah gagal transaksi");

  // 6. Test Stock Threshold Alert Logic
  console.log("  [TEST] Logika peringatan ambang batas stok menipis (lowStockThreshold)");
  // Deduct 15 so stock becomes 4 (< threshold 5)
  const lowStockRes = await recordInventoryMovement({
    productUnitId: unit.id,
    type: "SALE",
    quantity: 15,
    note: "Penjualan borongan sisa 4",
  });
  assert.equal(lowStockRes.newStock, 4);

  // Check alert query
  const lowStockUnits = await prisma.productUnit.findMany({
    where: {
      id: unit.id,
      stockQuantity: { lte: unit.lowStockThreshold },
    },
  });
  assert.equal(lowStockUnits.length, 1, "Unit harus terdeteksi dalam query stok menipis");
  assert.ok(lowStockUnits[0].stockQuantity <= lowStockUnits[0].lowStockThreshold);

  // Cleanup test product and ledger entries
  await prisma.inventoryMovement.deleteMany({ where: { productUnitId: unit.id } });
  await prisma.productUnit.deleteMany({ where: { productId: testProduct.id } });
  await prisma.product.delete({ where: { id: testProduct.id } });

  console.log("  ✓ Semua pengujian inventory.test.ts berhasil!");
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`) {
  runInventoryTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
