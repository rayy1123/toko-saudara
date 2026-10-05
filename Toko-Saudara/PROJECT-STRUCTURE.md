# Toko Saudara — Project Structure

Recommended monorepo:

```text
toko-saudara/
├── apps/
│   ├── web/                 # customer storefront
│   └── admin/               # admin dashboard
│
├── services/
│   └── api/                 # backend REST API
│
├── packages/
│   ├── ui/                  # shared components
│   ├── types/               # shared TypeScript types
│   ├── validation/          # shared schemas
│   └── config/              # shared configuration
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── tests/
│   ├── integration/
│   ├── e2e/
│   └── security/
│
├── docs/
│   ├── PRD.md
│   ├── SRS.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── UI-UX.md
│   ├── ROADMAP.md
│   └── PROJECT-STRUCTURE.md
│
├── docker/
├── .env.example
├── docker-compose.yml
├── package.json
├── README.md
└── CLAUDE.md
```

## Backend Modules

```text
src/modules/
├── auth/
├── users/
├── customers/
├── categories/
├── products/
├── pricing/
├── inventory/
├── cart/
├── checkout/
├── orders/
├── payments/
├── delivery/
├── promotions/
├── bundles/
├── notifications/
├── reports/
└── audit/
```

## Frontend

```text
app/
├── page.tsx
├── products/
├── categories/
├── cart/
├── checkout/
├── orders/
├── account/
└── admin/
```

## Testing

Business-critical flows:
- auth;
- authorization;
- product visibility;
- cart;
- price calculation;
- inventory concurrency;
- checkout;
- order transitions;
- cancellation/refund;
- admin permissions.
