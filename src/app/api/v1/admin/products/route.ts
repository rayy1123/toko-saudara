import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const {
      categoryId,
      sku,
      name,
      slug,
      description,
      imageUrl,
      isFresh = false,
      harvestInfo,
      units = [],
    } = body;

    if (!categoryId || !sku || !name) {
      return apiError(
        "VALIDATION_ERROR",
        "Kategori, SKU, dan nama produk wajib diisi",
        400
      );
    }

    const cleanName = String(name).trim();
    const cleanSku = String(sku).trim().toUpperCase();
    const cleanSlug =
      (slug && String(slug).trim()) ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check SKU and slug uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: cleanSku } });
    if (existingSku) {
      return apiError("SKU_ALREADY_EXISTS", `SKU ${cleanSku} sudah terdaftar`, 409);
    }
    const existingSlug = await prisma.product.findUnique({ where: { slug: cleanSlug } });
    if (existingSlug) {
      return apiError("SLUG_ALREADY_EXISTS", `Slug ${cleanSlug} sudah digunakan`, 409);
    }

    // Verify category
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return apiError("CATEGORY_NOT_FOUND", "Kategori tidak ditemukan", 404);
    }

    const createdProduct = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          categoryId,
          sku: cleanSku,
          name: cleanName,
          slug: cleanSlug,
          description: description ? String(description).trim() : null,
          imageUrl: imageUrl ? String(imageUrl).trim() : null,
          isFresh: Boolean(isFresh),
          harvestInfo: harvestInfo ? String(harvestInfo).trim() : null,
          isActive: true,
        },
      });

      if (Array.isArray(units) && units.length > 0) {
        for (const u of units) {
          const price = Number(u.price);
          const stock = Number(u.stockQuantity || 0);

          const unit = await tx.productUnit.create({
            data: {
              productId: prod.id,
              unitName: String(u.unitName).trim(),
              unitCode: String(u.unitCode || "pcs").trim(),
              quantityValue: Number(u.quantityValue || 1.0),
              quantityUnit: String(u.quantityUnit || "pcs").trim(),
              price,
              costPrice: u.costPrice !== undefined ? Number(u.costPrice) : null,
              stockQuantity: stock,
              lowStockThreshold: Number(u.lowStockThreshold || 5.0),
              isActive: true,
            },
          });

          await tx.priceHistory.create({
            data: {
              productUnitId: unit.id,
              price,
              createdBy: auth.user.id,
            },
          });

          if (stock > 0) {
            await tx.inventoryMovement.create({
              data: {
                productUnitId: unit.id,
                type: "PURCHASE",
                quantityDelta: stock,
                referenceType: "INITIAL_STOCK",
                note: "Stok awal produk baru",
                createdBy: auth.user.id,
              },
            });
          }
        }
      }

      // Log to AuditEvent for owner monitoring
      await tx.auditEvent.create({
        data: {
          actorUserId: auth.user.id,
          action: "CREATE_PRODUCT",
          resourceType: "PRODUCT",
          resourceId: prod.id,
          metadata: JSON.stringify({
            productName: prod.name,
            sku: prod.sku,
            actorRole: auth.user.role,
            actorEmail: auth.user.email,
            actorName: auth.user.profile?.name || auth.user.email,
          }),
        },
      });

      return tx.product.findUnique({
        where: { id: prod.id },
        include: {
          category: true,
          units: true,
        },
      });
    });

    return apiSuccess(createdProduct, undefined, 201);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal membuat produk", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim();
    const categoryId = searchParams.get("categoryId")?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: true,
        units: {
          orderBy: { price: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(products);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memuat produk admin", 500);
  }
}
