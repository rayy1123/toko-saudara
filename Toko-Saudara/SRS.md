# Toko Saudara — Software Requirements Specification

## 1. Functional Requirements

### FR-AUTH
- Register customer.
- Login/logout.
- Session management.
- Password hashing.
- Role-based authorization.
- Account status: ACTIVE, SUSPENDED, DISABLED.

### FR-CATALOG
- CRUD category.
- CRUD product.
- Product SKU unique.
- Product slug unique.
- Product image.
- Product active/inactive.
- Multiple product units.
- Search/filter/sort/pagination.

### FR-UNIT
Satuan mendukung:
- gram;
- kilogram;
- milliliter;
- liter;
- pcs;
- botol;
- ikat;
- rak;
- custom.

Quantity harus mendukung decimal untuk produk timbang.

### FR-PRICING
- Harga aktif.
- Riwayat harga.
- Harga berdasarkan periode.
- Harga order disnapshot saat order dibuat.
- Server menghitung subtotal dan total.

### FR-INVENTORY
- Stok per product unit.
- Stock ledger.
- Adjustment.
- Reservation/release bila diperlukan.
- Low-stock threshold.
- Pencegahan negative stock.
- Transaction dan row locking untuk race condition.

### FR-CART
- Satu active cart/customer.
- Add/update/remove item.
- Revalidate product, price, dan stock ketika checkout.

### FR-ORDER
- Preview checkout.
- Create order.
- Order items snapshot.
- Status history.
- Cancel sesuai aturan.
- Customer order history.
- Admin order management.

### FR-PAYMENT
MVP:
- COD.
- Manual bank transfer.

Future:
- payment gateway.

### FR-DELIVERY
- Delivery area.
- Shipping fee.
- Delivery slot.
- Courier assignment.
- Delivery status.

### FR-PROMOTION
- Voucher/code.
- Minimum order.
- Fixed discount atau percentage.
- Maximum discount.
- Validity period.
- Active/inactive.

### FR-BUNDLE
- Bundle product.
- Bundle items.
- Bundle price.
- Stock validation untuk item bundle.

### FR-REPORT
- Revenue.
- Orders.
- Average order value.
- Best-selling products.
- Low stock.
- Sales by period.

## 2. Non-Functional Requirements

### Performance
- Target API p95 < 500ms untuk endpoint normal tanpa external provider.
- Pagination wajib untuk collection besar.

### Security
- Server-side authorization.
- Input validation.
- Rate limiting.
- Secure cookies/session.
- Audit events.
- Protection terhadap OWASP common risks.

### Reliability
- Transaction untuk checkout.
- Idempotency untuk operasi yang berpotensi retry.
- Backup database.

### Maintainability
- TypeScript strict.
- Modular architecture.
- Unit/integration/E2E tests.
- Lint dan typecheck pada CI.

### Observability
- Structured logs.
- Request ID.
- Error monitoring.
- Audit trail.

## 3. Critical Edge Cases

- Harga berubah saat item ada di cart.
- Produk menjadi inactive saat checkout.
- Stok habis bersamaan.
- Dua customer membeli stok terakhir.
- Pembayaran gagal.
- Order dibatalkan.
- Stok perlu dikembalikan setelah cancellation.
- Quantity desimal untuk barang timbang.
- Admin mengubah harga ketika order sedang diproses.
- Retry request menyebabkan duplicate order.
