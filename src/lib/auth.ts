import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiError } from "@/lib/response";

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || "toko-saudara-super-secret-key-2026-dari-pasar-ke-rumah";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export interface JWTPayload {
  sub: string; // userId
  email: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: { userId: string; email: string; role: string }): Promise<string> {
  return new SignJWT({
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: (payload.email as string) || "",
      role: (payload.role as string) || "CUSTOMER",
    };
  } catch {
    return null;
  }
}

export function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = req.cookies.get("auth_token")?.value;
  if (cookieToken) {
    return cookieToken.trim();
  }
  return null;
}

export async function extractUser(req: NextRequest) {
  const token = extractToken(req);
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      profile: true,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return user;
}

export type AuthUser = NonNullable<Awaited<ReturnType<typeof extractUser>>>;

export async function requireAuth(req: NextRequest): Promise<
  { user: AuthUser; error: null } | { user: null; error: ReturnType<typeof apiError> }
> {
  const user = await extractUser(req);
  if (!user) {
    return {
      user: null,
      error: apiError("UNAUTHORIZED", "Autentikasi diperlukan. Silakan login terlebih dahulu.", 401),
    };
  }
  return { user, error: null };
}

export async function requireRole(
  req: NextRequest,
  roles: string | string[]
): Promise<
  { user: AuthUser; error: null } | { user: null; error: ReturnType<typeof apiError> }
> {
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return authResult;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!allowedRoles.includes(authResult.user.role)) {
    return {
      user: null,
      error: apiError("FORBIDDEN", "Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.", 403),
    };
  }

  return authResult;
}
