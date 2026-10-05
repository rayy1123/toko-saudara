# Toko Saudara — PostgreSQL Database Design

## Core Tables

### users
`id, email, phone, password_hash, role, status, created_at, updated_at`

### customer_profiles
`user_id, name, phone, created_at, updated_at`

### addresses
`id, user_id, label, recipient_name, phone, address_line, district, city, province, postal_code, latitude, longitude, is_default`

### categories
`id, name, slug, image_url, is_active, sort_order`

### products
`id, category_id, sku, name, slug, description, image_url, is_active, is_fresh, harvest_info, created_at, updated_at`

### product_units
`id, product_id, unit_name, unit_code, quantity_value, quantity_unit, price, cost_price, stock_quantity, low_stock_threshold, is_active`

### price_history
`id, product_unit_id, price, valid_from, valid_until, created_by, created_at`

### inventory_movements
`id, product_unit_id, type, quantity_delta, reference_type, reference_id, note, created_by, created_at`

### carts
`id, user_id, created_at, updated_at`

### cart_items
`id, cart_id, product_unit_id, quantity, created_at, updated_at`

### orders
`id, order_number, user_id, address_snapshot, subtotal, discount_total, shipping_fee, grand_total, payment_status, order_status, notes, created_at, updated_at`

### order_items
`id, order_id, product_id, product_unit_id, product_name_snapshot, unit_name_snapshot, unit_price, quantity, subtotal`

### order_status_history
`id, order_id, from_status, to_status, changed_by, note, created_at`

### payments
`id, order_id, method, status, amount, provider_reference, paid_at, created_at`

### deliveries
`id, order_id, method, status, scheduled_date, slot_start, slot_end, courier_id, tracking_note`

### delivery_areas
`id, name, shipping_fee, min_order_amount, is_active`

### promotions
`id, name, code, type, value, min_order_amount, max_discount, starts_at, ends_at, is_active`

### bundles
`id, name, description, bundle_price, image_url, is_active`

### bundle_items
`id, bundle_id, product_unit_id, quantity`

### audit_events
`id, actor_user_id, action, resource_type, resource_id, metadata, ip_address, user_agent, created_at`

## Relationships

```text
users 1──1 customer_profiles
users 1──N addresses
users 1──1 carts
carts 1──N cart_items
categories 1──N products
products 1──N product_units
product_units 1──N price_history
product_units 1──N inventory_movements
users 1──N orders
orders 1──N order_items
orders 1──N order_status_history
orders 1──1 payments
orders 1──1 deliveries
bundles 1──N bundle_items
product_units 1──N bundle_items
users 1──N audit_events
```

## Constraints

- UUID primary keys recommended.
- SKU unique.
- Product slug unique.
- Order number unique.
- Quantity supports decimal.
- Money uses NUMERIC or integer smallest currency unit consistently.
- Foreign keys enforced.
- Index frequently queried columns.
- Never hard-delete historical order/payment/inventory records.

## Suggested Indexes

- products(category_id, is_active)
- products(slug)
- product_units(product_id, is_active)
- orders(user_id, created_at)
- orders(order_status, created_at)
- inventory_movements(product_unit_id, created_at)
- price_history(product_unit_id, valid_from, valid_until)
