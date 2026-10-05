import prisma from "@/lib/db";

export interface ExpenseRecord {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  recordedBy?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface PurchaseItemInput {
  productUnitId: string;
  quantity: number;
  costPrice: number;
}

export interface PurchaseRecord {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  invoiceNumber?: string | null;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  notes?: string | null;
  purchaseDate: string;
  createdAt: string;
  items?: Array<{
    id: string;
    productUnitId: string;
    productName: string;
    unitName: string;
    quantity: number;
    costPrice: number;
    subtotal: number;
  }>;
}

let isInitialized = false;

/**
 * Ensure Expense and SupplierPurchase tables exist in SQLite database.
 * Runs once on application start.
 */
export async function ensureAccountingTables() {
  if (isInitialized) return;

  try {
    // 1. Create Expense table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Expense" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "category" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "amount" REAL NOT NULL,
        "expenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "recordedBy" TEXT,
        "notes" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create SupplierPurchase table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupplierPurchase" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseNumber" TEXT NOT NULL UNIQUE,
        "supplierName" TEXT NOT NULL,
        "invoiceNumber" TEXT,
        "totalAmount" REAL NOT NULL,
        "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "notes" TEXT,
        "purchaseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Create SupplierPurchaseItem table if not exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SupplierPurchaseItem" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "purchaseId" TEXT NOT NULL,
        "productUnitId" TEXT NOT NULL,
        "quantity" REAL NOT NULL,
        "costPrice" REAL NOT NULL,
        "subtotal" REAL NOT NULL
      );
    `);

    // 4. Ensure Order table has additional accounting & pos fields
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "customerName" TEXT;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "customerPhone" TEXT;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "orderType" TEXT DEFAULT 'ONLINE';`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "cashTendered" REAL;`);
    } catch {}
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN "changeReturned" REAL;`);
    } catch {}

    isInitialized = true;
  } catch (err) {
    console.error("Failed to ensure accounting tables:", err);
  }
}

/**
 * Record an operational expense (listrik, kemasan, sewa, bensin, dll)
 */
