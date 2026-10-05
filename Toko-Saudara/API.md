# Toko Saudara — REST API

Base URL:
`/api/v1`

## Authentication

`POST /auth/register`  
`POST /auth/login`  
`POST /auth/logout`  
`GET /auth/me`

## Categories

`GET /categories`  
`GET /categories/:id`

Admin:
`POST /admin/categories`  
`PATCH /admin/categories/:id`  
`DELETE /admin/categories/:id`

## Products

`GET /products`  
Query: `search`, `categoryId`, `sort`, `minPrice`, `maxPrice`, `page`, `limit`

`GET /products/:id`

Admin:
`POST /admin/products`  
`PATCH /admin/products/:id`  
`DELETE /admin/products/:id`

## Product Units / Pricing

`GET /products/:id/units`

Admin:
`POST /admin/products/:id/units`  
`PATCH /admin/product-units/:unitId`  
`POST /admin/prices`  
`GET /admin/prices/history`

Public:
`GET /prices/today`

## Cart

`GET /cart`  
`POST /cart/items`  
`PATCH /cart/items/:itemId`  
`DELETE /cart/items/:itemId`

## Checkout

`POST /checkout/preview`  
`POST /orders`

Server must recalculate:
- item price;
- subtotal;
- discount;
- shipping;
- grand total;
- stock.

## Orders

`GET /orders`  
`GET /orders/:id`  
`POST /orders/:id/cancel`

Admin:
`GET /admin/orders`  
`GET /admin/orders/:id`  
`PATCH /admin/orders/:id/status`

## Inventory

Admin:
`GET /admin/inventory`  
`GET /admin/inventory/:unitId/movements`  
`POST /admin/inventory/adjustments`

## Delivery

`GET /delivery/areas`  
`GET /delivery/slots`

Admin:
`POST /admin/delivery/areas`  
`PATCH /admin/delivery/areas/:id`

Courier:
`GET /courier/orders`  
`PATCH /courier/orders/:id/status`

## Promotions

`GET /promotions/active`

Admin:
`POST /admin/promotions`  
`PATCH /admin/promotions/:id`

## Reports

Admin:
`GET /admin/reports/sales`  
`GET /admin/reports/products`  
`GET /admin/reports/inventory`

## Response

Success:
```json
{
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": []
  }
}
```

## API Security

Protected endpoint:
1. authenticate;
2. authorize;
3. validate input;
4. query resource within authorized scope;
5. never trust client price/stock/ownership/status;
6. return minimum required data.

Use idempotency key for checkout/order creation where appropriate.
