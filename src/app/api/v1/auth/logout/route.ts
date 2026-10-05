import { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/response";

export async function POST(_req: NextRequest) {
  const response = apiSuccess({ message: "Logout berhasil" });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
