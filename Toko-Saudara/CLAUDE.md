# CLAUDE.md — Toko Saudara

You are implementing **Toko Saudara**, a single-store online grocery application.

## Read First

Before coding, read:
1. PRD.md
2. SRS.md
3. ARCHITECTURE.md
4. API.md
5. DATABASE.md
6. SECURITY.md
7. UI-UX.md
8. PROJECT-STRUCTURE.md
9. ROADMAP.md

## Product Identity

Name: Toko Saudara
Tagline: Dari Pasar ke Rumah

Concept:
Traditional Indonesian grocery/produce shop experience modernized into an online store.

## Hard Rules

1. Backend is authoritative.
2. Never trust client price.
3. Never trust client total.
4. Never trust client stock.
5. Never trust client ownership.
6. Never trust client order status.
7. Every protected resource needs authorization.
8. Checkout must be transaction-safe.
9. Inventory changes must be auditable.
10. Do not leak customer data.
11. Do not invent APIs outside the documented architecture without justification.
12. Do not add unnecessary dependencies.

## Implementation Process

For each milestone:
1. inspect existing repository;
2. compare with docs;
3. create a small implementation plan;
4. implement;
5. write/update tests;
6. run typecheck;
7. run lint;
8. run tests;
9. fix failures;
10. summarize changed files and remaining risks.

## Priority

1. correctness;
2. security;
3. data consistency;
4. maintainability;
5. UX;
6. performance;
7. visual polish.

## Important Commerce Rules

Server recalculates:
- item price;
- subtotal;
- discount;
- shipping;
- grand total.

Inventory must prevent overselling according to the chosen reservation policy.

Order items must snapshot product name, unit, and price so historical orders remain stable.

## Do Not Build Yet

Unless explicitly requested:
- multi-vendor marketplace;
- AI recommendations;
- complex loyalty;
- native mobile apps;
- complex accounting;
- real-time chat;
- multi-provider logistics.

## Expected Output

When asked to implement a feature, provide:
- implementation;
- tests;
- migration if needed;
- API/UI changes;
- documentation updates;
- test/typecheck/lint results.
