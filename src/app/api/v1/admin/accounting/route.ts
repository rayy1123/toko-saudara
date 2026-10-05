import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { getComprehensiveFinance } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const data = await getComprehensiveFinance();
    return apiSuccess(data);
  } catch (err: any) {
    console.error("Failed to load accounting data:", err);
    return apiError("SERVER_ERROR", err.message || "Gagal memuat data keuangan", 500);
  }
}
