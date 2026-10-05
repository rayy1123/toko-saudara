# Toko Saudara

> **Dari Pasar ke Rumah**

Toko Saudara adalah toko sembako online dengan rasa pasar tradisional yang modern.

## What We Build

Customer dapat membeli:
- sembako;
- bahan dapur;
- sayur;
- buah;
- bumbu;
- telur;
- hasil bumi;
- paket hemat.

## Product Model

Single-store. Bukan marketplace multi-vendor.

## Recommended Technology

- Next.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma/Drizzle
- Tailwind CSS
- Redis optional
- Docker
- Object Storage
- Playwright
- Vitest/Jest

## Documents

- `PRD.md` — product requirements
- `SRS.md` — software requirements
- `ARCHITECTURE.md` — system architecture
- `API.md` — REST API
- `DATABASE.md` — database/ERD
- `SECURITY.md` — security model
- `UI-UX.md` — design requirements
- `PROJECT-STRUCTURE.md` — repository structure
- `ROADMAP.md` — coding roadmap
- `CLAUDE.md` — AI coding-agent instructions

## Definition of Done

Feature tidak dianggap selesai sebelum:
- typecheck;
- lint;
- unit tests;
- integration tests bila relevan;
- authorization test bila menyangkut resource;
- error handling;
- documentation update.

## MVP

Customer:
catalog → search → product → unit → cart → checkout → order → tracking → repeat order.

Admin:
dashboard → products → prices → inventory → orders → delivery → reports.

## Development Principle

**Correctness before convenience.**

Harga, stok, ownership, payment state, dan order state selalu diputuskan oleh backend.
