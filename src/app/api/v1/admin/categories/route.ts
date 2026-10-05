import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "ADMIN");
    if (auth.error) return auth.error;

    const body = await req.json();
    const { name, slug, imageUrl, sortOrder = 0 } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return apiError("VALIDATION_ERROR", "Nama kategori wajib diisi", 400);
    }

    const cleanName = name.trim();
    const cleanSlug =
      (slug && String(slug).trim()) ||
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await prisma.category.findUnique({
      where: { slug: cleanSlug },
    });
    if (existing) {
      return apiError("SLUG_ALREADY_EXISTS", "Slug kategori sudah digunakan", 409);
    }

    const category = await prisma.category.create({
      data: {
        name: cleanName,
        slug: cleanSlug,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        sortOrder: Number(sortOrder) || 0,
        isActive: true,
      },
    });

    return apiSuccess(category, undefined, 201);
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal membuat kategori", 500);
  }
}
