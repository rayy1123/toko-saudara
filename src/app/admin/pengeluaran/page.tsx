"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowRight,
  TrendingDown,
  Tag,
  DollarSign,
} from "lucide-react";

interface ExpenseItem {
  id: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  paymentMethod: string;
  recordedBy?: string | null;
  notes?: string | null;
}

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  KEMASAN: { label: "Kemasan, Plastik & Kardus", icon: "🛍️" },
  LISTRIK_AIR: { label: "Listrik, Air & Kebersihan", icon: "💡" },
  TRANSPORT: { label: "Bensin & Transport Kurir", icon: "🛵" },
  SEWA: { label: "Sewa Kios & Retribusi Pasar", icon: "🏪" },
  PENDINGIN: { label: "Es Batu & Pendingin Sayur", icon: "🧊" },
  GAJI: { label: "Upah & Gaji Karyawan", icon: "👷" },
  PERALATAN: { label: "Timbangan & Perlengkapan", icon: "⚖️" },
  LAINNYA: { label: "Operasional Lainnya", icon: "📋" },
};

export default function AdminPengeluaranPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("KEMASAN");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const url =
        selectedCategory === "all"
          ? "/api/v1/admin/expenses"
          : `/api/v1/admin/expenses?category=${selectedCategory}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) setExpenses(json.data);
    } catch (err) {
      console.error("Error loading expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount <= 0) {
      alert("Deskripsi dan nominal pengeluaran wajib diisi dengan benar");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        category,
        description: description.trim(),
        amount: Number(amount),
        expenseDate,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      const res = await fetch("/api/v1/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Gagal mencatat pengeluaran");
      }

      setShowModal(false);
      setDescription("");
      setAmount(0);
      setNotes("");
      loadExpenses();
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan pengeluaran ini?")) return;
    try {
      await fetch(`/api/v1/admin/expenses/${id}`, { method: "DELETE" });
      loadExpenses();
    } catch (err) {
      alert("Gagal menghapus pengeluaran");
    }
  };

  const totalPengeluaran = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            Pencatat Biaya & Pengeluaran Toko
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">Pengeluaran Operasional</h1>
          <p className="text-xs text-stone-500 mt-1">
            Catat beban biaya toko (plastik kresek, bensin kurir, listrik, retribusi pasar, dll) untuk perhitungan laba rugi bersih toko.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Catat Pengeluaran Baru
        </button>
      </div>

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Total Pengeluaran</span>
          <span className="text-2xl font-black text-red-700">{formatRupiah(totalPengeluaran)}</span>
          <span className="text-[11px] text-stone-400 block mt-1">Akumulasi pengeluaran operasional toko</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Jumlah Transaksi Beban</span>
          <span className="text-2xl font-black text-stone-900">{expenses.length} Bukti Pengeluaran</span>
          <span className="text-[11px] text-stone-400 block mt-1">Beban operasional harian terdata</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-xs">
          <span className="text-xs font-bold text-stone-500 block mb-1">Status Pembukuan</span>
          <span className="text-sm font-extrabold text-emerald-800">Tercatat Otomatis di Laba Rugi</span>
          <span className="text-[11px] text-stone-400 block mt-1">Mengurangi omzet menjadi laba bersih</span>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-xl font-bold transition ${
            selectedCategory === "all"
              ? "bg-emerald-800 text-white"
              : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
          }`}
        >
          Semua Kategori
        </button>
        {Object.entries(CATEGORY_MAP).map(([key, val]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
              selectedCategory === key
                ? "bg-emerald-800 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>
        ))}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <h2 className="font-black text-base text-stone-900">Rincian Pengeluaran Toko</h2>
          <button
            onClick={loadExpenses}
            className="p-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Segarkan
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-stone-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Memuat catatan pengeluaran...
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-xs text-stone-400">
            Belum ada catatan pengeluaran. Klik &quot;Catat Pengeluaran Baru&quot; di atas untuk mencatat biaya toko.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {expenses.map((e) => {
              const catInfo = CATEGORY_MAP[e.category] || { label: e.category, icon: "📋" };
              return (
                <div
                  key={e.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-xl shrink-0">
                      {catInfo.icon}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-900">{e.description}</div>
                      <div className="text-xs text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-semibold text-stone-700">{catInfo.label}</span>
                        <span>•</span>
                        <span>{new Date(e.expenseDate).toLocaleDateString("id-ID")}</span>
                        <span>•</span>
                        <span className="px-2 py-0.2 rounded bg-stone-100 text-[10px] font-bold">
                          {e.paymentMethod}
                        </span>
                      </div>
                      {e.notes && <div className="text-[11px] text-stone-400 mt-0.5">{e.notes}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <span className="font-black text-base text-red-700">
                      -{formatRupiah(e.amount)}
                    </span>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                      title="Hapus Pengeluaran"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Catat Pengeluaran Baru */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-black text-lg text-stone-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-700" />
                Catat Pengeluaran Operasional Baru
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Kategori Biaya *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden bg-white"
                >
                  {Object.entries(CATEGORY_MAP).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.icon} {val.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Keterangan Pengeluaran *</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Beli kantong kresek sayur 5 pak / Isi bensin kurir"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Nominal Biaya (Rp) *</label>
                  <input
                    type="number"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value) || 0)}
                    placeholder="Contoh: 50000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Tanggal *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:border-emerald-600 focus:outline-hidden bg-white"
                >
                  <option value="CASH">Tunai (Kas Toko)</option>
                  <option value="TRANSFER">Transfer Bank / QRIS</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Catatan Tambahan (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Misal: Bon pembelian di toko plastik Bu Imas"
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
