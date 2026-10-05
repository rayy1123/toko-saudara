import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/db";
import { apiError, apiSuccess } from "@/lib/response";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    const userWithDetails = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        profile: true,
        addresses: {
          orderBy: { isDefault: "desc" },
        },
      },
    });

    if (!userWithDetails) {
      return apiError("USER_NOT_FOUND", "Pengguna tidak ditemukan", 404);
    }

    return apiSuccess({
      id: userWithDetails.id,
      email: userWithDetails.email,
      phone: userWithDetails.phone,
      role: userWithDetails.role,
      status: userWithDetails.status,
      profile: userWithDetails.profile,
      addresses: userWithDetails.addresses,
    });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mengambil data profil", 500);
  }
}
