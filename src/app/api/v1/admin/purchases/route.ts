import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/response";
import { createSupplierPurchase, getSupplierPurchases } from "@/lib/accounting";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const purchases = await getSupplierPurchases(100);
    return apiSuccess(purchases);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal memuat daftar pembelian kulakan", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, ["ADMIN", "CASHIER"]);
    if (auth.error) return auth.error;

    const body = await req.json();
    const { supplierName, invoiceNumber, paymentMethod, notes, purchaseDate, items } = body;

    if (!supplierName || !items || !Array.isArray(items) || items.length === 0) {
      return apiError(
        "VALIDATION_ERROR",
        "Nama supplier/petani dan daftar produk kulakan wajib diisi",
        400
      );
    }

    const purchase = await createSupplierPurchase({
      supplierName,
      invoiceNumber,
      paymentMethod,
      notes,
      purchaseDate,
      items,
      recordedBy: auth.user.email,
    });

    return apiSuccess(purchase, undefined, 201);
  } catch (err: any) {
    return apiError("SERVER_ERROR", err.message || "Gagal mencatat pembelian kulakan", 500);
  }
}
