import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { deleteExpense } from "@/lib/accounting";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(req, ["ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    await deleteExpense(id);
    return apiSuccess({ deleted: true, id });
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal menghapus pengeluaran", 500);
  }
}
