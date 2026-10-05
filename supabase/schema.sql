-- ===============================================================
-- TOKO SAUDARA — SUPABASE POSTGRESQL INITIAL SCHEMA & MIGRATION
-- Dari Pasar ke Rumah (Online Grocery & Fresh Produce)
-- ===============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users & Profiles
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "email" TEXT UNIQUE NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER', -- CUSTOMER, ADMIN, COURIER
    "status" TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, DISABLED
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CustomerProfile" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Address" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "label" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catalog & Commodities
CREATE TABLE IF NOT EXISTS "Category" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "Product" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "categoryId" TEXT NOT NULL REFERENCES "Category"("id"),
    "sku" TEXT UNIQUE NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFresh" BOOLEAN NOT NULL DEFAULT false,
    "harvestInfo" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProductUnit" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "unitName" TEXT NOT NULL,
    "unitCode" TEXT NOT NULL,
    "quantityValue" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "quantityUnit" TEXT NOT NULL DEFAULT 'kg',
    "price" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION,
    "stockQuantity" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "lowStockThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "PriceHistory" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id") ON DELETE CASCADE,
    "price" DOUBLE PRECISION NOT NULL,
    "validFrom" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP WITH TIME ZONE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "InventoryMovement" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id") ON DELETE CASCADE,
    "type" TEXT NOT NULL, -- PURCHASE, SALE, RESERVATION, RELEASE, ADJUSTMENT_IN, ADJUSTMENT_OUT, DAMAGE, RETURN
    "quantityDelta" DOUBLE PRECISION NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "note" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Shopping Cart
CREATE TABLE IF NOT EXISTS "Cart" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "userId" TEXT UNIQUE NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "cartId" TEXT NOT NULL REFERENCES "Cart"("id") ON DELETE CASCADE,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id") ON DELETE CASCADE,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("cartId", "productUnitId")
);

-- 4. Orders & Fulfillment
CREATE TABLE IF NOT EXISTS "Order" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "orderNumber" TEXT UNIQUE NOT NULL,
    "userId" TEXT REFERENCES "User"("id"),
    "customerName" TEXT,
    "customerPhone" TEXT,
    "addressSnapshot" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "discountTotal" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "grandTotal" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID', -- UNPAID, PAID, FAILED, REFUNDED
    "orderStatus" TEXT NOT NULL DEFAULT 'PENDING_PAYMENT',
    "orderType" TEXT NOT NULL DEFAULT 'ONLINE', -- ONLINE, POS_OFFLINE
    "cashTendered" DOUBLE PRECISION,
    "changeReturned" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL,
    "productUnitId" TEXT NOT NULL,
    "productNameSnapshot" TEXT NOT NULL,
    "unitNameSnapshot" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS "OrderStatusHistory" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "changedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "orderId" TEXT UNIQUE NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "providerReference" TEXT,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Delivery" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "orderId" TEXT UNIQUE NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "method" TEXT NOT NULL DEFAULT 'KURIR_TOKO',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledDate" TEXT,
    "slotStart" TEXT,
    "slotEnd" TEXT,
    "courierId" TEXT,
    "trackingNote" TEXT
);

CREATE TABLE IF NOT EXISTS "DeliveryArea" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 10000.0,
    "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 50000.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- 5. Promotions & Item-specific Discounts
CREATE TABLE IF NOT EXISTS "Promotion" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT UNIQUE NOT NULL,
    "type" TEXT NOT NULL, -- PERCENTAGE, FIXED
    "value" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "maxDiscount" DOUBLE PRECISION,
    "scope" TEXT NOT NULL DEFAULT 'ALL', -- ALL, SPECIFIC_ITEMS
    "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP WITH TIME ZONE,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "PromotionItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "promotionId" TEXT NOT NULL REFERENCES "Promotion"("id") ON DELETE CASCADE,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id") ON DELETE CASCADE,
    "discountType" TEXT NOT NULL DEFAULT 'FIXED', -- FIXED, PERCENTAGE
    "discountValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bundles
CREATE TABLE IF NOT EXISTS "Bundle" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "bundlePrice" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "BundleItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "bundleId" TEXT NOT NULL REFERENCES "Bundle"("id") ON DELETE CASCADE,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id"),
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1.0
);

-- 7. Audit & Expenses & Supplier Purchases
CREATE TABLE IF NOT EXISTS "AuditEvent" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "actorUserId" TEXT REFERENCES "User"("id"),
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Expense" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expenseDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "recordedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SupplierPurchase" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "purchaseNumber" TEXT UNIQUE NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "notes" TEXT,
    "purchaseDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "SupplierPurchaseItem" (
    "id" TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    "purchaseId" TEXT NOT NULL REFERENCES "SupplierPurchase"("id") ON DELETE CASCADE,
    "productUnitId" TEXT NOT NULL REFERENCES "ProductUnit"("id"),
    "quantity" DOUBLE PRECISION NOT NULL,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL
);

-- Indexes for maximum performance
CREATE INDEX IF NOT EXISTS "idx_product_category" ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_product_unit_product" ON "ProductUnit"("productId", "isActive");
CREATE INDEX IF NOT EXISTS "idx_order_user" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "Order"("orderStatus", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_inventory_unit" ON "InventoryMovement"("productUnitId", "createdAt");
CREATE INDEX IF NOT EXISTS "idx_expense_date" ON "Expense"("expenseDate");
CREATE INDEX IF NOT EXISTS "idx_purchase_date" ON "SupplierPurchase"("purchaseDate");
