# Toko Saudara — Development Roadmap

## Phase 0 — Foundation
- repository;
- TypeScript;
- lint;
- formatter;
- environment;
- Docker;
- CI;
- database connection.

## Phase 1 — Database & Auth
- migrations;
- seed;
- users;
- roles;
- register/login/logout;
- session;
- RBAC.

## Phase 2 — Catalog
- category;
- product;
- product unit;
- product image;
- search/filter;
- public product pages.

## Phase 3 — Inventory
- stock;
- stock adjustment;
- inventory ledger;
- low-stock;
- transaction/locking tests.

## Phase 4 — Shopping
- cart;
- address;
- checkout preview;
- pricing engine;
- shipping calculation.

## Phase 5 — Order
- create order;
- order snapshot;
- status machine;
- history;
- cancellation.

## Phase 6 — Payment
Start:
- COD;
- manual transfer.

Later:
- payment gateway.

## Phase 7 — Delivery
- delivery areas;
- fee;
- slot;
- courier;
- status.

## Phase 8 — Admin
- dashboard;
- products;
- prices;
- inventory;
- orders;
- customers;
- reports.

## Phase 9 — Growth Features
- bundles;
- promotions;
- repeat order;
- notifications;
- "Harga Hari Ini";
- "Produk Segar".

## Phase 10 — Hardening
- security tests;
- rate limits;
- audit;
- backups;
- monitoring;
- load test;
- production deployment.

## Recommended Coding Order

**Auth → Catalog → Inventory → Cart → Checkout → Order → Payment → Delivery → Admin → Reports → Growth → Hardening**

Jangan mulai dari animasi/logo atau fitur kompleks sebelum core commerce stabil.