export async function createExpense(data: {
  category: string;
  description: string;
  amount: number;
  expenseDate?: string;
  paymentMethod?: string;
  recordedBy?: string;
  notes?: string;
}) {
  await ensureAccountingTables();
  const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const date = data.expenseDate ? new Date(data.expenseDate).toISOString() : new Date().toISOString();
  const method = data.paymentMethod || "CASH";

  await prisma.$executeRawUnsafe(
    `INSERT INTO "Expense" ("id", "category", "description", "amount", "expenseDate", "paymentMethod", "recordedBy", "notes", "createdAt", "updatedAt")
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    id,
    data.category,
    data.description,
    data.amount,
    date,
    method,
    data.recordedBy || null,
    data.notes || null
  );

  return { id, ...data, expenseDate: date, paymentMethod: method };
}

/**
 * Get all expenses with optional month/year filter
 */
export async function getExpenses(options?: {
  month?: number; // 1 - 12
  year?: number;
  category?: string;
  limit?: number;
}) {
  await ensureAccountingTables();
  let query = `SELECT * FROM "Expense" WHERE 1=1`;
  const params: any[] = [];

  if (options?.category) {
    query += ` AND "category" = ?`;
    params.push(options.category);
  }

  query += ` ORDER BY "expenseDate" DESC`;

  if (options?.limit) {
    query += ` LIMIT ?`;
    params.push(options.limit);
  }

  const rows = (await prisma.$queryRawUnsafe(query, ...params)) as any[];

  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    amount: Number(r.amount),
    expenseDate: typeof r.expenseDate === "string" ? r.expenseDate : new Date(r.expenseDate).toISOString(),
    paymentMethod: r.paymentMethod,
    recordedBy: r.recordedBy,
    notes: r.notes,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date(r.createdAt).toISOString(),
  }));
}

/**
 * Delete expense
 */
export async function deleteExpense(id: string) {
  await ensureAccountingTables();
  await prisma.$executeRawUnsafe(`DELETE FROM "Expense" WHERE "id" = ?`, id);
  return { success: true };
}

/**
 * Record a restock/supplier purchase (kulakan)
 * Automatically updates product unit stock and creates inventory movement
 */
export async function createSupplierPurchase(data: {
  supplierName: string;
  invoiceNumber?: string;
  paymentMethod?: string;
  notes?: string;
  purchaseDate?: string;
  items: Array<{
    productUnitId: string;
    quantity: number;
    costPrice: number;
  }>;
  recordedBy?: string;
}) {
  await ensureAccountingTables();

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  const purchaseNumber = `PO-${dateStr}-${rand}`;
  const purchaseId = `po_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const date = data.purchaseDate ? new Date(data.purchaseDate).toISOString() : new Date().toISOString();
  const method = data.paymentMethod || "CASH";

  let totalAmount = 0;
  for (const it of data.items) {
    totalAmount += it.quantity * it.costPrice;
  }

  // 1. Insert SupplierPurchase
  await prisma.$executeRawUnsafe(
    `INSERT INTO "SupplierPurchase" ("id", "purchaseNumber", "supplierName", "invoiceNumber", "totalAmount", "paymentStatus", "paymentMethod", "notes", "purchaseDate", "createdAt")
     VALUES (?, ?, ?, ?, ?, 'PAID', ?, ?, ?, CURRENT_TIMESTAMP)`,
    purchaseId,
    purchaseNumber,
    data.supplierName,
    data.invoiceNumber || null,
    totalAmount,
    method,
    data.notes || null,
    date
  );

  // 2. Insert items & update product unit stock & inventory ledger
  for (const it of data.items) {
    const itemId = `poi_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const subtotal = it.quantity * it.costPrice;

    await prisma.$executeRawUnsafe(
      `INSERT INTO "SupplierPurchaseItem" ("id", "purchaseId", "productUnitId", "quantity", "costPrice", "subtotal")
       VALUES (?, ?, ?, ?, ?, ?)`,
      itemId,
      purchaseId,
      it.productUnitId,
      it.quantity,
      it.costPrice,
      subtotal
    );

    // Update stock quantity and cost price
    await prisma.productUnit.update({
      where: { id: it.productUnitId },
      data: {
        stockQuantity: { increment: it.quantity },
        costPrice: it.costPrice,
      },
    });

    // Record inventory ledger
    await prisma.inventoryMovement.create({
      data: {
        productUnitId: it.productUnitId,
        type: "PURCHASE",
        quantityDelta: it.quantity,
        referenceType: "SUPPLIER_PURCHASE",
        referenceId: purchaseNumber,
        note: `Kulakan dari ${data.supplierName} (${it.quantity} unit @ Rp ${it.costPrice.toLocaleString("id-ID")})`,
        createdBy: data.recordedBy || null,
      },
    });
  }

  // Create audit event for owner monitoring
  try {
    const actorUser = data.recordedBy
      ? await prisma.user.findFirst({
          where: {
            OR: [{ email: data.recordedBy }, { id: data.recordedBy }],
          },
          include: { profile: true },
        })
      : null;

    await prisma.auditEvent.create({
      data: {
        actorUserId: actorUser?.id || null,
        action: "STOCK_ADJUSTMENT",
        resourceType: "SUPPLIER_PURCHASE",
        resourceId: purchaseId,
        metadata: JSON.stringify({
          purchaseNumber,
          supplierName: data.supplierName,
          totalAmount,
          itemsCount: data.items.length,
          actorEmail: actorUser?.email || data.recordedBy,
          actorRole: actorUser?.role || "CASHIER",
          actorName: actorUser?.profile?.name || data.recordedBy || "Petugas Kasir",
        }),
      },
    });
  } catch {}

  return {
    id: purchaseId,
    purchaseNumber,
    supplierName: data.supplierName,
    totalAmount,
    itemsCount: data.items.length,
  };
}

/**
 * Get supplier purchases list
 */
export async function getSupplierPurchases(limit = 50) {
  await ensureAccountingTables();
  const purchases = (await prisma.$queryRawUnsafe(
    `SELECT * FROM "SupplierPurchase" ORDER BY "purchaseDate" DESC LIMIT ?`,
    limit
  )) as any[];

  const result: PurchaseRecord[] = [];
  for (const p of purchases) {
    const items = (await prisma.$queryRawUnsafe(
      `SELECT pi.*, pu.unitName, p.name as productName
       FROM "SupplierPurchaseItem" pi
       JOIN "ProductUnit" pu ON pi.productUnitId = pu.id
       JOIN "Product" p ON pu.productId = p.id
       WHERE pi.purchaseId = ?`,
      p.id
    )) as any[];

    result.push({
      id: p.id,
      purchaseNumber: p.purchaseNumber,
      supplierName: p.supplierName,
      invoiceNumber: p.invoiceNumber,
      totalAmount: Number(p.totalAmount),
      paymentStatus: p.paymentStatus,
      paymentMethod: p.paymentMethod,
      notes: p.notes,
      purchaseDate: typeof p.purchaseDate === "string" ? p.purchaseDate : new Date(p.purchaseDate).toISOString(),
      createdAt: typeof p.createdAt === "string" ? p.createdAt : new Date(p.createdAt).toISOString(),
      items: items.map((it) => ({
        id: it.id,
        productUnitId: it.productUnitId,
        productName: it.productName,
        unitName: it.unitName,
        quantity: Number(it.quantity),
        costPrice: Number(it.costPrice),
        subtotal: Number(it.subtotal),
      })),
    });
  }

  return result;
}

/**
 * Comprehensive financial and sales aggregation:
 * - Daily sales & metrics (penjualan per hari)
 * - Monthly sales & metrics (penjualan per bulan)
 * - Purchases / Restock totals (pembelian)
 * - Operational expenses totals (pengeluaran)
 * - Net profit calculation (Laba rugi: Omzet - Kulakan - Pengeluaran)
 */
export async function getComprehensiveFinance() {
  await ensureAccountingTables();

  // 1. Fetch all orders (excluding CANCELLED)
  const orders = await prisma.order.findMany({
    where: {
      orderStatus: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      payment: true,
    },
  });

  // 2. Fetch all expenses
  const expenses = await getExpenses({ limit: 1000 });

  // 3. Fetch all supplier purchases
  const purchases = await getSupplierPurchases(1000);

  // Group sales per day
  const dailyMap: Record<
    string,
    {
      date: string;
      revenue: number;
      orderCount: number;
      discountTotal: number;
      shippingTotal: number;
      itemCount: number;
      onlineCount: number;
      posCount: number;
    }
  > = {};

  // Group sales per month
  const monthlyMap: Record<
    string,
    {
      monthKey: string; // e.g. "2026-10"
      monthName: string; // e.g. "Oktober 2026"
      revenue: number;
      orderCount: number;
      purchasesTotal: number;
      expensesTotal: number;
      netProfit: number;
    }
  > = {};

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  let totalRevenueAllTime = 0;
  let totalOrdersAllTime = orders.length;

  for (const order of orders) {
    const d = new Date(order.createdAt);
    const dateKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
    const monthName = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    totalRevenueAllTime += order.grandTotal;

    // Daily
    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = {
        date: dateKey,
        revenue: 0,
        orderCount: 0,
        discountTotal: 0,
        shippingTotal: 0,
        itemCount: 0,
        onlineCount: 0,
        posCount: 0,
      };
    }
    dailyMap[dateKey].revenue += order.grandTotal;
    dailyMap[dateKey].orderCount += 1;
    dailyMap[dateKey].discountTotal += order.discountTotal || 0;
    dailyMap[dateKey].shippingTotal += order.shippingFee || 0;
    dailyMap[dateKey].itemCount += order.items.reduce((s, it) => s + it.quantity, 0);

    const isPos = (order as any).orderType === "POS_OFFLINE";
    if (isPos) dailyMap[dateKey].posCount += 1;
    else dailyMap[dateKey].onlineCount += 1;

    // Monthly
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        monthKey,
        monthName,
        revenue: 0,
        orderCount: 0,
        purchasesTotal: 0,
        expensesTotal: 0,
        netProfit: 0,
      };
    }
    monthlyMap[monthKey].revenue += order.grandTotal;
    monthlyMap[monthKey].orderCount += 1;
  }

  // Aggregate Purchases into monthly
  let totalPurchasesAllTime = 0;
  for (const p of purchases) {
    totalPurchasesAllTime += p.totalAmount;
    const d = new Date(p.purchaseDate);
    const monthKey = d.toISOString().slice(0, 7);
    const monthName = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        monthKey,
        monthName,
        revenue: 0,
        orderCount: 0,
        purchasesTotal: 0,
        expensesTotal: 0,
        netProfit: 0,
      };
    }
    monthlyMap[monthKey].purchasesTotal += p.totalAmount;
  }

  // Aggregate Expenses into monthly
  let totalExpensesAllTime = 0;
  for (const e of expenses) {
    totalExpensesAllTime += e.amount;
    const d = new Date(e.expenseDate);
    const monthKey = d.toISOString().slice(0, 7);
    const monthName = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        monthKey,
        monthName,
        revenue: 0,
        orderCount: 0,
        purchasesTotal: 0,
        expensesTotal: 0,
        netProfit: 0,
      };
    }
    monthlyMap[monthKey].expensesTotal += e.amount;
  }

  // Calculate net profit for each month
  for (const k of Object.keys(monthlyMap)) {
    monthlyMap[k].netProfit =
      monthlyMap[k].revenue - monthlyMap[k].purchasesTotal - monthlyMap[k].expensesTotal;
  }

  // Sort daily list descending
  const dailyList = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

  // Sort monthly list descending
  const monthlyList = Object.values(monthlyMap).sort((a, b) => b.monthKey.localeCompare(a.monthKey));

  // Today metrics
  const todayKey = new Date().toISOString().slice(0, 10);
  const currentMonthKey = new Date().toISOString().slice(0, 7);
  const todayData = dailyMap[todayKey] || {
    date: todayKey,
    revenue: 0,
    orderCount: 0,
    discountTotal: 0,
    shippingTotal: 0,
    itemCount: 0,
    onlineCount: 0,
    posCount: 0,
  };

  const currentMonthData = monthlyMap[currentMonthKey] || {
    monthKey: currentMonthKey,
    monthName: `${MONTH_NAMES[new Date().getMonth()]} ${new Date().getFullYear()}`,
    revenue: 0,
    orderCount: 0,
    purchasesTotal: 0,
    expensesTotal: 0,
    netProfit: 0,
  };

  // Today purchases & expenses
  const todayPurchases = purchases
    .filter((p) => p.purchaseDate.slice(0, 10) === todayKey)
    .reduce((s, p) => s + p.totalAmount, 0);

  const todayExpenses = expenses
    .filter((e) => e.expenseDate.slice(0, 10) === todayKey)
    .reduce((s, e) => s + e.amount, 0);

  const todayNetProfit = todayData.revenue - todayPurchases - todayExpenses;

  return {
    today: {
      revenue: todayData.revenue,
      orderCount: todayData.orderCount,
      purchases: todayPurchases,
      expenses: todayExpenses,
      netProfit: todayNetProfit,
    },
    currentMonth: currentMonthData,
    allTime: {
      revenue: totalRevenueAllTime,
      orders: totalOrdersAllTime,
      purchases: totalPurchasesAllTime,
      expenses: totalExpensesAllTime,
      netProfit: totalRevenueAllTime - totalPurchasesAllTime - totalExpensesAllTime,
    },
    dailyList,
    monthlyList,
    recentPurchases: purchases.slice(0, 10),
    recentExpenses: expenses.slice(0, 10),
  };
}
