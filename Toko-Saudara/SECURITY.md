# Toko Saudara — Security Specification

## Security Principle

**Backend authoritative, frontend untrusted.**

## Authentication
- Argon2id or bcrypt.
- Secure HttpOnly cookie/session.
- SameSite and Secure configured correctly.
- Login rate limit.
- Session invalidation on logout.
- Password reset must use expiring single-use tokens.

## Authorization

Roles:
- CUSTOMER
- ADMIN
- COURIER

Authorization must be server-side.

Customer A must not read customer B's order/address.
Customer must not access admin endpoints.
Courier must only access assigned delivery resources.

## BOLA / IDOR

Bad:
```sql
SELECT * FROM orders WHERE id = :id;
```

Good:
```sql
SELECT * FROM orders
WHERE id = :id
AND user_id = :authenticatedUserId;
```

Admin routes require explicit role permission.

## Price Tampering

Never accept client total as authority.

Server loads:
- active price;
- quantity;
- promotion;
- shipping;
then calculates final total.

## Stock Tampering

Client cannot set stock.
Stock adjustment is an authenticated admin operation.
Sale/reservation/release is controlled by backend.

## Order State Tampering

Client cannot set:
`DELIVERED`, `REFUNDED`, `PAID`, etc.

Use a state transition service.

## Validation

Validate:
- UUID;
- enum;
- quantity;
- amount;
- string length;
- pagination;
- upload type/size.

## Web Security

- CSRF protection for cookie-based state-changing requests.
- restrictive CORS;
- security headers;
- safe HTML rendering;
- parameterized queries/ORM;
- output encoding.

## File Upload

Product images:
- MIME allowlist;
- extension allowlist;
- size limit;
- randomized object key;
- safe image processing;
- no executable uploads.

## Rate Limits

At minimum:
- login;
- registration;
- password reset;
- checkout;
- promo validation;
- admin sensitive mutations.

## Audit Events

Record:
- security events;
- price changes;
- stock adjustments;
- order status changes;
- cancellation/refund;
- admin account changes.

## Privacy

Only expose data necessary for the current user/role.
Do not expose customer addresses or phone numbers to unrelated users.

## Secrets

Never commit:
- database password;
- session/JWT secret;
- payment secret;
- object storage secret.

Use `.env` locally and secret manager in production.

## Security Acceptance Tests

- cross-customer order access denied;
- customer → admin endpoint denied;
- price manipulation denied;
- stock manipulation denied;
- invalid order transition denied;
- duplicate checkout handled safely.
