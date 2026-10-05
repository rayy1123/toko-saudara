# Toko Saudara — System Architecture

## 1. Recommended Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Zod

### Backend
- NestJS
- TypeScript
- REST API
- PostgreSQL ORM (Prisma atau Drizzle)

### Infrastructure
- PostgreSQL
- Redis optional
- S3-compatible object storage
- Docker
- CI/CD

## 2. High-Level

```text
Customer Browser ──┐
                   ├── Web App ──> API ──> PostgreSQL
Admin Browser ─────┘                │
                                    ├── Redis
Courier Interface ────────────────> │
                                    ├── Object Storage
                                    └── Payment Provider
```

## 3. Backend Modules

```text
auth
users
customers
categories
products
product-units
pricing
inventory
cart
orders
payments
delivery
promotions
bundles
notifications
reports
audit
```

## 4. Architecture Rules

1. Backend adalah authority.
2. Frontend tidak dipercaya.
3. Harga tidak boleh berasal dari client.
4. Total tidak boleh berasal dari client.
5. Stok tidak boleh berasal dari client.
6. Ownership harus diperiksa server.
7. Order status harus melalui state machine.
8. Checkout menggunakan DB transaction.
9. Inventory menggunakan ledger.
10. Financial/order history tidak dihapus sembarangan.

## 5. Checkout Transaction

```text
BEGIN
  Load authenticated cart
  Validate products
  Lock/check inventory
  Load current server prices
  Calculate subtotal
  Validate promotions
  Calculate shipping
  Calculate grand total
  Create order
  Create order_items snapshots
  Reserve/deduct inventory according to policy
  Create payment record
  Clear cart
COMMIT
```

Jika salah satu langkah gagal: rollback.

## 6. Inventory

Gunakan:
- current stock untuk read cepat;
- inventory_movements sebagai audit ledger.

Movement types:
`PURCHASE`, `SALE`, `RESERVATION`, `RELEASE`, `ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `DAMAGE`, `RETURN`.

## 7. Project Structure

```text
toko-saudara/
├── apps/
│   ├── web/
│   └── admin/
├── services/
│   └── api/
├── packages/
│   ├── ui/
│   ├── types/
│   └── config/
├── docs/
├── prisma-or-drizzle/
├── docker/
├── tests/
├── .env.example
├── docker-compose.yml
├── package.json
└── README.md
```

Untuk MVP boleh menggunakan satu Next.js app dengan area `/` dan `/admin`.

## 8. Deployment

MVP:
- HTTPS;
- web container;
- API container;
- managed PostgreSQL;
- object storage;
- database backup;
- monitoring.

Secrets hanya melalui environment/secret manager.
