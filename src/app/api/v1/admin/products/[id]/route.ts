import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();

    const product = await prisma.product.findUnique({
      where: { id },
    });
    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan", 404);
    }

    const {
      categoryId,
      sku,
      name,
      slug,
      description,
      imageUrl,
      isFresh,
      harvestInfo,
      isActive,
    } = body;

    const data: any = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (sku !== undefined) data.sku = String(sku).trim().toUpperCase();
    if (name !== undefined) data.name = String(name).trim();
    if (slug !== undefined) data.slug = String(slug).trim();
    if (description !== undefined) data.description = description ? String(description).trim() : null;
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl).trim() : null;
    if (isFresh !== undefined) data.isFresh = Boolean(isFresh);
    if (harvestInfo !== undefined) data.harvestInfo = harvestInfo ? String(harvestInfo).trim() : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        units: true,
      },
    });

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui produk", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const { id } = await context.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        units: true,
      },
    });

    if (!product) {
      return apiError("PRODUCT_NOT_FOUND", "Produk tidak ditemukan", 404);
    }

    // Check if any order items reference this product
    const orderItemCount = await prisma.orderItem.count({
      where: { productId: product.id },
    });

    if (orderItemCount > 0) {
      // Soft delete to protect financial/order history
      const deactivated = await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return apiSuccess({
        message: "Produk memiliki riwayat pesanan, status dinonaktifkan (soft delete)",
        product: deactivated,
      });
    }

    await prisma.product.delete({
      where: { id },
    });

    return apiSuccess({ message: "Produk berhasil dihapus secara permanen" });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menghapus produk", 500);
  }
}
