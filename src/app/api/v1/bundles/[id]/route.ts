import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/response";
import { requireRole } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            productUnit: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!bundle) {
      return apiError("NOT_FOUND", "Bundle not found", 404);
    }

    return apiSuccess(bundle);
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Failed to fetch bundle", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await req.json();

    const bundle = await prisma.bundle.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.bundlePrice !== undefined ? { bundlePrice: Number(body.bundlePrice) } : {}),
        ...(body.imageUrl !== undefined ? { imageUrl: body.imageUrl } : {}),
        ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      },
      include: {
        items: {
          include: {
            productUnit: true,
          },
        },
      },
    });

    return apiSuccess(bundle);
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Failed to update bundle", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await params;

    await prisma.bundle.update({
      where: { id },
      data: { isActive: false },
    });

    return apiSuccess({ deleted: true, id });
  } catch (error: any) {
    return apiError("SERVER_ERROR", error.message || "Failed to deactivate bundle", 500);
  }
}
