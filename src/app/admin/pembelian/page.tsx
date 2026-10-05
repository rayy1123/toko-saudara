"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  Boxes,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingDown,
  Building2,
  FileText,
} from "lucide-react";

interface ProductUnit {
  id: string;
  productName: string;
  unitName: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
}

interface PurchaseItemRow {
  productUnitId: string;
  quantity: number;
  costPrice: number;
}

interface PurchaseRecord {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  invoiceNumber?: string | null;
  totalAmount: number;
  paymentMethod: string;
  purchaseDate: string;
  notes?: string | null;
  items?: Array<{
    id: string;
    productName: string;
    unitName: string;
    quantity: number;
    costPrice: number;
    subtotal: number;
  }>;
}

export default function AdminPembelianPage() {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseItemRow[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchasesRes, productsRes] = await Promise.all([
        fetch("/api/v1/admin/purchases"),
        fetch("/api/v1/products?limit=100"),
      ]);

      const pData = await purchasesRes.json();
      const prData = await productsRes.json();

      if (pData.data) setPurchases(pData.data);

      if (prData.data) {
        const units: ProductUnit[] = [];
        prData.data.forEach((p: any) => {
          if (p.units) {
            p.units.forEach((u: any) => {
              units.push({
                id: u.id,
                productName: p.name,
                unitName: u.unitName,
                price: u.price,
                costPrice: u.costPrice || 0,
                stockQuantity: u.stockQuantity,
              });
            });
          }
        });
        setProductUnits(units);
      }
    } catch (err) {
      console.error("Error loading purchases data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => {
    if (productUnits.length === 0) return;
    const defaultUnit = productUnits[0];
    setItems((prev) => [
      ...prev,
      {
        productUnitId: defaultUnit.id,
        quantity: 10,
        costPrice: defaultUnit.costPrice || 2000,
      },
    ]);
  };

  const updateItemRow = (index: number, field: keyof PurchaseItemRow, val: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };

      // Auto update cost price when unit changes
      if (field === "productUnitId") {
        const selected = productUnits.find((u) => u.id === val);
        if (selected) {
          updated[index].costPrice = selected.costPrice || 2000;
        }
      }
      return updated;
    });
  };

  const removeItemRow = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalCalculated = items.reduce((sum, it) => sum + it.quantity * it.costPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      alert("Nama supplier atau petani wajib diisi");
      return;
    }
    if (items.length === 0) {
      alert("Tambahkan minimal satu produk kulakan");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        supplierName: supplierName.trim(),
        invoiceNumber: invoiceNumber.trim() || undefined,
        purchaseDate,
        paymentMethod,
        notes: notes.trim() || undefined,
        items,
      };

      const res = await fetch("/api/v1/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal mencatat pembelian");
      }

      alert("Pembelian kulakan berhasil dicatat dan stok gudang telah bertambah!");
      setShowModal(false);
      setSupplierName("");
      setInvoiceNumber("");
      setNotes("");
      setItems([]);
      loadData();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPembelianBulanIni = purchases.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2">
            <Boxes className="w-3.5 h-3.5" />
            Manajemen Pembelian & Kulakan Stok
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Pembelian dari Petani & Supplier</h1>
          <p className="text-xs text-stone-500 mt-1">
            Catat nota belanja barang masuk dari petani/pasar induk. Stok bertambah otomatis ke gudang dan tercatat sebagai HPP/modal.
          </p>
        </div>

        <button
          onClick={() => {
            addItemRow();
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Catat Kulakan Baru
        </button>
      </div>

      {/* Metric summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Total Kulakan Tercatat</span>
          <span className="text-2xl font-black text-stone-900">{formatRupiah(totalPembelianBulanIni)}</span>
          <span className="text-[11px] text-stone-400 block mt-1">Modal pembelian bahan baku & sembako</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Jumlah Transaksi Kulakan</span>
          <span className="text-2xl font-black text-blue-800">{purchases.length} Faktur</span>
          <span className="text-[11px] text-stone-400 block mt-1">Total nota dari berbagai petani & agen</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Kategori Kulakan Utama</span>
          <span className="text-sm font-extrabold text-stone-800">Petani Ciwidey, Lembang & Pasar Caringin</span>
          <span className="text-[11px] text-emerald-600 font-bold block mt-1">Rantai pasok lokal segar</span>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-black text-base text-stone-900">Riwayat Pembelian Barang Masuk</h2>
          <button
            onClick={loadData}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat data pembelian...
          </div>
        ) : purchases.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Belum ada data pembelian kulakan. Klik tombol &quot;Catat Kulakan Baru&quot; di atas untuk mencatat nota pembelian petani.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {purchases.map((p) => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-stone-900">{p.purchaseNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                      {p.paymentMethod}
                    </span>
                  </div>
                  <div className="text-xs text-stone-600 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-bold">{p.supplierName}</span>
                    {p.invoiceNumber && <span className="text-stone-400">({p.invoiceNumber})</span>}
                    <span>•</span>
                    <span>{new Date(p.purchaseDate).toLocaleDateString("id-ID")}</span>
                  </div>
                  {p.items && p.items.length > 0 && (
                    <div className="text-[11px] text-stone-500 pt-1">
                      {p.items.map((it) => `${it.productName} (${it.quantity} ${it.unitName})`).join(", ")}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <span className="font-black text-base text-stone-900 block">
                    {formatRupiah(p.totalAmount)}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    Stok gudang telah ter-update
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Catat Pembelian Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-700" />
                Catat Nota Pembelian / Kulakan Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nama Petani / Supplier *</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="Contoh: Pak Asep Petani Ciwidey"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">No. Faktur / Nota (Opsional)</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Contoh: NOTA-CW-8871"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tanggal Pembelian *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Metode Bayar *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden bg-white"
                  >
                    <option value="CASH">Tunai (Kas Toko)</option>
                    <option value="TRANSFER">Transfer Bank</option>
                  </select>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 pt-2 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-700">Daftar Produk yang Dikulak:</span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold hover:bg-emerald-200"
                  >
                    + Tambah Produk
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-stone-50 border border-stone-200">
                      <select
                        value={it.productUnitId}
                        onChange={(e) => updateItemRow(idx, "productUnitId", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white"
                      >
                        {productUnits.map((pu) => (
                          <option key={pu.id} value={pu.id}>
                            {pu.productName} ({pu.unitName}) - Stok saat ini: {pu.stockQuantity}
                          </option>
                        ))}
                      </select>

                      <div className="w-20">
                        <input
                          type="number"
                          value={it.quantity || ""}
                          onChange={(e) => updateItemRow(idx, "quantity", Number(e.target.value) || 0)}
                          placeholder="Jumlah"
                          className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs text-right"
                          min="0.1"
                          step="any"
                          required
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          value={it.costPrice || ""}
                          onChange={(e) => updateItemRow(idx, "costPrice", Number(e.target.value) || 0)}
                          placeholder="Harga Modal"
                          className="w-full px-2 py-1.5 rounded-lg border border-stone-200 text-xs text-right"
                          min="1"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-between items-baseline font-bold text-stone-800">
                  <span>Total Nilai Kulakan:</span>
                  <span className="text-base text-emerald-900 font-black">{formatRupiah(totalCalculated)}</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Sayur kualitas super, dipanen subuh tadi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-xs shadow-xs"
                >
                  {isSubmitting ? "Menyimpan & Menambah Stok..." : "Simpan Pembelian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
