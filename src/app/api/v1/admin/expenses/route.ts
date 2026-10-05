import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { createExpense, getExpenses } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 100;

    const expenses = await getExpenses({ category, limit });
    return apiSuccess(expenses);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal memuat daftar pengeluaran", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { category, description, amount, expenseDate, paymentMethod, notes } = body;

    if (!category || !description || !amount || Number(amount) <= 0) {
      return apiError(
        "VALIDATION_ERROR",
        "Kategori, deskripsi, dan nominal pengeluaran wajib diisi dengan benar",
        400
      );
    }

    const expense = await createExpense({
      category,
      description,
      amount: Number(amount),
      expenseDate,
      paymentMethod,
      recordedBy: auth.user.email,
      notes,
    });

    return apiSuccess(expense, undefined, 201);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal mencatat pengeluaran", 500);
  }
}
