import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "local";
    const rateLimit = checkRateLimit(`register:${ip}`, 10, 60);
    if (!rateLimit.allowed) {
      return apiError(
        "RATE_LIMIT_EXCEEDED",
        `Terlalu banyak permintaan registrasi. Coba lagi dalam ${rateLimit.resetInSeconds} detik.`,
        429
      );
    }

    const body = await req.json();
    const { email, password, name, phone, address } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return apiError("VALIDATION_ERROR", "Format email tidak valid", 400);
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return apiError(
        "VALIDATION_ERROR",
        "Kata sandi minimal 6 karakter",
        400
      );
    }
    if (!name || typeof name !== "string" || name.trim() === "") {
      return apiError("VALIDATION_ERROR", "Nama lengkap wajib diisi", 400);
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });
    if (existing) {
      return apiError("EMAIL_ALREADY_EXISTS", "Email sudah terdaftar", 409);
    }

    const passwordHash = await hashPassword(password);

    // Create user, profile, cart, and optional address
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        phone: phone ? String(phone).trim() : null,
        passwordHash,
        role: "CUSTOMER",
        status: "ACTIVE",
        profile: {
          create: {
            name: name.trim(),
            phone: phone ? String(phone).trim() : null,
          },
        },
        cart: {
          create: {},
        },
        ...(address && address.addressLine
          ? {
              addresses: {
                create: [
                  {
                    label: address.label || "Rumah",
                    recipientName: address.recipientName || name.trim(),
                    phone: address.phone || phone || "",
                    addressLine: address.addressLine,
                    district: address.district || "",
                    city: address.city || "",
                    province: address.province || "",
                    postalCode: address.postalCode || "",
                    isDefault: true,
                  },
                ],
              },
            }
          : {}),
      },
      include: {
        profile: true,
        addresses: true,
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = apiSuccess(
      {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          phone: user.phone,
          profile: user.profile,
          addresses: user.addresses,
        },
        token,
      },
      undefined,
      201
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 3600,
    });

    return response;
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Gagal mendaftarkan akun", 500);
  }
}
