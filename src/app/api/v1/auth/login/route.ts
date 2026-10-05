import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { verifyPassword, createToken, hashPassword } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateLimit = checkRateLimit(`login:${ip}`, 30, 60);
    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Terlalu banyak percobaan login. Coba lagi dalam ${rateLimit.resetInSeconds} detik.`,
        429
      );
    }

    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return apiError("VALIDATION_ERROR", "Email dan kata sandi wajib diisi", 400);
    }

    const cleanEmail = String(email).trim().toLowerCase();
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        profile: true,
      },
    });

    // Auto-provision default staff accounts if not yet created in database
    if (!user) {
      if (cleanEmail === "pemilik@tokosaudara.id") {
        const hash = await hashPassword("PemilikSaudara123!");
        user = await prisma.user.create({
          data: {
            email: "pemilik@tokosaudara.id",
            phone: "082246193969",
            passwordHash: hash,
            role: "ADMIN", // Owner role
            status: "ACTIVE",
            profile: {
              create: { name: "Pemilik Toko Saudara", phone: "082246193969" },
            },
          },
          include: { profile: true },
        });
      } else if (cleanEmail === "kasir@tokosaudara.id") {
        const hash = await hashPassword("KasirSaudara123!");
        user = await prisma.user.create({
          data: {
            email: "kasir@tokosaudara.id",
            phone: "082246193969",
            passwordHash: hash,
            role: "CASHIER", // Cashier role
            status: "ACTIVE",
            profile: {
              create: { name: "Kasir Toko Saudara", phone: "082246193969" },
            },
          },
          include: { profile: true },
        });
      } else if (cleanEmail === "admin@tokosaudara.id") {
        const hash = await hashPassword("AdminSaudara123!");
        user = await prisma.user.create({
          data: {
            email: "admin@tokosaudara.id",
            phone: "082246193969",
            passwordHash: hash,
            role: "ADMIN",
            status: "ACTIVE",
            profile: {
              create: { name: "Bang Saudara (Admin Toko)", phone: "082246193969" },
            },
          },
          include: { profile: true },
        });
      }
    }

    if (!user) {
      return apiError("INVALID_CREDENTIALS", "Email atau kata sandi salah", 401);
    }

    if (user.status !== "ACTIVE") {
      return apiError("ACCOUNT_SUSPENDED", "Akun Anda sedang dinonaktifkan", 403);
    }

    const isMatch = await verifyPassword(String(password), user.passwordHash);
    if (!isMatch) {
      return apiError("INVALID_CREDENTIALS", "Email atau kata sandi salah", 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        profile: user.profile,
      },
      token,
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal melakukan login", 500);
  }
}
