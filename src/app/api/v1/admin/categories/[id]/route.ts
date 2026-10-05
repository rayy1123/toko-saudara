import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await req.json();

    const category = await prisma.category.findUnique({
      where: { id },
    });
    if (!category) {
      return apiError("CATEGORY_NOT_FOUND", "Kategori tidak ditemukan", 404);
    }

    const { name, slug, imageUrl, sortOrder, isActive } = body;

    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (slug !== undefined) data.slug = String(slug).trim();
    if (imageUrl !== undefined) data.imageUrl = imageUrl ? String(imageUrl).trim() : null;
    if (sortOrder !== undefined) data.sortOrder = Number(sortOrder);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.category.update({
      where: { id },
      data,
    });

    return apiSuccess(updated);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal memperbarui kategori", 500);
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      return apiError("CATEGORY_NOT_FOUND", "Kategori tidak ditemukan", 404);
    }

    // If products exist, soft-delete by deactivating
    if (category._count.products > 0) {
      const softDeleted = await prisma.category.update({
        where: { id },
        data: { isActive: false },
      });
      return apiSuccess({
        message: "Kategori memiliki produk terikat, status dinonaktifkan (soft delete)",
        category: softDeleted,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return apiSuccess({ message: "Kategori berhasil dihapus secara permanen" });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal menghapus kategori", 500);
  }
}
