import assert from "node:assert/strict";
import prisma from "../src/lib/db";
import {
  createExpense,
  getExpenses,
  createSupplierPurchase,
  getSupplierPurchases,
  getComprehensiveFinance,
  ensureAccountingTables,
} from "../src/lib/accounting";

export async function runAccountingPosTests() {
  console.log("\n--- Menjalankan tests/accounting-pos.test.ts ---");

  await ensureAccountingTables();

  // 1. Test createExpense & getExpenses
  console.log("  [TEST] Pencatatan pengeluaran operasional (Expense)");
  const expense = await createExpense({
    category: "KEMASAN",
    description: "Kantong plastik kresek ramah lingkungan 10 pak",
    amount: 85000,
    paymentMethod: "CASH",
    notes: "Toko Plastik Barokah",
  });
  assert.ok(expense.id, "ID pengeluaran harus terbentuk");
  assert.equal(expense.amount, 85000);
  assert.equal(expense.category, "KEMASAN");

  const expensesList = await getExpenses({ limit: 10 });
  assert.ok(expensesList.length > 0, "Daftar pengeluaran harus memiliki data");
  const foundExpense = expensesList.find((e) => e.id === expense.id);
  assert.ok(foundExpense, "Pengeluaran yang baru dibuat harus ditemukan");
  assert.equal(foundExpense.amount, 85000);

  // 2. Test createSupplierPurchase & stock increment
  console.log("  [TEST] Pencatatan pembelian kulakan (SupplierPurchase) & penambahan stok gudang");
  const testUnit = await prisma.productUnit.findFirst({
    where: { isActive: true },
  });
  assert.ok(testUnit, "ProductUnit harus tersedia untuk pengujian");

  const initialStock = testUnit.stockQuantity;
  const purchaseQuantity = 25;
  const purchaseCostPrice = 3000;

  const purchase = await createSupplierPurchase({
    supplierName: "Petani Sayur Lembang Sejahtera",
    invoiceNumber: "INV-LMB-9901",
    paymentMethod: "CASH",
    notes: "Sayuran segar panen subuh",
    items: [
      {
        productUnitId: testUnit.id,
        quantity: purchaseQuantity,
        costPrice: purchaseCostPrice,
      },
    ],
  });

  assert.ok(purchase.id, "ID pembelian kulakan harus terbentuk");
  assert.equal(purchase.totalAmount, purchaseQuantity * purchaseCostPrice);

  // Verify stock increased
  const updatedUnit = await prisma.productUnit.findUnique({
    where: { id: testUnit.id },
  });
  assert.ok(updatedUnit, "ProductUnit harus ditemukan");
  assert.equal(
    updatedUnit.stockQuantity,
    initialStock + purchaseQuantity,
    "Stok gudang harus bertambah setelah kulakan dicatat"
  );

  // Verify inventory ledger
  const movement = await prisma.inventoryMovement.findFirst({
    where: {
      productUnitId: testUnit.id,
      referenceType: "SUPPLIER_PURCHASE",
    },
    orderBy: { createdAt: "desc" },
  });
  assert.ok(movement, "Mutasi inventori PURCHASE harus tercatat di ledger");
  assert.equal(movement.type, "PURCHASE");
  assert.equal(movement.quantityDelta, purchaseQuantity);

  // 3. Test comprehensive finance aggregation (daily & monthly sales)
  console.log("  [TEST] Akumulasi penjualan per hari & per bulan, serta perhitungan Laba Rugi");
  const finance = await getComprehensiveFinance();

  assert.ok(finance.today, "Data hari ini harus ada");
  assert.ok(finance.currentMonth, "Data bulan ini harus ada");
  assert.ok(Array.isArray(finance.dailyList), "dailyList harus berupa array");
  assert.ok(Array.isArray(finance.monthlyList), "monthlyList harus berupa array");

  // Verify net profit calculation formula
  const calculatedMonthProfit =
    finance.currentMonth.revenue -
    finance.currentMonth.purchasesTotal -
    finance.currentMonth.expensesTotal;
  assert.equal(
    finance.currentMonth.netProfit,
    calculatedMonthProfit,
    "Perhitungan laba bersih bulanan (Omzet - Kulakan - Pengeluaran) harus presisi"
  );

  console.log("  ✓ Semua pengujian accounting-pos.test.ts berhasil!");
}

if (require.main === module) {
  runAccountingPosTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
